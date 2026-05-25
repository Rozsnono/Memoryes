import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITheme extends Document {
    title: string;
    puzzles: string[];
}

const ThemeSchema: Schema = new Schema(
    {
        title: {
            type: String,
            required: [true, 'A téma címe kötelező.'],
            unique: true,
            trim: true,
        },
        puzzles: {
            type: [String],
            required: [true, 'Legalább egy rejtvény kötelező.'],
        },
    },
    { timestamps: true }
);

const Theme: Model<ITheme> =
    mongoose.models.Theme || mongoose.model<ITheme>('Theme', ThemeSchema);

export default Theme;