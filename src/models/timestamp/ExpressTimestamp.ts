import {BaseTimestamp} from "./BaseTimestamp.ts";
import {ITimestamp} from "./ITimestamp.ts";

export class ExpressTimestamp extends BaseTimestamp {
    constructor(private readonly date?: Date) {
        super();
    }

    isRendered(): boolean {
        return !!this.date;
    }

    toSeconds(): number {
        if (!this.isRendered()) throw new Error("Cannot get seconds from a server timestamp.");
        return Math.floor(this.date!.getTime() / 1000);
    }

    toDate(): Date {
        if (!this.isRendered()) throw new Error("Cannot get date from a server timestamp.");
        return this.date!;
    }

    toMillis(): number {
        if (!this.isRendered()) throw new Error("Cannot get millis from a server timestamp.");
        return this.date!.getTime();
    }

    toISOString(): string {
        if (!this.isRendered()) throw new Error("Cannot get ISO string from a server timestamp.");
        return this.date!.toISOString();
    }

    static now(): ExpressTimestamp {
        return new ExpressTimestamp(new Date());
    }

    static serverTimestamp(): ExpressTimestamp {
        return new ExpressTimestamp();
    }

    toSerializable(): string | undefined {
        // return (this.date ?? new Date()).toISOString();
        return this.date?.toISOString();
    }

    static fromSerializable(serialized: string): ITimestamp {
        const date = new Date(serialized);
        if (isNaN(date.getTime())) {
            throw new Error(`Invalid serialized timestamp: ${serialized}`);
        }
        return new ExpressTimestamp(date);
    }
}
