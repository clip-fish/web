export enum MessageType {
    CONTENT_TRANSFER = "contentTransfer"
}

export enum ActionType {
    REQUEST = "request",
    RESPONSE = "response",
}

export interface BaseContentTransferMessage {
    type: MessageType.CONTENT_TRANSFER;
    messageId: string;
    action: ActionType;
}

export interface ContentRequestMessage extends BaseContentTransferMessage {
    action: ActionType.REQUEST;
    requester: string;
}

export enum ResponseStatus {
    SUCCESS = "success",
    ERROR = "error",
    TRANSFER_STARTED = "transferStarted",
}

export interface BaseContentResponseMessage extends BaseContentTransferMessage {
    action: ActionType.RESPONSE;
    status: ResponseStatus;
}

export interface SuccessResponse extends BaseContentResponseMessage {
    status: ResponseStatus.SUCCESS;
    text: string;
}

export interface ErrorResponse extends BaseContentResponseMessage {
    status: ResponseStatus.ERROR;
    error: string;
}

export interface TransferStartedResponse extends BaseContentResponseMessage {
    status: ResponseStatus.TRANSFER_STARTED;
    contentSize: number;
    totalChunks: number;
    chunkSize: number;
}

export type ContentResponseMessage =
    | SuccessResponse
    | ErrorResponse
    | TransferStartedResponse;

export type ContentTransferMessage = ContentRequestMessage | ContentResponseMessage;



export type ChunkHeader = {
    messageId: string;
    index: number;
    size: number;
}
