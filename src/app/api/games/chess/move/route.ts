import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ChessGame } from '@/models/ChessGame';
import { pusherServer } from '@/lib/pusher';
import { corsResponse, handleOptions } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: Request) { return handleOptions(request); }

export async function PATCH(req: Request) {
    try {
        await connectDB();
        const { gameId, fen, move, spaceId } = await req.json();

        const updatedGame = await ChessGame.findByIdAndUpdate(
            gameId,
            { fen, $push: { history: move } },
            { new: true }
        );

        // Trigger real-time move update for the opponent/spectators
        await pusherServer.trigger(spaceId, 'chess-move', {
            gameId,
            fen,
            move
        });

        return corsResponse(NextResponse.json(updatedGame), req);
    } catch (e: any) {
        return corsResponse(NextResponse.json({ error: e.message }, { status: 500 }), req);
    }
}