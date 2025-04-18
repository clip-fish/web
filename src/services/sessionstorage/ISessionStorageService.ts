import {Device} from "../../types.ts";
import {Message} from "../../models/Message.ts";
import {ITimestamp} from "../../models/timestamp/ITimestamp.ts";

export interface ISessionStorageService {
    createTimestamp(): ITimestamp;
    createSessionIfNotExists(sessionId: string): Promise<void>;
    deleteSession(sessionId: string): Promise<void>;
    addDevice(sessionId: string, device: string, deviceName: string): Promise<void>;
    addMessage(sessionId: string, message: Message): Promise<void>;
    subscribeToDeviceUpdates(sessionId: string, callback: (devices: Device[]) => void): () => void;
    subscribeToMessageUpdates(sessionId: string, callback: (messages: Message[]) => void): () => void;
}