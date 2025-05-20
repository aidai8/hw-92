import {Document} from "mongoose";

export interface ChatMessage {
    username: string;
    text: string;
}

export interface IncomingMessage {
    type: string;
    payload: ChatMessage;
}

export interface UserFields {
    username: string;
    password: string;
    token: string;
}

export interface UserDocument extends UserFields, Document {
    _id: string;
    checkPassword(password: string): Promise<boolean>;
    generateToken(): void;
}