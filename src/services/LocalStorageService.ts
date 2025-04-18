// src/services/LocalStorageService.ts
import localforage from "localforage";
import {Message, MessageType} from "../models/Message.ts";

export interface ILocalStorageService {
    setMessageContent(messageId: string, content: string | Blob): Promise<void>;
    setMessageContentFromMessage(message: Message): Promise<void>;
    getMessageContent(messageId: string): Promise<string | Blob | undefined>;
    deleteMessageContent(messageId: string): Promise<void>;

    getDeviceId(): Promise<string | undefined>;
    setDeviceId(deviceId: string): Promise<void>;
    getSessionId(): Promise<string | undefined>;
    setSessionId(sessionId: string): Promise<void>;

    clearDeviceId(): Promise<void>;
    clearSessionId(): Promise<void>;

    clearSession(): Promise<void>;
}

export class LocalStorageService implements ILocalStorageService {
    constructor() {
        localforage.config({
            name: "clip-fish-web",
            storeName: "clip-fish-web",
            driver: localforage.INDEXEDDB,
        });
    }

    private sessionIdKey = "sessionId";
    private deviceIdKey = "deviceId";

    public async setMessageContent(messageId: string, content: string | Blob): Promise<void> {
        await localforage.setItem(messageId, content);
    }

    public async setMessageContentFromMessage(message: Message): Promise<void> {
        if (message.type === MessageType.TEXT) {
            await localforage.setItem(message.id, message.text);
        } else if (message.type === MessageType.FILE) {
            const buffer = await message.blob!.arrayBuffer();
            await localforage.setItem(message.id, buffer);
        }
    }

    public async getMessageContent(messageId: string): Promise<string | Blob | undefined> {
        const content = await localforage.getItem(messageId);
        if (content === null || content === undefined) {
            return undefined;
        }
        if (typeof content === "string") {
            return content;
        } else if (content instanceof ArrayBuffer) {
            return new Blob([content]);
        } else if (content instanceof Blob) {
            return content;
        } else {
            return content as string | Blob;
        }
    }

    public async deleteMessageContent(messageId: string): Promise<void> {
        await localforage.removeItem(messageId);
    }

    async getDeviceId(): Promise<string | undefined> {
        return (await localforage.getItem(this.deviceIdKey)) as string | null ?? undefined;
    }

    async setDeviceId(deviceId: string): Promise<void> {
        await localforage.setItem(this.deviceIdKey, deviceId);
    }

    async getSessionId(): Promise<string | undefined> {
        return (await localforage.getItem(this.sessionIdKey)) as string | null ?? undefined;
    }

    async setSessionId(sessionId: string): Promise<void> {
        await localforage.setItem(this.sessionIdKey, sessionId);
    }

    clearDeviceId(): Promise<void> {
        return localforage.removeItem(this.deviceIdKey);
    }

    clearSessionId(): Promise<void> {
        return localforage.removeItem(this.sessionIdKey);
    }

    clearSession(): Promise<void> {
        return localforage.clear();
    }
}
