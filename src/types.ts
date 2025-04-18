import {ITimestamp} from "./models/timestamp/ITimestamp.ts";

export interface Device {
    id: string;
    userAgent: string;
    name: string;
    joinedAt: ITimestamp;
    lastActiveAt: ITimestamp;
}

export enum SignalType {
    RTCSessionDescriptionInit = "RTCSessionDescriptionInit",
    RTCIceCandidateInit = "RTCIceCandidateInit",
}

export interface Signal {
    signal: RTCSessionDescriptionInit | RTCIceCandidateInit;
    type: SignalType;
}

export const newDescriptionSignal = (signal: RTCSessionDescriptionInit): Signal =>
    ({ signal, type: SignalType.RTCSessionDescriptionInit });

export const newIceCandidateSignal = (signal: RTCIceCandidateInit): Signal =>
    ({ signal, type: SignalType.RTCIceCandidateInit });

export enum FullSignalType {
    Offer = "offer",
    Answer = "answer",
    Candidate = "candidate",
}

export const getFullSignalType = (signal: Signal): FullSignalType => {
    switch (signal.type) {
        case SignalType.RTCSessionDescriptionInit:
            return (signal.signal as RTCSessionDescriptionInit).type === "offer" ? FullSignalType.Offer : FullSignalType.Answer;
        case SignalType.RTCIceCandidateInit:
            return FullSignalType.Candidate;
        default:
            throw new Error("Unknown signal type");
    }
}

export enum DataChannelDataType {
    Text = "text",
    Binary = "binary",
}

export interface DataChannelData {
    data: string | ArrayBuffer;
    type: DataChannelDataType;
}

export const newTextData = (data: string): DataChannelData =>
    ({ data, type: DataChannelDataType.Text });

export const newBinaryData = (data: ArrayBuffer): DataChannelData =>
    ({ data, type: DataChannelDataType.Binary });
