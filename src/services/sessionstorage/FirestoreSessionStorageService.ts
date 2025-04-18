import {ISessionStorageService} from "./ISessionStorageService.ts";
import {BaseMessage, FileMessage, Message, MessageType, TextMessage} from "../../models/Message.ts";
import {Device} from "../../types.ts";
import {FirestoreMessage, FirestoreService} from "../FirestoreService.ts";
import {ITimestamp} from "../../models/timestamp/ITimestamp.ts";
import {MyFirestoreTimestamp} from "../../models/timestamp/FirestoreTimestamp.ts";
import {Config} from "../../config/config.ts";

export function toFirestore(message: Message): FirestoreMessage {
    const base: FirestoreMessage = {
        id: message.id,
        type: message.type,
        sender: message.sender,
        senderName: message.senderName,
        sentAt: message.sentAt.toSerializable(),
        status: message.status,
    };

    return (message.type === MessageType.TEXT)
        ? Config.storeTextMessageContent ? { ...base, text: message.text } : { ...base }
        : { ...base, filename: message.filename, fileSize: message.fileSize }
}

export function fromFirestore(fsMessage: FirestoreMessage): Message {
    const base: BaseMessage = {
        id: fsMessage.id,
        type: fsMessage.type,
        sender: fsMessage.sender,
        senderName: fsMessage.senderName,
        sentAt: MyFirestoreTimestamp.fromSerializable(fsMessage.sentAt),
        status: fsMessage.status,
    };

    return (fsMessage.type === MessageType.TEXT)
        ? Config.storeTextMessageContent ? { ...base, text: fsMessage.text } as TextMessage : base as TextMessage
        : { ...base, filename: fsMessage.filename, fileSize: fsMessage.fileSize } as FileMessage
}

export class FirestoreSessionStorageService implements ISessionStorageService {
    constructor(
        private firestoreService: FirestoreService,
    ) {}

    addDevice(sessionId: string, deviceId: string, deviceName: string): Promise<void> {
        return this.firestoreService.addDeviceToSession(sessionId, deviceId, deviceName);
    }

    addMessage(sessionId: string, message: Message): Promise<void> {
        return this.firestoreService.sendMessage(sessionId, toFirestore(message));
    }

    createSessionIfNotExists(sessionId: string): Promise<void> {
        return this.firestoreService.createSessionIfNotExists(sessionId);
    }

    deleteSession(sessionId: string): Promise<void> {
        return this.firestoreService.deleteSession(sessionId);
    }

    subscribeToDeviceUpdates(sessionId: string, callback: (devices: Device[]) => void): () => void {
        return this.firestoreService.listenForDeviceUpdates(sessionId, callback);
    }

    subscribeToMessageUpdates(sessionId: string, callback: (messages: Message[]) => void): () => void {
        return this.firestoreService.listenForMessageUpdates(
            sessionId,
            (messages) => callback(messages.map((msg) => fromFirestore(msg))),
        );
    }

    createTimestamp(): ITimestamp {
        return MyFirestoreTimestamp.now();
    }
}