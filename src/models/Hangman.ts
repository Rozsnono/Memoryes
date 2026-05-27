import mongoose, { Schema, models, model } from 'mongoose';

const HangmanSchema = new Schema({
    spaceId: { type: String, required: true },
    creatorId: { type: String, required: true },
    creatorName: { type: String, required: true },
    word: { type: String, required: true },
    category: { type: String, default: "Family Secret" },
    guessedLetters: [{ type: String }],
    wrongGuesses: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 6 },
    status: { type: String, enum: ['waiting', 'playing', 'won', 'lost'], default: 'waiting' }
}, { timestamps: true });

export const Hangman = models.Hangman || model('Hangman', HangmanSchema);