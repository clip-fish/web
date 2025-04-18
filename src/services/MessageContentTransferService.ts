import {IPeerConnectionService} from "./webrtc/peerConnection/RawPeerConnectionService.ts";
import {
    ActionType,
    ContentRequestMessage,
    ContentResponseMessage,
    ErrorResponse,
    MessageType,
    ResponseStatus,
    SuccessResponse,
    TransferStartedResponse
} from "../models/ContentTransferMessage.ts";
import {convertBinaryToUuid, convertUuidToBinary} from "../utils/fileUtils.ts";
import {DataChannelData, DataChannelDataType, newBinaryData, newTextData} from "../types.ts";
import {Config} from "../config/config.ts";

export interface IMessageContentTransferService {
    /**
     * Requests the content for a given message from a remote peer.
     * @param messageId - The identifier of the message.
     * @param isFile
     * @param senderDeviceId - The device ID that originated the message.
     * @param timeout
     * @param progressCallback - (Optional) A callback that receives progress updates (0 to 100).
     * @returns A promise that resolves to the content (string or Blob) or an Error.
     */
    requestContent(
        messageId: string,
        isFile: boolean,
        senderDeviceId: string,
        timeout: number,
        progressCallback?: (progress: number) => void,
    ): Promise<string | Blob | Error>;

    /**
     * Sets the content request fulfiller used when responding to content requests.
     */
    setContentRequestFulfiller(contentRequestFulfiller: IContentRequestFulfiller): void;
}

export interface IContentRequestFulfiller {
    onContentRequest(messageId: string): Promise<string | Blob>;
}

export class MessageContentTransferService {
    constructor(
        private deviceId: string,
        private peerConnectionService: IPeerConnectionService,
    ) {
        this.peerConnectionService.addDataHandler(this.handleIncomingData.bind(this));
    }

    private static DEFAULT_MAX_TRANSFER_SIZE = Config.defaultMaxTransferSize;
    // Fixed header: 16 bytes for messageId (binary UUID), 4 for index, 4 for totalChunks.
    private static HEADER_SIZE = 16 + 4 + 4; // 24 bytes total
    private static DEFAULT_CHUNK_SIZE = MessageContentTransferService.DEFAULT_MAX_TRANSFER_SIZE - MessageContentTransferService.HEADER_SIZE;
    private static MAX_CHUNK_SIZE = Config.maxMessageChunkSize;

    private getChunkSize(remoteDeviceId: string): number {
        const maxSize = this.peerConnectionService.getMaxMessageSize(remoteDeviceId);
        return Math.min(MessageContentTransferService.MAX_CHUNK_SIZE, (maxSize ? (maxSize - MessageContentTransferService.HEADER_SIZE) : MessageContentTransferService.DEFAULT_CHUNK_SIZE));
    }

    private contentRequestFulfiller?: IContentRequestFulfiller;
    public setContentRequestFulfiller(contentRequestFulfiller: IContentRequestFulfiller) {
        this.contentRequestFulfiller = contentRequestFulfiller;
    }

    private pendingRequests: Map<string, (response: string | Blob | Error) => void> = new Map();
    private progressCallbacks: Map<string, (progress: number) => void> = new Map();
    private incomingTransfers: Map<string, { chunks: Array<ArrayBuffer | undefined>; totalChunks: number }> = new Map();

