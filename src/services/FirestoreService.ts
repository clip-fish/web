// src/services/FirebaseService.ts
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    setDoc,
    getDocs,
    where,
    Timestamp,
    serverTimestamp,
    FieldValue,
    Firestore,
} from "firebase/firestore";
import {Device, Signal} from "../types";
import {MessageStatus, MessageType} from "../models/Message.ts";
import {MyFirestoreTimestamp} from "../models/timestamp/FirestoreTimestamp.ts";

export interface FirestoreMessage {
    id: string;
    type: MessageType;
    sender: string;
    senderName: string;
    sentAt: Timestamp | FieldValue;
    status: MessageStatus;

    filename?: string;
    fileSize?: number;
}

export interface FirestoreDevice {
    id: string;
    userAgent: string;
    name: string;
    joinedAt: Timestamp | FieldValue;
    lastActiveAt: Timestamp | FieldValue;
}

export function newFirestoreDevice(deviceId: string, deviceName: string): FirestoreDevice {
    return {
        id: deviceId,
        userAgent: navigator.userAgent,
        lastActiveAt: MyFirestoreTimestamp.now().toSerializable()!,
        joinedAt: MyFirestoreTimestamp.now().toSerializable()!,
        name: deviceName,
    };
}

export interface FirestoreSignal {
    sender: string;
    receiver: string;
    signal: string; // Signal as JSON string
    sentAt: Timestamp | FieldValue;
}

export class FirestoreService {
    constructor(private db: Firestore) {
        console.log("FirestoreService initialized with db:", this.db);
    }

    createSessionIfNotExists = async (id: string) => {
        const sessionRef = doc(this.db, "sessions", id);
        const sessionSnap = await getDoc(sessionRef);
        if (!sessionSnap.exists()) {
            console.log("Creating new session");
            await setDoc(sessionRef, { createdAt: new Date() });
        } else {
            console.log("Session already exists:", sessionSnap.data());
        }
    };

    deleteSession = async (sessionId: string) => {
        const sessionRef = doc(this.db, "sessions", sessionId);

        const deleteSubcollection = async (subcollectionName: string) => {
            const subcollectionRef = collection(sessionRef, subcollectionName);
            const snapshot = await getDocs(subcollectionRef);
            const deletePromises: Promise<void>[] = [];

            snapshot.forEach((docSnapshot) => {
                deletePromises.push(deleteDoc(docSnapshot.ref));
            });

            await Promise.all(deletePromises);
        };

        try {
            await deleteSubcollection("devices");
            await deleteSubcollection("messages");
            await deleteSubcollection("signals");

            await deleteDoc(sessionRef);
            console.log("Deleted session:", sessionId);
        } catch (error) {
            console.error("Error deleting session or its subcollections:", error);
            throw error;
        }
    };

    addDeviceToSession = async (sessionId: string, deviceId: string, deviceName: string) => {
        const deviceRef = doc(collection(this.db, `sessions/${sessionId}/devices`), deviceId);
        await setDoc(
            deviceRef,
            newFirestoreDevice(deviceId, deviceName),
            { merge: true }
        );
    };

    listenForMessageUpdates = (sessionId: string, callback: (messages: FirestoreMessage[]) => void) => {
        const messagesRef = collection(this.db, `sessions/${sessionId}/messages`);
        const messagesQuery = query(messagesRef, orderBy("sentAt", "desc"));
        return onSnapshot(messagesQuery, (snapshot) => {
            const msgs = snapshot.docs.map((docSnap) => {
                let msg: FirestoreMessage = {
                    id: docSnap.id,
                    type: docSnap.data().type,
                    sender: docSnap.data().sender,
                    senderName: docSnap.data().senderName,
                    sentAt: docSnap.data().sentAt,
                    status: docSnap.data().status,
                };
                msg = (docSnap.data().type === MessageType.TEXT)
                    ? { ...msg, type: MessageType.TEXT, /*, text: docSnap.data().text */ }
                    : {
                        ...msg,
                        type: MessageType.FILE,
                        filename: docSnap.data().filename,
                        fileSize: docSnap.data().fileSize
                    };
                return msg;
            });
            callback(msgs);
        });
    };

    listenForDeviceUpdates = (sessionId: string, callback: (devices: Device[]) => void) => {
        const devicesRef = collection(this.db, `sessions/${sessionId}/devices`);
        return onSnapshot(devicesRef, (snapshot) => {
            const devicesList = snapshot.docs.map((docSnap) => ({
                id: docSnap.id,
                userAgent: docSnap.data().userAgent,
                iceCandidates: docSnap.data().iceCandidates,
                lastActiveAt: docSnap.data().lastActive,
                joinedAt: docSnap.data().lastActive,
                name: docSnap.data().name,
            }));
            callback(devicesList);
        });
    };

    sendMessage = async (sessionId: string, message: FirestoreMessage) => {
        const messageRef = doc(collection(this.db, `sessions/${sessionId}/messages`), message.id);
        await setDoc(messageRef, message, { merge: true });
    };

    async sendSignal(
        sessionId: string,
        sender: string,
        receiver: string,
        signalData: Signal
    ): Promise<void> {
        const signalsRef = collection(this.db, `sessions/${sessionId}/signals`);
        const fireSignal: FirestoreSignal = {
            sender,
            receiver,
            signal: JSON.stringify(signalData),
            sentAt: serverTimestamp(),
        };
        await addDoc(signalsRef, fireSignal);
    }

    listenForSignals = (
        sessionId: string,
        receiver: string,
        callback: (sender: string, signal: Signal) => void
    ) => {
        console.log("[FirestoreService.listenForSignals] Called.");
        const signalsRef = collection(this.db, `sessions/${sessionId}/signals`);
        const q = query(signalsRef, where("receiver", "==", receiver), orderBy("sentAt"));
        return onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const docId = change.doc.id;

                    const data = change.doc.data();

                    const firestoreSignal: FirestoreSignal = {
                        sender: data.sender,
                        receiver: data.receiver,
                        signal: data.signal,
                        sentAt: data.sentAt,
                    }

                    try {
                        const signal: Signal = JSON.parse(firestoreSignal.signal);
                        console.log(`[FirestoreService.listenForSignals] New signal from ${firestoreSignal.sender}:`, docId, firestoreSignal.signal);
                        callback(firestoreSignal.sender, signal);
                    } catch (err) {
                        console.error("Error parsing signal JSON:", err, firestoreSignal.signal);
                    }

                    // Delete the document after processing it
                    deleteDoc(doc(this.db, `sessions/${sessionId}/signals`, change.doc.id));
                }
            });
        });
    };
}
