import {FileMessage, Message} from "../models/Message.ts";
import {IMessagesRepository} from "./MessagesRepository.ts";
import {getDeviceId, getDeviceName} from "../utils/deviceUtils.ts";
import {Device} from "../types.ts";
import {ILocalStorageService} from "../services/LocalStorageService.ts";
import {v4 as uuidv4} from "uuid";
import {ISessionStorageService} from "../services/sessionstorage/ISessionStorageService.ts";
import {ITimestamp} from "../models/timestamp/ITimestamp.ts";

export interface ISessionRepository {
    /**
     * Initializes the session (creates/join session, sets up listeners, etc.)
     * @param onNavigate
     * @param urlSessionId an optional session ID from the URL.
     */
    initializeSession(onNavigate: (url: string) => void, urlSessionId?: string): Promise<void>;

    /**
     * Sends a message (text or file) to the session.
     */
    sendMessage(message: Message): Promise<void>;

    /**
     * Retrieves the file content for a file message. It either gets it from local storage
     * or requests it via WebRTC.
     */
    getOrRetrieveFile(message: FileMessage): Promise<Blob | undefined>;

    getSessionId(): string;
    getDeviceId(): string;
    getDeviceName(): string;

    getSessionLink(): string;
    getIsLandingPage(): boolean;

    subscribeToMessages(callback: (messages: Message[]) => void): Promise<() => void>;
    subscribeToDevices(callback: (devices: Device[]) => void): Promise<() => void>;


    clearSession(): void;
    newSession(onNavigate: (url: string) => void, newSessionId: string): Promise<void>;

    clearDeviceId(): void;

    createTimestamp(): ITimestamp;
}

export class SessionRepository implements ISessionRepository {
    constructor(
        private sessionStorageService: ISessionStorageService,
        private localStorageService: ILocalStorageService,
        private initMessagesRepo: (sessionId: string, deviceId: string) => IMessagesRepository,
    ) {
        // Create a promise that will be resolved once messagesRepository is set
        this.repositoryInitialized = new Promise((resolve) => {
            this.resolveMessagesRepo = resolve;
            this.resolveDevicesRepo = resolve;
        });
    }

    private messagesRepository?: IMessagesRepository;

    private sessionId: string = "";
    private deviceId: string = "";
    private deviceName: string = "";
    private sessionLink: string = "";
    private isLandingPage: boolean = true;

    private repositoryInitialized: Promise<void>;
    private resolveMessagesRepo!: () => void;
    private resolveDevicesRepo!: () => void;

    public async initializeSession(onNavigate: (url: string) => void, urlSessionId: string | undefined): Promise<void> {
        let newSessionId;
        if (urlSessionId) {
            newSessionId = urlSessionId;
        } else {
            newSessionId = await this.localStorageService.getSessionId() || uuidv4();
        }
        this.sessionId = newSessionId;
        this.sessionLink = `${window.location.origin}/session/${newSessionId}`;

        console.log(`[initializeSession] Session ID: ${this.sessionId}`);

        onNavigate(`/session/${newSessionId}`);

        this.deviceId = getDeviceId();
        this.deviceName = getDeviceName();

        console.log(`[initializeSession] Device ID: ${this.deviceId}`);
        console.log(`[initializeSession] Device Name: ${this.deviceName}`);

        this.messagesRepository = this.initMessagesRepo(this.sessionId, this.deviceId);

        this.resolveMessagesRepo();
        this.resolveDevicesRepo();

        await this.localStorageService.setSessionId(newSessionId)

        await this.sessionStorageService.createSessionIfNotExists(newSessionId);
        await this.sessionStorageService.addDevice(newSessionId, this.deviceId, this.deviceName);
    };

    public async sendMessage(message: Message): Promise<void> {
        await this.localStorageService?.setMessageContentFromMessage(message)
        await this.sessionStorageService.addMessage(this.sessionId, message);
    }

    public async getOrRetrieveFile(message: FileMessage): Promise<Blob | undefined> {
        let result: Blob | undefined;
        try {
            result = await this.messagesRepository!.getOrRetrieveFile(message);
        } catch(e) {
            console.error("Error retrieving file:", e);
            throw e;
        }

        return result;
    }

    public getSessionId(): string {
        return this.sessionId;
    }

    public getDeviceId(): string {
        return this.deviceId;
    }

    public getDeviceName(): string {
        return this.deviceName;
    }

    getIsLandingPage(): boolean {
        return this.isLandingPage;
    }

    getSessionLink(): string {
        return this.sessionLink;
    }

    public async clearSession(sessionId: string = this.sessionId): Promise<void> {
        this.localStorageService?.clearSession();
        await this.sessionStorageService.deleteSession(sessionId);
    };

    public async newSession(onNavigate: (url: string) => void, newSessionId: string = uuidv4()): Promise<void> {
        await this.clearSession();
        await this.initializeSession(onNavigate, newSessionId);
    };

    public clearDeviceId() {
        // localStorage.removeItem("deviceId");
        this.localStorageService?.clearDeviceId()
    };

    public async subscribeToMessages(callback: (messages: Message[]) => void): Promise<() => void> {
        if (!this.messagesRepository) {
            await this.repositoryInitialized;
        }
        return this.messagesRepository!.subscribeToMessages(callback);
    }

    // TODO trigger refresh when devices empty
    public async subscribeToDevices(callback: (devices: Device[]) => void): Promise<() => void> {
        if (!this.messagesRepository) {
            await this.repositoryInitialized;
        }
        return this.sessionStorageService.subscribeToDeviceUpdates(this.sessionId, (devices) => {
            if (devices.length > 1) this.isLandingPage = false;
            callback(devices)
        });
    }

    createTimestamp(): ITimestamp {
        return this.sessionStorageService.createTimestamp();
    }
}