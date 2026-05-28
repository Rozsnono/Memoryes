import mongoose, { Schema, models, model } from 'mongoose';

const ChessGameSchema = new Schema({
    spaceId: { type: String, required: true, index: true },
    whitePlayer: {
        id: { type: String, default: null },
        name: { type: String, default: null }
    },
    blackPlayer: {
        id: { type: String, default: null },
        name: { type: String, default: null }
    },
    // Standard starting position FEN
    fen: {
        type: String,
        default: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    },
    history: [{ type: String }],
    status: {
        type: String,
        enum: ['waiting', 'playing', 'draw', 'won'],
        default: 'waiting'
    },
    winner: { type: String, default: null },
    creatorName: { type: String, required: true }
}, { timestamps: true });

export const ChessGame = models.ChessGame || model('ChessGame', ChessGameSchema);