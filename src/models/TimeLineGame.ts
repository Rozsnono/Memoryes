import mongoose, { Schema, models, model } from 'mongoose';

const TimelineGameSchema = new Schema({
    spaceId: { type: String, required: true },
    hostId: { type: String, required: true },
    creatorName: { type: String, required: true },
    // Store the selected photos and their correct order
    photos: [{
        id: String,
        url: String,
        date: Date,
        title: String
    }],
    status: { type: String, enum: ['playing', 'won'], default: 'playing' }
}, { timestamps: true });

export const TimelineGame = models.TimelineGame || model('TimelineGame', TimelineGameSchema);