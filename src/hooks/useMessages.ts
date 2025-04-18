// src/hooks/useMessages.ts
import { useEffect, useState } from "react";
import {Message} from "../models/Message.ts";
import {ISessionRepository} from "../repositories/SessionRepository.ts";

export const useMessages = (repository: ISessionRepository): Message[] => {
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        (async () => {
            unsubscribe = await repository.subscribeToMessages(setMessages);
        })();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [repository]);

    return messages;
};
