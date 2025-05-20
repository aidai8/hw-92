import mongoose, { Schema } from "mongoose";

interface ChatMessageFields {
    username: string;
    text: string;
    createdAt: Date;
}

export type ChatMessageDocument = ChatMessageFields & mongoose.Document;

const ChatMessageSchema = new Schema<ChatMessageDocument>({
    username: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

export const ChatMessage = mongoose.model<ChatMessageDocument>('ChatMessage', ChatMessageSchema);