// src/hooks/useDevices.ts
import { useEffect, useState } from "react";
import {ISessionRepository} from "../repositories/SessionRepository.ts";
import {Device} from "../types.ts";

export const useDevices = (repository: ISessionRepository): Device[] => {
    const [devices, setDevices] = useState<Device[]>([]);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        (async () => {
            unsubscribe = await repository.subscribeToDevices(setDevices);
        })();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [repository]);

    return devices;
};
