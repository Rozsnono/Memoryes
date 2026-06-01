import mongoose, { Schema, models, model } from 'mongoose';

const LogSchema = new Schema({
    timestamp: { type: Date, default: Date.now },
    method: String,
    path: String,
    status: Number,
    ip: String,
    userAgent: String,
    duration: Number, // ms
    payload: Schema.Types.Mixed,
}, { timestamps: true });

// Auto-delete logs after 30 days
LogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export const Log = models.Log || model('Log', LogSchema);