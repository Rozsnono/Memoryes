import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import connectDB from '@/lib/mongodb';
import { Hangman } from '@/models/Hangman';
import { pusherServer } from '@/lib/pusher';
import { corsResponse, handleOptions } from '@/lib/cors';


export async function OPTIONS(request: Request) {
    return handleOptions(request); // Pass request here
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json(); // { spaceId, creatorId, creatorName, word, category }
        const game = await Hangman.create(body);

        // Notify family via Pusher
        await pusherServer.trigger(body.spaceId, 'new-game', { type: 'hangman', gameId: game._id });

        return corsResponse(NextResponse.json(game), req);
    } catch (e: any) {
        return corsResponse(NextResponse.json({ error: e.message }, { status: 500 }), req);
    }
}

export async function PATCH(req: Request) {
    try {
        await connectDB();
        const { gameId, letter } = await req.json();
        const game = await Hangman.findById(gameId);

        if (!game.guessedLetters.includes(letter)) {
            game.guessedLetters.push(letter);
            if (!game.word.toUpperCase().includes(letter)) {
                game.wrongGuesses += 1;
            }
        }

        // Check Win/Loss
        const isWon = game.word.toUpperCase().split('').every((l: string) => l === ' ' || game.guessedLetters.includes(l));
        if (isWon) game.status = 'won';
        else if (game.wrongGuesses >= game.maxAttempts) game.status = 'lost';
        else game.status = 'playing';

        await game.save();
        await pusherServer.trigger(game.spaceId, 'game-update', game);

        return corsResponse(NextResponse.json(game), req);
    } catch (e: any) {
        return corsResponse(NextResponse.json({ error: e.message }, { status: 500 }), req);
    }
}