    public async requestContent(
        messageId: string,
        isFile: boolean,
        senderDeviceId: string,
        timeout: number = Config.messageLoadTimeout,
        progressCallback?: (progress: number) => void,
    ): Promise<string | Blob | Error> {
        let timeoutTimer: ReturnType<typeof setTimeout> | undefined;
        if (progressCallback) {
            let initialProgressReceived = false;
            const wrappedProgress = (progress: number) => {
                if (!initialProgressReceived && progress > 0) {
                    initialProgressReceived = true;
                    if (timeoutTimer !== undefined) {
                        clearTimeout(timeoutTimer);
                        timeoutTimer = undefined;
                    }
                }
                progressCallback(progress);
            };
            this.progressCallbacks.set(messageId, wrappedProgress);
        }

        const request: ContentRequestMessage = {
            messageId,
            requester: this.deviceId,
            action: ActionType.REQUEST,
            type: MessageType.CONTENT_TRANSFER,
        };
        await this.peerConnectionService.sendData(senderDeviceId, newTextData(JSON.stringify(request)));

        if (isFile) {
            // For file transfers, set an initial timeout that only applies until progress is reported.
            return new Promise((resolve, reject) => {
                // Start the timeout timer.
                timeoutTimer = setTimeout(() => {
                    reject(new Error("Timeout waiting for initial progress"));
                }, timeout);
                this.waitForResponse(messageId)
                    .then((result) => {
                        // If the promise resolves, clear the timer.
                        if (timeoutTimer !== undefined) {
                            clearTimeout(timeoutTimer);
                        }
                        resolve(result);
                    })
                    .catch(reject);
            });
        } else {
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Timeout waiting for response")), timeout)
            );
            return await Promise.race([this.waitForResponse(messageId), timeoutPromise]);
        }
    }

    private waitForResponse(messageId: string): Promise<string | Blob | Error> {
        return new Promise((resolve) => {
            this.pendingRequests.set(messageId, resolve);
        });
    }

    private handleIncomingData(data: DataChannelData): void {
        if (data.type === DataChannelDataType.Text) {
            const text: string = data.data as string;
            try {
                const msg = JSON.parse(text);
                if (msg.action === ActionType.REQUEST) this.handleContentRequest(msg);
                else if (msg.action === ActionType.RESPONSE) this.handleContentResponse(msg);
                else console.warn("Unknown action in message:", msg.action);
            } catch (err) {
                console.error("Failed to parse JSON:", err);
            }
        } else if (data.type === DataChannelDataType.Binary) {
            this.handleBinaryChunk(data.data as ArrayBuffer);
        } else {
            console.error("Unknown data type:", data.type);
        }
    }

    private async handleBinaryChunk(chunk: ArrayBuffer): Promise<void> {
        // Firefox will use Blobs instead of ArrayBuffers for some reason.
        // If chunk is a Blob, convert it to an ArrayBuffer.
        if (chunk instanceof Blob) {
            try {
                chunk = await chunk.arrayBuffer();
            } catch (error) {
                console.error("Error converting Blob to ArrayBuffer:", error);
                return;
            }
        }

        if (chunk.byteLength < MessageContentTransferService.HEADER_SIZE) {
            console.error("Received chunk too small to contain header");
            return;
        }
        const view = new DataView(chunk);

        // Extract the header.
        const uuidBytes = new Uint8Array(chunk, 0, 16);
        const messageId = convertBinaryToUuid(uuidBytes);
        const chunkIndex = view.getUint32(16);
        const totalChunks = view.getUint32(20);

        // Extract the actual chunk data and copy it.
        const dataView = new Uint8Array(chunk, MessageContentTransferService.HEADER_SIZE);
        const dataCopy = dataView.slice(); // Creates a new Uint8Array that doesn't reference the original buffer

        // Initialize a transfer if one doesn't exist for this messageId.
        if (!this.incomingTransfers.has(messageId)) {
            this.incomingTransfers.set(messageId, {chunks: new Array(totalChunks), totalChunks});
        }
        const transfer = this.incomingTransfers.get(messageId)!;
        transfer.chunks[chunkIndex] = dataCopy.buffer; // store the new buffer copy

        // Call the progress callback.
        if (this.progressCallbacks.has(messageId)) {
            const progress = (transfer.chunks.filter(Boolean).length / totalChunks) * 100;
            this.progressCallbacks.get(messageId)!(progress);
        }

        // Check if all chunks have been received.
        if (transfer.chunks.filter(Boolean).length === totalChunks) {
            const blob = new Blob(transfer.chunks as ArrayBuffer[], {type: "application/octet-stream"});
            const pending = this.pendingRequests.get(messageId);
            if (pending) {
                pending(blob);
                this.pendingRequests.delete(messageId);
            }
            this.incomingTransfers.delete(messageId);
        }
    }

    private handleContentResponse(response: ContentResponseMessage): void {
        const { messageId } = response;
        let result: string | Error;
        // If this is a file transfer start, store metadata and do not immediately resolve.
        if (response.status === ResponseStatus.TRANSFER_STARTED) {
            // Initialize a new transfer session with the provided metadata.
            this.incomingTransfers.set(messageId, {
                chunks: new Array(response.totalChunks),
                totalChunks: response.totalChunks,
            });
            return;
        } else if (response.status === ResponseStatus.SUCCESS) {
            result = response.text;
        } else if (response.status === ResponseStatus.ERROR) {
            result = new Error(response.error);
            console.error(`Error in content transfer: ${JSON.stringify(response)}`);
        } else {
            console.error("Unknown response type:", response);
            return;
        }
        // For text messages or if transfer completed:
        const pending = this.pendingRequests.get(messageId);
        if (pending) {
            pending(result);
            this.pendingRequests.delete(messageId);
        } else {
            console.warn(`No pending content request for messageId ${messageId}`);
        }
    }

    private async handleContentRequest(request: ContentRequestMessage): Promise<void> {
        const { messageId, requester } = request;
        let content: string | Blob | undefined;
        try {
            if (this.contentRequestFulfiller) {
                content = await this.contentRequestFulfiller.onContentRequest(messageId);
            } else {
                console.error("No contentRequestFulfiller set");
            }
        } catch (err) {
            console.error("Error fetching content for request", err);
        }

        // Send error response if cannot load message content
        if (!content) {
            const errorResponse: ErrorResponse = {
                type: MessageType.CONTENT_TRANSFER,
                action: ActionType.RESPONSE,
                messageId,
                status: ResponseStatus.ERROR,
                error: "Content not found"
            };
            await this.peerConnectionService.sendData(requester, newTextData(JSON.stringify(errorResponse)));
            return;
        }

        if (typeof content === "string") {
            // For text content, send as a single message.
            const response: SuccessResponse = {
                type: MessageType.CONTENT_TRANSFER,
                action: ActionType.RESPONSE,
                messageId,
                status: ResponseStatus.SUCCESS,
                text: content,
            };
            await this.peerConnectionService.sendData(requester, newTextData(JSON.stringify(response)));
        } else {
            const chunkSize = this.getChunkSize(requester);
            console.log("[handleContentRequest] blob:", content);
            // For file content (Blob), perform chunking.
            const totalSize = content.size;
            const totalChunks = Math.ceil(totalSize / chunkSize);
            // First, send a metadata response to initiate file transfer.
            const metadata: TransferStartedResponse = {
                type: MessageType.CONTENT_TRANSFER,
                status: ResponseStatus.TRANSFER_STARTED,
                action: ActionType.RESPONSE,
                messageId,
                contentSize: totalSize,
                totalChunks,
                chunkSize: chunkSize,
            };
            await this.peerConnectionService.sendData(requester, newTextData(JSON.stringify(metadata)));
            await this.sendBlobAsChunks(requester, messageId, content);
        }
    }

    private async sendBlobAsChunks(to: string, messageId: string, blob: Blob): Promise<void> {
        const chunkSize = this.getChunkSize(to);
        const totalChunks = Math.ceil(blob.size / chunkSize);
        let offset = 0;
        let chunkIndex = 0;
        while (offset < blob.size) {
            const chunkBlob = blob.slice(offset, offset + chunkSize);
            const arrayBufferChunk = await chunkBlob.arrayBuffer();
            // Create a combined buffer that prepends a fixed-size header to the chunk data.
            const chunkBuffer = this.createChunkBuffer(messageId, chunkIndex, totalChunks, arrayBufferChunk);
            // Send the combined chunk (header + binary data) over the data channel.
            await this.peerConnectionService.sendData(to, newBinaryData(chunkBuffer));

            offset += chunkSize;
            chunkIndex++;
        }
    }

    private createChunkBuffer(
        messageId: string,
        index: number,
        totalChunks: number,
        chunkData: ArrayBuffer
    ): ArrayBuffer {
        const headerBuffer = new ArrayBuffer(MessageContentTransferService.HEADER_SIZE);
        const view = new DataView(headerBuffer);

        // Convert the UUID into a fixed-length binary representation.
        // This function should return a Uint8Array of length 16.
        const uuidBytes = convertUuidToBinary(messageId);
        new Uint8Array(headerBuffer).set(uuidBytes, 0);

        // Write the chunk index and totalChunks as 32-bit unsigned integers.
        view.setUint32(16, index);
        view.setUint32(20, totalChunks);

        // Create a new Uint8Array for the combined data.
        const combined = new Uint8Array(MessageContentTransferService.HEADER_SIZE + chunkData.byteLength);
        combined.set(new Uint8Array(headerBuffer), 0);
        combined.set(new Uint8Array(chunkData), MessageContentTransferService.HEADER_SIZE);

        return combined.buffer;
    }
}
