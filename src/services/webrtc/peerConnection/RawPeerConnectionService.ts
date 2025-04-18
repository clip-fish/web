import {ISignalingService} from "../signaling/ISignalingService.ts";
import {DataChannelData, FullSignalType, getFullSignalType, Signal} from "../../../types.ts";
import {RawPeerConnection} from "./RawPeerConnection.ts";

export interface IPeerConnectionService {
    addDataHandler(handler: (data: DataChannelData) => void): void;
    removeDataHandler?(handler: (data: DataChannelData) => void): void;
    sendData(remoteDeviceId: string, data: DataChannelData): Promise<void>;

    getMaxMessageSize(remoteDeviceId: string): number | undefined;
}

export class RawPeerConnectionService implements IPeerConnectionService {
    private dataHandlers: ((data: DataChannelData) => void)[] = [];
    private _peerConnectionsMap: Map<string, RawPeerConnection> = new Map();

    private getOrCreatePeerConnection(remoteDeviceId: string, descriptionType?: FullSignalType): RawPeerConnection {
        const isOffer = descriptionType === FullSignalType.Offer;
        let peerConnection = this._peerConnectionsMap.get(remoteDeviceId);
        const shouldCheckConnection = isOffer;
        if (!peerConnection || (shouldCheckConnection && (!peerConnection?.isConnected() || !peerConnection?.isDataChannelOpen()))) {
            // TODO this should not be necessary, but the listeners for connection and data channel open are not being called
            this._peerConnectionsMap.get(remoteDeviceId)?.closeConnection();

            const newConnection = new RawPeerConnection(
                this.deviceId,
                remoteDeviceId,
                (data) => {
                    this.dataHandlers.forEach((handler) => handler(data));
                },
                (signal) => this.signalingService.sendSignal(remoteDeviceId, signal),
                isOffer,
            );
            this._peerConnectionsMap.set(remoteDeviceId, newConnection);
            peerConnection = this._peerConnectionsMap.get(remoteDeviceId)!;
        }
        return peerConnection;
    }

    constructor(
        private deviceId: string,
        private signalingService: ISignalingService,
    ) {
        this.signalingService.onSignal((remoteDeviceId, signalData) => this.handleSignal(remoteDeviceId, signalData));
    }

    private handleSignal(remoteDeviceId: string, signal: Signal) {
        const fullSignalType = getFullSignalType(signal);
        const peerConnection = this.getOrCreatePeerConnection(remoteDeviceId, fullSignalType);
        try {
            peerConnection.handleSignal(signal);
        } catch (err) {
            console.error("Error signaling peer:", err);
        }
    }

    addDataHandler(handler: (data: DataChannelData) => void): void {
        this.dataHandlers.push(handler);
        for (const value of this._peerConnectionsMap.values()) {
            value.addDataHandler(handler);
        }
    }

    removeDataHandler?(handler: (data: DataChannelData) => void): void {
        for (const value of this._peerConnectionsMap.values()) {
            value.removeDataHandler(handler);
        }
    }

    async sendData(remoteDeviceId: string, data: DataChannelData): Promise<void> {
        this.getOrCreatePeerConnection(remoteDeviceId).send(data);
    }

    getMaxMessageSize(remoteDeviceId: string): number | undefined {
        return this._peerConnectionsMap.get(remoteDeviceId)?.maxMessageSize();
    }
}
