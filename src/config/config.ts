// src/config.ts
interface RawConfig {
    signaling: string;
    sessionStore: string;
    peerImpl: string;
    wsUrl: string;
    apiUrl: string;
    firebase: Record<string,string>;
    storeTextMessageContent: boolean;
    defaultMaxTransferSize: number;
    maxMessageChunkSize: number;
    messageLoadTimeout: number;
    enableAnalytics: boolean;
}

const raw = (window as any).APP_CONFIG as RawConfig;

export const Config = {
    signaling:   raw.signaling as "WebSocket" | "Firestore",
    sessionStore:raw.sessionStore as "Express" | "Firestore",
    peerImpl:    raw.peerImpl   as "SimplePeer" | "Raw",
    wsUrl:       raw.wsUrl,
    apiUrl:      raw.apiUrl,

    firebase: {
        apiKey:            raw.firebase.apiKey,
        authDomain:        raw.firebase.authDomain,
        projectId:         raw.firebase.projectId,
        storageBucket:     raw.firebase.storageBucket,
        messagingSenderId: raw.firebase.messagingSenderId,
        appId:             raw.firebase.appId,
        measurementId:     raw.firebase.measurementId,
        enableAnalytics:   raw.enableAnalytics,
    },

    storeTextMessageContent: raw.storeTextMessageContent,
    defaultMaxTransferSize:  raw.defaultMaxTransferSize,
    maxMessageChunkSize:     raw.maxMessageChunkSize,
    messageLoadTimeout:      raw.messageLoadTimeout,
};
