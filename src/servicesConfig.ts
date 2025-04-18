// src/servicesConfig.ts
import { FirestoreService } from "./services/FirestoreService.ts";
import { ISessionStorageService } from "./services/sessionstorage/ISessionStorageService";
import { FirestoreSessionStorageService } from "./services/sessionstorage/FirestoreSessionStorageService";
import { ExpressSessionStorageService } from "./services/sessionstorage/ExpressSessionStorageService";
import { ISignalingService } from "./services/webrtc/signaling/ISignalingService";
import { WebSocketSignalingService } from "./services/webrtc/signaling/WebSocketSignalingService";
import {FirestoreSignalingService} from "./services/webrtc/signaling/FirestoreSignalingService.ts";
import {IPeerConnectionService, RawPeerConnectionService} from "./services/webrtc/peerConnection/RawPeerConnectionService.ts";
import {SimplePeerConnectionService} from "./services/webrtc/peerConnection/SimplePeerConnectionService.ts";
import {Config} from "./config/config.ts";
import {getFirestoreDb} from "./firebaseFactory.ts";

// Lazy singleton for FirestoreService
let _firestoreService: FirestoreService | null = null;
function getFirestoreService(): FirestoreService {
    if (!_firestoreService) {
        _firestoreService = new FirestoreService(getFirestoreDb());
    }
    return _firestoreService;
}

// Session storage factory
export function makeSessionStorageService(): ISessionStorageService {
    switch (Config.sessionStore) {
        case "Firestore":
            return new FirestoreSessionStorageService(getFirestoreService());
        case "Express":
        default:
            return new ExpressSessionStorageService(Config.apiUrl);
    }
}

// Signaling factory
export function makeSignalingService(
    sessionId: string,
    deviceId: string
): ISignalingService {
    switch (Config.signaling) {
        case "Firestore":
            return new FirestoreSignalingService(
                sessionId,
                deviceId,
                getFirestoreService()
            );
        case "WebSocket":
        default:
            return new WebSocketSignalingService(
                sessionId,
                deviceId,
                Config.wsUrl,
            );
    }
}

// Peer‐connection factory
export function makePeerConnectionService(
    deviceId: string,
    signaling: ISignalingService
): IPeerConnectionService {
    switch (Config.peerImpl) {
        case "Raw":
            return new RawPeerConnectionService(deviceId, signaling);
        case "SimplePeer":
        default:
            return new SimplePeerConnectionService(signaling);
    }
}
