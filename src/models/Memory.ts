// models/Memory.ts
import mongoose, { Schema } from 'mongoose';

// Force delete the model in development to apply schema changes
if (mongoose.models.Memory) {
    delete mongoose.models.Memory;
}

const PerspectiveSchema = new Schema({
    userId: String,
    userName: String,
    content: String,
    capturedAt: { type: Date, default: Date.now },
    // ADD THIS:
    reactions: [{
        userId: String,
        type: { type: String, enum: ['like', 'heart', 'laugh', 'sad'] }
    }]
});

const MemorySchema = new Schema({
    // We use type: String so we can use dummy IDs like 'family_vault_1'
    spaceId: {
        type: String,
        required: [true, "Space ID is required"]
    },
    creatorId: {
        type: String,
        required: [true, "Creator ID is required"]
    },
    title: {
        type: String,
        required: [true, "Title is required"]
    },
    media: [{
        url: String,
        publicId: String,
        mediaType: { type: String, default: 'image' }
    }],
    location: {
        name: String,
        coordinates: {
            type: [Number], // [longitude, latitude]
            index: '2dsphere'
        }
    },
    perspectives: [PerspectiveSchema],
    isPinned: { type: Boolean, default: false },
    capturedAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    // This prevents Mongoose from trying to cast strings to ObjectIds automatically
    strict: true
});

export const Memory = mongoose.models.Memory || mongoose.model('Memory', MemorySchema);