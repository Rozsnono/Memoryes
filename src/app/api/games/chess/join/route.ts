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
        const { gameId, userId, userName, spaceId } = await req.json();
        const game = await ChessGame.findById(gameId);

        if (!game) return corsResponse(NextResponse.json({ error: "Game not found" }, { status: 404 }), req);

        // If user is already a player, just return the game
        if (game.whitePlayer?.id === userId || game.blackPlayer?.id === userId) {
            return corsResponse(NextResponse.json(game), req);
        }

        // Assign to the empty seat
        if (!game.whitePlayer?.id) {
            game.whitePlayer = { id: userId, name: userName };
        } else if (!game.blackPlayer?.id) {
            game.blackPlayer = { id: userId, name: userName };
        } else {
            return corsResponse(NextResponse.json({ error: "Game is full (Spectating only)" }, { status: 200 }), req);
        }

        game.status = 'playing';
        await game.save();

        // Notify the host that someone sat down
        await pusherServer.trigger(spaceId, 'chess-join', game);

        return corsResponse(NextResponse.json(game), req);
    } catch (e: any) {
        return corsResponse(NextResponse.json({ error: e.message }, { status: 500 }), req);
    }
}