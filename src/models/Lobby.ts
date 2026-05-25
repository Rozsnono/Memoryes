import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILobby extends Document {
    code: string;
    passcode?: string;
    hostName: string;
    maxPlayers: number;
    players: string[];
    themes: string[];
    status: 'waiting' | 'active' | 'finished';

    // Dynamic Online Active Game Properties
    activePlayerIdx: number;
    revealedLetters: string[];
    playerScores: number[];
    playerTotalScores: number[];
    currentTurnScore: number;
    currentWheelValue: string;
    turnState: 'idle' | 'spinning' | 'spinned' | 'buying_vowel' | 'solving' | 'game_over' | 'round_over';
    phrase: string;
    category: string;
    round: number; // Current round index
    maxRounds: number; // Max rounds limit [3]
}

const LobbySchema: Schema = new Schema(
    {
        code: { type: String, required: true, unique: true, uppercase: true, trim: true },
        passcode: { type: String, default: '' },
        hostName: { type: String, required: true },
        maxPlayers: { type: Number, required: true, min: 2, max: 6, default: 3 },
        players: { type: [String], default: [] },
        themes: { type: [String], required: true },
        status: { type: String, enum: ['waiting', 'active', 'finished'], default: 'waiting' },

        // Game Synced Properties
        activePlayerIdx: { type: Number, default: 0 },
        revealedLetters: { type: [String], default: [] },
        playerScores: { type: [Number], default: [] },
        playerTotalScores: { type: [Number], default: [] },
        currentTurnScore: { type: Number, default: 0 },
        currentWheelValue: { type: String, default: '' },
        turnState: {
            type: String,
            enum: ['idle', 'spinning', 'spinned', 'buying_vowel', 'solving', 'game_over', 'round_over'],
            default: 'idle'
        },
        phrase: { type: String, default: '' },
        category: { type: String, default: '' },
        round: { type: Number, default: 1 },
        maxRounds: { type: Number, default: 3 }
    },
    { timestamps: true }
);

if (mongoose.models && mongoose.models.Lobby) {
    delete mongoose.models.Lobby;
}

const Lobby: Model<ILobby> = mongoose.model<ILobby>('Lobby', LobbySchema);

export default Lobby;