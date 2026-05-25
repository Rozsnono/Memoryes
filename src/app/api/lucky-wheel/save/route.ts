import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SavedGame from '@/models/SavedGame';
import { corsResponse, handleOptions } from '@/lib/cors';

export async function OPTIONS(request: Request) {
    return handleOptions(request); // Pass request here
}

function generateSaveCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();

        if (!body.phrase || !body.category || !body.gameMode || !body.players) {
            return corsResponse(NextResponse.json({ success: false, error: 'Hiányzó adatok a mentéshez.' }, { status: 400 }), request);
        }

        let code = generateSaveCode();
        let exists = await SavedGame.findOne({ saveCode: code });
        while (exists) {
            code = generateSaveCode();
            exists = await SavedGame.findOne({ saveCode: code });
        }

        const saved = await SavedGame.create({
            saveCode: code,
            phrase: body.phrase,
            category: body.category,
            revealedLetters: body.revealedLetters,
            players: body.players,
            activePlayerIdx: body.activePlayerIdx,
            gameMode: body.gameMode,
        });

        return corsResponse(NextResponse.json({ success: true, saveCode: saved.saveCode }, { status: 201 }), request);
    } catch (error: any) {
        return corsResponse(NextResponse.json({ success: false, error: error.message }, { status: 500 }), request);
    }
}