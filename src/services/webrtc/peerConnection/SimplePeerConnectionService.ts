import Peer from 'simple-peer';
import {IPeerConnectionService} from "./RawPeerConnectionService.ts";
import {DataChannelData, newBinaryData, newTextData} from "../../../types.ts";
import {ISignalingService} from "../signaling/ISignalingService.ts";
import {DefaultSignalAdapter} from "../adapters/ISignalAdapter.ts";

export class SimplePeerConnectionService implements IPeerConnectionService {
    private peers: Map<string, Peer.Instance> = new Map();
    private dataHandlers: ((data: DataChannelData) => void)[] = [];

    private adapter = new DefaultSignalAdapter();

    constructor(private signalingService: ISignalingService) {
        this.signalingService.onSignal((remoteDeviceId, signalData) => {
            const peerData = this.adapter.deserialize(signalData);
            this.handleIncomingSignal(remoteDeviceId, peerData);
        });
    }

    private dataHandlerWrapper(
        data: string | Buffer | Uint8Array,
        handler: (msg: DataChannelData) => void
    ) {
        if (typeof data === 'string') {
            handler(newTextData(data));
        } else {
            const view = data instanceof Uint8Array ? data : new Uint8Array(data);
            const ab = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
            handler(newBinaryData(ab));
        }
    }

    addDataHandler(handler: (data: DataChannelData) => void): void {
        this.dataHandlers.push(handler);
        for (const peer of this.peers.values()) {
            peer.on("data", (data) => this.dataHandlerWrapper(data, handler));
        }
    }

    removeDataHandler(handler: (data: DataChannelData) => void): void {
        this.dataHandlers = this.dataHandlers.filter(h => h !== handler);
        for (const peer of this.peers.values()) {
            peer.off("data", handler);
        }
    }

    async sendData(remoteDeviceId: string, data: DataChannelData): Promise<void> {
        let peer = this.peers.get(remoteDeviceId);
        if (!peer) {
            // If no connection exists yet, create one as the initiator.
            peer = this.createPeer(remoteDeviceId, true);
            this.peers.set(remoteDeviceId, peer);
        }

        // If the peer is already connected, send immediately.
        if (peer.connected) {
            peer.send(data.data);
        } else {
            // Otherwise, wait for connection before sending.
            await new Promise<void>((resolve, reject) => {
                peer.once("connect", () => {
                    try {
                        peer!.send(data.data);
                        resolve();
                    } catch (err) {
                        reject(err);
                    }
                });
            });
        }
    }

    private createPeer(remoteDeviceId: string, initiator: boolean): Peer.Instance {
        const peer = new Peer({ initiator, trickle: true, objectMode: true });
        // When the peer emits a signal (offer/answer or ICE candidate), forward it using the signaling service.
        peer.on("signal", (signalData) => {
            const data = this.adapter.serialize(signalData);
            this.signalingService.sendSignal(remoteDeviceId, data);
        });
        // Attach all existing data handlers to this peer.
        for (const handler of this.dataHandlers) {
            peer.on("data", (data) => this.dataHandlerWrapper(data, handler));
        }
        peer.on("error", (err) => {
            console.error(`Peer error with ${remoteDeviceId}:`, err);
        });
        return peer;
    }

    private handleIncomingSignal(remoteDeviceId: string, signalData: Peer.SignalData) {
        let peer = this.peers.get(remoteDeviceId);
        if (!peer || peer.destroyed) {
            // If no peer exists yet, create one as the non-initiator.
            peer = this.createPeer(remoteDeviceId, false);
            this.peers.set(remoteDeviceId, peer);
        }

        // Optionally, if signalData is an ICE candidate, check if candidate string is empty.
        if (signalData.type === "candidate" && !signalData.candidate) {
            console.warn("Received an empty candidate signal; ignoring.");
            return;
        }

        try {
            peer.signal(signalData);
        } catch (err) {
            console.error("Error signaling peer:", err);
        }
    }

    getMaxMessageSize(remoteDeviceId: string): number | undefined {
        const peer = this.peers.get(remoteDeviceId);
        const sctp = (peer as any)._pc.sctp;
        console.log(`maxMessageSize: ${sctp?.maxMessageSize}`);
        return sctp?.maxMessageSize;
    }
}