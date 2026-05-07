// models/User.ts
import mongoose, { Schema, models, model } from 'mongoose';

const UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true }, // Hashed password
    avatar: String,
    mode: { type: String, enum: ['personal', 'couple', 'family'], default: 'personal' },
    spaceId: {
        type: Schema.Types.ObjectId, // Change to String if you are using dummy IDs
        ref: 'Space' // This MUST match the model name in Space.ts
    }
}, { timestamps: true });

export const User = models.User || model('User', UserSchema);