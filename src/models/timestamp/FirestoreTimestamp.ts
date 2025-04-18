import {FieldValue, serverTimestamp, Timestamp as FirestoreTimestamp} from "firebase/firestore";
import {BaseTimestamp} from "./BaseTimestamp.ts";
import {ITimestamp} from "./ITimestamp.ts";

export class MyFirestoreTimestamp extends BaseTimestamp {
    constructor(private readonly ts: FirestoreTimestamp | FieldValue) {
        super();
    }

    renderedTimestamp(): FirestoreTimestamp {
        if (!this.isResolved()) throw new Error("Cannot render a server timestamp.");
        return this.ts as FirestoreTimestamp;
    }

    isResolved(): boolean {
        return !(this.ts instanceof FieldValue && this.ts === serverTimestamp());
    }

    toSeconds(): number {
        if (!this.isResolved()) throw new Error("Cannot get seconds from a server timestamp.");
        return this.renderedTimestamp().seconds;
    }

    toDate(): Date {
        if (!this.isResolved()) throw new Error("Cannot get date from a server timestamp.");
        return this.renderedTimestamp().toDate();
    }

    toMillis(): number {
        if (!this.isResolved()) throw new Error("Cannot get millis from a server timestamp.");
        return this.renderedTimestamp().toMillis();
    }

    toISOString(): string {
        if (!this.isResolved()) throw new Error("Cannot get ISO string from a server timestamp.");
        return this.renderedTimestamp().toDate().toISOString();
    }

    static now(): MyFirestoreTimestamp {
        return new MyFirestoreTimestamp(FirestoreTimestamp.now());
    }

    static serverTimestamp(): MyFirestoreTimestamp {
        return new MyFirestoreTimestamp(serverTimestamp());
    }

    toSerializable(): FirestoreTimestamp | FieldValue {
        return this.ts;
    }

    static fromSerializable(serialized: FirestoreTimestamp | FieldValue): ITimestamp {
        return new MyFirestoreTimestamp(serialized);
    }
}
