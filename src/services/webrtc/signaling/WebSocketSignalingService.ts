// WebSocketSignalingChannel.ts
import {ISignalingService} from "./ISignalingService.ts";
import {Signal} from "../../../types.ts";

interface WSMessage {
    sessionId: string;
    sender: string;
    receiver: string;
    type: string; // "offer", "answer", "candidate"
    signal: Signal;
}

/**
 * A WebSocket-based implementation of the signaling channel.
 */
export class WebSocketSignalingService implements ISignalingService {
    private ws: WebSocket;
    private callback?: (remoteDeviceId: string, signalData: Signal) => void;

    /**
     * @param sessionId - The current session identifier.
     * @param deviceId - This device’s identifier.
     * @param wsUrl - The WebSocket server URL.
     */
    constructor(
        private sessionId: string,
        private deviceId: string,
        wsUrl: string
    ) {
        this.ws = new WebSocket(wsUrl);
        this.ws.onopen = () => {
            console.log("WebSocket signaling channel connected");
            const joinMsg = {
                action: "join",
                sessionId: this.sessionId,
                deviceId: this.deviceId,
            };
            this.ws.send(JSON.stringify(joinMsg));
        };

        this.ws.onmessage = async (event: MessageEvent) => {
            let messageText: string;
            if (event.data instanceof Blob) {
                try {
                    messageText = await event.data.text();
                } catch (err) {
                    console.error("Error reading Blob as text", err);
                    return;
                }
            } else if (typeof event.data === "string") {
                messageText = event.data;
            } else {
                console.warn("Received message that is neither string nor Blob:", event.data);
                return;
            }

            if (!messageText.trim()) {
                console.warn("Received empty message:", messageText);
                return;
            }

            try {
                const msg: WSMessage = JSON.parse(messageText);
                // Only process messages for this session and intended for this device.
                if (msg.sessionId === this.sessionId && msg.receiver === this.deviceId) {
                    if (this.callback) {
                        this.callback(msg.sender, msg.signal);
                    }
                } else {
                    // console.warn(`Ignoring message not intended for this device | this: ${deviceId}, to: ${msg.receiver}, from: ${msg.sender}`);
                }
            } catch (err) {
                console.error("Error processing WebSocket message", err);
            }
        };

        this.ws.onerror = (err) => {
            console.error("WebSocket error:", err);
        };

        this.ws.onclose = () => {
            console.log("WebSocket signaling channel closed");
        };
    }

    public sendSignal(remoteDeviceId: string, signalData: Signal): void {
        const msg: WSMessage = {
            sessionId: this.sessionId,
            sender: this.deviceId,
            receiver: remoteDeviceId,
            type: signalData.type,
            signal: signalData,
        };

        const sendMessage = () => {
            this.ws.send(JSON.stringify(msg));
        };

        if (this.ws.readyState === WebSocket.OPEN) {
            sendMessage();
        } else {
            this.ws.addEventListener("open", sendMessage, { once: true });
        }
    }

    public onSignal(callback: (remoteDeviceId: string, signalData: Signal) => void): void {
        this.callback = callback;
    }
}
