import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISavedGame extends Document {
    saveCode: string; // Unique 6-digit recovery PIN (e.g. "482019")
    phrase: string;
    category: string;
    revealedLetters: string[];
    players: { name: string; roundScore: number; totalScore: number }[];
    activePlayerIdx: number;
    gameMode: 'SINGLE' | 'LOCAL_MULTI' | 'ONLINE_MULTI';
}

const SavedGameSchema: Schema = new Schema(
    {
        saveCode: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },
        phrase: {
            type: String,
            required: true
        },
        category: {
            type: String,
            required: true
        },
        revealedLetters: {
            type: [String],
            default: []
        },
        players: {
            type: [
                {
                    name: String,
                    roundScore: Number,
                    totalScore: Number,
                },
            ],
            default: [],
        },
        activePlayerIdx: {
            type: Number,
            default: 0
        },
        gameMode: {
            type: String,
            required: true
        },
    },
    { timestamps: true }
);

const SavedGame: Model<ISavedGame> =
    mongoose.models.SavedGame || mongoose.model<ISavedGame>('SavedGame', SavedGameSchema);

export default SavedGame;