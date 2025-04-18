import Peer from "simple-peer";
import {newDescriptionSignal, newIceCandidateSignal, Signal, SignalType} from "../../../types.ts";

interface ISignalAdapter {
    serialize(data: Peer.SignalData): Signal;
    deserialize(signal: Signal): Peer.SignalData;
}

export class DefaultSignalAdapter implements ISignalAdapter {
    serialize(data: Peer.SignalData): Signal {
        if ("sdp" in data) {
            return newDescriptionSignal(data as RTCSessionDescriptionInit);
        } else if (data.type === 'candidate') {
            const init: RTCIceCandidateInit = {
                candidate: data.candidate.candidate,
                sdpMid: data.candidate.sdpMid!,
                sdpMLineIndex: data.candidate.sdpMLineIndex!
            };
            return newIceCandidateSignal(init);
        } else {
            throw new Error("Unknown signal type");
        }
    }

    deserialize(signal: Signal): Peer.SignalData {
        if (signal.type === SignalType.RTCSessionDescriptionInit) {
            return signal.signal as RTCSessionDescriptionInit;
        }

        const init = signal.signal as RTCIceCandidateInit;
        const iceCandidate = new RTCIceCandidate(init);
        return {
            type: 'candidate',
            candidate: iceCandidate
        };
    }
}
