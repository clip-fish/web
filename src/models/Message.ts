// src/models/Message.ts

import {ITimestamp} from "./timestamp/ITimestamp.ts";

export enum MessageType {
    TEXT = 'text',
    FILE = 'file',
}

export interface BaseMessage {
    id: string;
    type: MessageType;
    sender: string;
    senderName: string;
    sentAt: ITimestamp;
    status: MessageStatus;
}

export interface TextMessage extends BaseMessage {
    type: MessageType.TEXT;
    text?: string;
}

export interface FileMessage extends BaseMessage {
    type: MessageType.FILE;
    blob?: Blob;
    filename: string;
    fileSize: number;
}

export type Message = TextMessage | FileMessage;


export enum MessageStatusType {
    LOADING = "loading",
    LOADED = "loaded",
    ERROR = "error",
}

interface BaseMessageStatus {
    type: MessageStatusType;
}

export interface MessageLoaded extends BaseMessageStatus {
    type: MessageStatusType.LOADED;
}

export interface MessageLoading extends BaseMessageStatus {
    type: MessageStatusType.LOADING;
    progress: number;
}

export interface MessageError extends BaseMessageStatus {
    type: MessageStatusType.ERROR;
    error: string;
}

export type MessageStatus = MessageLoaded | MessageLoading | MessageError;

export const loadedStatus = (): MessageLoaded => {
    return { type: MessageStatusType.LOADED }
}
export const loadingStatus = (progress = -1): MessageLoading => {
    return { type: MessageStatusType.LOADING, progress }
}
export const errorStatus = (error: string): MessageError => {
    return { type: MessageStatusType.ERROR, error }
}
