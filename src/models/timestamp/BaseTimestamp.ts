import {ITimestamp} from "./ITimestamp.ts";

export abstract class BaseTimestamp implements ITimestamp {
    abstract toSeconds(): number;
    abstract toDate(): Date;
    abstract toMillis(): number;
    abstract toISOString(): string;

    abstract toSerializable(): any;

    static fromSerializable(_serialized: any): ITimestamp {
        throw new Error("Must be implemented by subclass");
    }

    static now(): BaseTimestamp {
        throw new Error("Must be implemented by subclass");
    }

    static serverTimestamp(): BaseTimestamp {
        throw new Error("Must be implemented by subclass");
    }
}