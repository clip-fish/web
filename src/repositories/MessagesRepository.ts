// src/repositories/MessagesRepository.ts
import {IContentRequestFulfiller, IMessageContentTransferService,} from "../services/MessageContentTransferService.ts";
import {errorStatus, FileMessage, loadedStatus, loadingStatus, Message, MessageType} from "../models/Message.ts";
import {LocalStorageService} from "../services/LocalStorageService.ts";
import {SortedMap} from "../utils/SortedMap.ts";
import {ISessionStorageService} from "../services/sessionstorage/ISessionStorageService.ts";
import {Config} from "../config/config.ts";

/**
 * IMessagesRepository provides an interface for subscribing to message updates
 * and retrieving file content.
 */
export interface IMessagesRepository extends IContentRequestFulfiller {
    /**
     * Subscribes to message updates.
     * @param callback - A function that receives the updated list of messages.
     * @returns A function to unsubscribe from the updates.
     */
    subscribeToMessages(callback: (messages: Message[]) => void): Promise<() => void>;

    /**
     * Retrieves the file content for a given file message.
     * @param message - A FileMessage for which the content is required.
     * @returns A Promise that resolves to a Blob representing the file content.
     */
    getOrRetrieveFile(message: FileMessage): Promise<Blob | undefined>;
}

/**
 * MessagesRepository handles retrieving messages from Firestore,
 * updating their content via local storage or remote requests, and
 * notifying subscribers.
 */
export class MessagesRepository implements IMessagesRepository {
    constructor(
        private sessionId: string,
        private localStorageService: LocalStorageService,
        private messageContentTransferService: IMessageContentTransferService,
        private sessionStorageService: ISessionStorageService,
    ) {
        messageContentTransferService.setContentRequestFulfiller(this);
    }

    private subscribers: ((messages: Message[]) => void)[] = [];
    private messagesCollection = new SortedMap<Message>((a, b) => b.sentAt.toSeconds() - a.sentAt.toSeconds());

    /**
     * Notifies all subscribers with a fresh copy of the current messages.
     * @param msgs - Array of current messages.
     */
    private triggerMessageUpdate(msgs: Message[]): void {
        // Create a new array instance to force consumers to re-render.
        const freshMessages = [...msgs];
        this.subscribers.forEach((callback) => callback(freshMessages));
    }

    /**
     * Fetches and updates the content of a message.
     * First, it attempts to retrieve the content from local storage.
     * If not found, it requests the content from the remote service,
     * then saves it locally if successful.
     * @param msg - The message to update.
     */
    private async fetchAndUpdateContent(msg: Message): Promise<void> {
        let content: string | Blob | Error | undefined;
        // Attempt to retrieve content from local storage.
        content = await this.localStorageService.getMessageContent(msg.id);

        if (!content) {
            try {
                // If not found, request content from the remote sender.
                content = await this.messageContentTransferService.requestContent(msg.id, msg.type === MessageType.FILE, msg.sender, Config.messageLoadTimeout, (requestContentProgress) => {
                    console.log("[fetchAndUpdateContent] requestContent progress:", requestContentProgress);
                    const updatedMsg =
                        msg.type === MessageType.TEXT
                            ? { ...msg, text: content as string, status: loadingStatus(requestContentProgress) }
                            : { ...msg, blob: content as Blob, status: loadingStatus(requestContentProgress) };
                    // Update collection and notify subscribers.
                    this.messagesCollection.addOrUpdate(updatedMsg);
                    this.triggerMessageUpdate(this.messagesCollection.getAll());
                });

                if (content instanceof Error) {
                    const updatedMsg =
                        msg.type === MessageType.TEXT
                            ? { ...msg, status: errorStatus(content.message) }
                            : { ...msg, status: errorStatus(content.message) };
                    // Update collection and notify subscribers.
                    this.messagesCollection.addOrUpdate(updatedMsg);
                    this.triggerMessageUpdate(this.messagesCollection.getAll());
                    throw content;
                }

                // Save the content locally if it’s valid.
                if (content) {
                    await this.localStorageService.setMessageContent(msg.id, content);
                    const updatedMsg =
                        msg.type === MessageType.TEXT
                            ? { ...msg, status: loadedStatus() }
                            : { ...msg, status: loadedStatus() };
                    // Update collection and notify subscribers.
                    this.messagesCollection.addOrUpdate(updatedMsg);
                    this.triggerMessageUpdate(this.messagesCollection.getAll());
                } else {
                    const err = `Error retrieving content for ${msg.id}: No content`;
                    console.error(err);
                    throw new Error(err);
                }
            } catch (error) {
                console.error(`Error fetching content for ${msg.id}`, error);
            }
        }

        // Build updated message.
        let updatedMsg: Message;
        if (content instanceof Error || !content) {
            const err = `Error retrieving content for ${msg.id}: ${content instanceof Error ? content.message : "No content"}`;
            updatedMsg = { ...msg, status: errorStatus(err) };
            console.error(err);
        } else {
            updatedMsg =
                msg.type === MessageType.TEXT
                    ? { ...msg, text: content as string, status: loadedStatus() }
                    : { ...msg, blob: content as Blob, status: loadedStatus() };
        }

        // Update collection and notify subscribers.
        this.messagesCollection.addOrUpdate(updatedMsg);
        this.triggerMessageUpdate(this.messagesCollection.getAll());
    }

    /**
     * Subscribes to Firestore message updates.
     * Converts incoming messages to a loading state, then fetches content asynchronously.
     * @param callback - Function to call with the updated messages.
     * @returns A function to unsubscribe.
     */
    public async subscribeToMessages(callback: (messages: Message[]) => void): Promise<() => void> {
        this.subscribers.push(callback);

        // Subscribe to Firestore message updates.
        const unsubscribeMessages = this.sessionStorageService.subscribeToMessageUpdates(this.sessionId, (msgs) => {
            msgs.forEach((msg: Message) => {
                const loadingMsg = { ...msg, status: loadingStatus() };
                this.messagesCollection.addOrUpdate(loadingMsg);
                this.fetchAndUpdateContent(loadingMsg);
            });
            this.triggerMessageUpdate(this.messagesCollection.getAll());
        });

        return () => {
            unsubscribeMessages();
            this.subscribers = this.subscribers.filter((cb) => cb !== callback);
        };
    }

    /**
     * Retrieves file content for a FileMessage.
     * If the file blob is not present, it requests it from the remote service.
     * @param message - The file message.
     * @returns A promise that resolves to a Blob.
     */
    public async getOrRetrieveFile(message: FileMessage): Promise<Blob | undefined> {
        this.fetchAndUpdateContent(message).catch(error => {
            console.error(`Error fetching content for ${message.id}`, error);
        })
        return message.blob;
    }

    /**
     * Handles content requests from the remote side.
     * @param messageId - The ID of the message whose content is requested.
     * @returns A promise that resolves to the message content (string or Blob).
     */
    async onContentRequest(messageId: string): Promise<string | Blob> {
        const content = await this.getContent(messageId);
        if (!content) {
            return Promise.reject("Error loading content");
        }
        return Promise.resolve(content);
    }

    /**
     * Retrieves content (text or blob) for a given message ID.
     * @param messageId - The message identifier.
     * @returns The content if available.
     */
    private async getContent(messageId: string): Promise<string | Blob | undefined> {
        const msg = this.messagesCollection.getById(messageId);
        return msg ? (msg.type === MessageType.TEXT ? msg.text : msg.blob) : undefined;
    }
}
