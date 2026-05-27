// models/Space.ts
import mongoose, { Schema, models, model } from 'mongoose';

// Helper to generate a random 6-digit alphanumeric invite code
const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const SpaceSchema = new Schema({
    name: {
        type: String,
        required: [true, "Space name is required"]
    },
    type: {
        type: String,
        enum: ['personal', 'couple', 'family'],
        default: 'personal'
    },
    inviteCode: {
        type: String,
        unique: true,
        default: generateInviteCode
    },
    members: [{
        type: String // Storing User IDs as strings for now to match our dev setup
    }],
    themeColor: {
        type: String,
        default: '#9B86BD'
    },
    countdown: {
        title: { type: String, default: "Special Moment" },
        targetDate: { type: Date },
        isActive: { type: Boolean, default: false }
    },
    createdBy: {
        type: String,
        required: true
    }
}, { timestamps: true });

export const Space = models.Space || model('Space', SpaceSchema);