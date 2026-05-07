import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface IMessage extends Document {
    spaceId: string;
    senderId: string;
    senderName: string;
    text: string;
    type: 'text' | 'memory';
    mediaUrl?: string;
    createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
    spaceId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    text: { type: String, required: true },
    type: { type: String, enum: ['text', 'memory'], default: 'text' },
    mediaUrl: String,
}, { timestamps: true });

export const Message = models.Message || model<IMessage>('Message', MessageSchema);