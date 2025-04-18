import axios from 'axios';
import io from 'socket.io-client';
import { ISessionStorageService } from "./ISessionStorageService.ts";
import {BaseMessage, FileMessage, Message, MessageStatus, MessageType, TextMessage} from "../../models/Message.ts";
import { Device } from "../../types.ts";
import {ExpressTimestamp} from "../../models/timestamp/ExpressTimestamp.ts";
import {ITimestamp} from "../../models/timestamp/ITimestamp.ts";

export interface ExpressMessage {
    id: string;
    type: MessageType;
    sender: string;
    senderName: string;
    sentAt: string;
    status: MessageStatus;
    filename?: string;
    fileSize?: number;
}

export function toExpress(message: Message): ExpressMessage {
    const base: ExpressMessage = {
        id: message.id,
        type: message.type,
        sender: message.sender,
        senderName: message.senderName,
        sentAt: message.sentAt.toISOString(),
        status: message.status,
    };

    return (message.type === MessageType.TEXT)
        ? base
        : { ...base, filename: message.filename, fileSize: message.fileSize }
}

export function fromExpress(expressMsg: ExpressMessage): Message {
    const base: BaseMessage = {
        id: expressMsg.id,
        type: expressMsg.type,
        sender: expressMsg.sender,
        senderName: expressMsg.senderName,
        sentAt: ExpressTimestamp.fromSerializable(expressMsg.sentAt),
        status: expressMsg.status,
    };

    return (expressMsg.type === MessageType.TEXT)
        ? base as TextMessage
        : { ...base, filename: expressMsg.filename, fileSize: expressMsg.fileSize } as FileMessage
}

export interface ExpressDevice {
    id: string;
    userAgent: string;
    name: string;
    joinedAt: string;
    lastActiveAt: string;
}

export function newExpressDevice(deviceId: string, deviceName: string): ExpressDevice {
    return {
        id: deviceId,
        userAgent: navigator.userAgent,
        lastActiveAt: ExpressTimestamp.now().toSerializable()!,
        joinedAt: ExpressTimestamp.now().toSerializable()!,
        name: deviceName,
    };
}

export function fromExpressDevice(expressDevice: ExpressDevice): Device {
    return {
        id: expressDevice.id,
        userAgent: expressDevice.userAgent,
        name: expressDevice.name,
        lastActiveAt: ExpressTimestamp.fromSerializable(expressDevice.lastActiveAt),
        joinedAt: ExpressTimestamp.fromSerializable(expressDevice.joinedAt),
    };
}

export class ExpressSessionStorageService implements ISessionStorageService {
    private socket;
    constructor(private serverUrl: string) {
        this.socket = io(this.serverUrl);
    }

    async createSessionIfNotExists(sessionId: string): Promise<void> {
        await axios.post(`${this.serverUrl}/session`, { sessionId });
    }

    async deleteSession(sessionId: string): Promise<void> {
        await axios.delete(`${this.serverUrl}/session/${sessionId}`);
    }

    async addDevice(sessionId: string, deviceId: string, deviceName: string): Promise<void> {
        await axios.post(`${this.serverUrl}/session/${sessionId}/device`, newExpressDevice(deviceId, deviceName));
    }

    async addMessage(sessionId: string, message: Message): Promise<void> {
        // Use the conversion function before sending.
        const expressMessage: ExpressMessage = toExpress(message);
        await axios.post(`${this.serverUrl}/session/${sessionId}/message`, expressMessage);
    }

    subscribeToDeviceUpdates(sessionId: string, callback: (devices: Device[]) => void): () => void {
        // Join the session room.
        this.socket.emit("joinSession", sessionId);
        this.socket.on("deviceUpdates",
            ((expressDevices: ExpressDevice[]) =>
                callback(expressDevices.map((expressDevice: ExpressDevice) => fromExpressDevice(expressDevice)))));
        return () => this.socket.off("deviceUpdates", callback);
    }

    subscribeToMessageUpdates(sessionId: string, callback: (messages: Message[]) => void): () => void {
        this.socket.emit("joinSession", sessionId);
        this.socket.on("messageUpdates",
            (expressMessages: ExpressMessage[]) =>
                callback(expressMessages.map((msg: ExpressMessage) => fromExpress(msg))));
        return () => this.socket.off("messageUpdates");
    }

    createTimestamp(): ITimestamp {
        return ExpressTimestamp.now();
    }
}
