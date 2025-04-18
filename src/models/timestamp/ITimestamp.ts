export interface ITimestamp {
    toSeconds(): number;
    toDate(): Date;
    toMillis(): number;
    toISOString(): string;

    toSerializable(): any;
}


