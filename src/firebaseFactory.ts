// src/firebaseFactory.ts
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics }       from "firebase/analytics";
import { getFirestore, Firestore }       from "firebase/firestore";
import {Config} from "./config/config.ts";

let app: FirebaseApp | null      = null;
let analytics: Analytics | null  = null;
let db: Firestore | null         = null;

export function getFirebaseApp(): FirebaseApp {
    if (!app) {
        app = initializeApp({
            apiKey:            Config.firebase.apiKey,
            authDomain:        Config.firebase.authDomain,
            projectId:         Config.firebase.projectId,
            storageBucket:     Config.firebase.storageBucket,
            messagingSenderId: Config.firebase.messagingSenderId,
            appId:             Config.firebase.appId,
            measurementId:     Config.firebase.measurementId,
        });
        if (Config.firebase.enableAnalytics) {
            analytics = getAnalytics(app);
        }
    }
    return app;
}

export function getFirestoreDb(): Firestore {
    if (!db) {
        // ensure app is initialized
        getFirebaseApp();
        db = getFirestore(app!);
    }
    return db;
}

export function getFirebaseAnalytics(): Analytics | undefined {
    if (!analytics && Config.firebase.enableAnalytics) {
        analytics = getAnalytics(getFirebaseApp());
    }
    return analytics || undefined;
}
