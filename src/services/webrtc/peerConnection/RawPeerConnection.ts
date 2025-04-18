import {
    DataChannelData,
    DataChannelDataType,
    FullSignalType,
    getFullSignalType,
    newBinaryData,
    newDescriptionSignal, newIceCandidateSignal,
    newTextData,
    Signal,
    SignalType
} from "../../../types.ts";

export class RawPeerConnection {
    private rtcPeerConnection: RTCPeerConnection;
    private messageQueue: Array<DataChannelData> = [];
    private readonly isPolite: boolean;
    private currentlyMakingOffer: boolean = false;
    private ignoreOffer: boolean = false;
    private isSettingRemoteAnswerPending : boolean = false;

    private dataChannel: RTCDataChannel | undefined;

    private messageHandlers: ((data: DataChannelData) => void)[] = [];

    public addDataHandler(handler: (data: DataChannelData) => void) {
        this.messageHandlers.push(handler);
    }

    public removeDataHandler(handler: (data: DataChannelData) => void) {
        this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    }

    public isDataChannelOpen = (): boolean => (!!this.dataChannel && this.dataChannel?.readyState === "open")
    public isConnected = () => this.rtcPeerConnection.connectionState === "connected"
    public isConnectionValid = () => this.isConnected() && this.isDataChannelOpen()

    public maxMessageSize = () => this.rtcPeerConnection.sctp?.maxMessageSize

    constructor(
        private deviceId: string,
        private remoteDeviceId: string,
        onData: (data: DataChannelData) => void,
        private sendSignal: (signal: Signal) => void,
        responding: boolean = true,
    ) {
        this.addDataHandler(onData);

        this.isPolite = this.deviceId < this.remoteDeviceId;

        const configuration: RTCConfiguration = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

        this.rtcPeerConnection = new RTCPeerConnection(configuration);

        this.rtcPeerConnection.onnegotiationneeded = async () => { await this.negotiate(); };
        this.rtcPeerConnection.onicecandidate = ({candidate}) => { this.sendICECandidate(candidate); };
        this.rtcPeerConnection.oniceconnectionstatechange = () => { this.onICEStateChange(); };
        this.rtcPeerConnection.onconnectionstatechange = () => { this.onConnectionStateChange(); };

        if (!responding) {
            this.dataChannel = this.rtcPeerConnection.createDataChannel("dataChannel", { ordered: false });
            this.setupDataChannel();
        }
    }

    private setupDataChannel = () => {
        this.dataChannel!.onopen = () => {
            this.sendMessagesInQueue();
        };

        this.dataChannel!.onclose = () => {
            this.closeConnection();
        };

        this.dataChannel!.onmessage = (event) => {
            this.messageHandlers.forEach(handler =>
                handler(typeof event.data === "string" ? newTextData(event.data) : newBinaryData(event.data)));
        };

        this.dataChannel!.onerror = (error) => {
            console.error("[pc.onerror] There was an error on the data channel: ", error);
        };
    }

    handleSignal = async (signal: Signal) => {
        // This code is very similar to the code at https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation
        const signalType = getFullSignalType(signal);

        // ICE
        if (signalType === FullSignalType.Candidate) {
            try {
                await this.rtcPeerConnection.addIceCandidate(signal.signal as RTCIceCandidateInit);
            } catch (error) {
                if (!this.ignoreOffer) throw error;
            }
        } else {
            // Description
            const description = signal.signal as RTCSessionDescriptionInit

            const readyForOffer =
                !this.currentlyMakingOffer &&
                (this.rtcPeerConnection.signalingState !== "stable" || this.isSettingRemoteAnswerPending);
            const offerCollision = signalType === FullSignalType.Offer && !readyForOffer;
            this.ignoreOffer = !this.isPolite && offerCollision;
            if (this.ignoreOffer) {
                return;
            }

            this.isSettingRemoteAnswerPending = description.type == "answer";

            await this.rtcPeerConnection.setRemoteDescription(description);

            this.isSettingRemoteAnswerPending = false;

            if (signalType === FullSignalType.Offer) {
                // Offer
                if (this.rtcPeerConnection.ondatachannel === null) {
                    this.rtcPeerConnection.ondatachannel = (event) => {
                        this.dataChannel = event.channel;
                        this.setupDataChannel();
                    };
                }

                await this.rtcPeerConnection.setLocalDescription();

                if (!this.rtcPeerConnection.localDescription) throw console.error("The local description is null, even though that should be impossible.");
                this.sendSignal(newDescriptionSignal(this.rtcPeerConnection.localDescription))
            }
        }
    }

    private onConnectionStateChange = () => {
        if (this.rtcPeerConnection.connectionState === "closed") {
            this.closeConnection();
        }
    }

    private negotiate = async () => {
        // This code is very similar to the code at https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation
        try {
            this.currentlyMakingOffer = true;
            await this.rtcPeerConnection.setLocalDescription();
            const signal: Signal = {
                signal: this.rtcPeerConnection.localDescription!,
                type: SignalType.RTCSessionDescriptionInit,
            };
            this.sendSignal(signal)
        } catch (error) {
            console.error(error);
        } finally {
            this.currentlyMakingOffer = false;
        }
    }

    // TODO this is almost always broken
    private onICEStateChange = () => {
        // This code is very similar to the code at https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation
        if (this.rtcPeerConnection.iceConnectionState === "failed") {
            console.error(`[pc.onICEStateChange] The ICE connection state is failed.`);
            this.rtcPeerConnection.restartIce();
        } else if (this.rtcPeerConnection.iceConnectionState === "closed") {
            console.error(`[pc.onICEStateChange] The ICE connection state is closed. Closing the connection.`);
            this.closeConnection();
        }
    }

    private sendICECandidate = (candidate: RTCIceCandidate | null) => {
        if (candidate) this.sendSignal(newIceCandidateSignal(candidate))
        else console.log("The candidate was null.");
    }

    public closeConnection = () => {
        console.log(`[pc.closeConnection] closeConnection was called.`);

        this.rtcPeerConnection.close();

        this.sendSignal = (() => {});
        this.messageHandlers = [];
        this.dataChannel?.close()
    }

    public send = (message: DataChannelData) => {
        if (this.dataChannel && this.isDataChannelOpen()) {
            if (message.type === DataChannelDataType.Text) this.dataChannel.send(message.data as string);
            else if (message.type === DataChannelDataType.Binary) this.dataChannel.send(message.data as ArrayBuffer);
        } else {
            this.messageQueue.push(message);
            console.warn(`[pc.send] The data channel is not yet open for ${this.remoteDeviceId}, so the message was queued and will be sent when the data channel is open.`);
        }
    }

    private sendMessagesInQueue = () => {
        if (this.dataChannel && this.isDataChannelOpen()) {
            while (this.messageQueue.length) {
                const message = this.messageQueue.shift();
                if (message) {
                    // this.dataChannel.send(message.type === DataChannelDataType.Text ? message.data as string : message.data as ArrayBuffer);
                    if (message.type === DataChannelDataType.Text) this.dataChannel.send(message.data as string);
                    else if (message.type === DataChannelDataType.Binary) this.dataChannel.send(message.data as ArrayBuffer);
                }
            }
        } else {
            throw console.error("The messages in the message queue shouldn't be being sent yet.");
        }
    }
}