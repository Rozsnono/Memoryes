// models/User.ts
import mongoose, { Schema, models, model } from 'mongoose';

const UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true }, // Hashed password
    avatar: String,
    mode: { type: String, enum: ['personal', 'couple', 'family'], default: 'personal' },
    spaceId: { type: Schema.Types.ObjectId, ref: 'Space' }
}, { timestamps: true });

export const User = models.User || model('User', UserSchema);