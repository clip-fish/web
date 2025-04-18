import { FirestoreService } from "../../FirestoreService.ts";
import {ISignalingService} from "./ISignalingService.ts";
import {Signal} from "../../../types.ts";

export class FirestoreSignalingService implements ISignalingService {
    private readonly sessionId: string;
    private readonly deviceId: string;
    private firestoreService: FirestoreService;

    constructor(
        sessionId: string,
        deviceId: string,
        firestoreService: FirestoreService
    ) {
        this.sessionId = sessionId;
        this.deviceId = deviceId;
        this.firestoreService = firestoreService;
    }

    public sendSignal(remoteDeviceId: string, signalData: Signal): void {
        this.firestoreService.sendSignal(
            this.sessionId,
            this.deviceId,
            remoteDeviceId,
            signalData
        );
    }

    public onSignal(
        callback: (remoteDeviceId: string, signalData: Signal) => void
    ): void {
        this.firestoreService.listenForSignals(
            this.sessionId,
            this.deviceId,
            callback,
        );
    }
}
