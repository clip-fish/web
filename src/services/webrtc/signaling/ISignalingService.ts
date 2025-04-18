// ISignalingService.ts
import {Signal} from "../../../types.ts";

export interface ISignalingService {
    sendSignal(remoteDeviceId: string, signalData: Signal): void;
    onSignal(callback: (remoteDeviceId: string, signalData: Signal) => void): void;
}
