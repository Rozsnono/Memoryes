import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import connectDB from '@/lib/mongodb';
import { ChessGame } from '@/models/ChessGame';
import { pusherServer } from '@/lib/pusher';
import { corsResponse, handleOptions } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: Request) { return handleOptions(request); }

// GET: List active games for the Lounge
export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const spaceId = searchParams.get('spaceId');

        const games = await ChessGame.find({
            spaceId,
            status: { $in: ['waiting', 'playing'] }
        }).sort({ updatedAt: -1 });

        return corsResponse(NextResponse.json(games), req);
    } catch (e: any) {
        return corsResponse(NextResponse.json({ error: e.message }, { status: 500 }), req);
    }
}

// POST: Create a new game
export async function POST(req: Request) {
    headers();
    try {
        await connectDB();
        const { spaceId, userId, userName, side } = await req.json();

        const gameData: any = {
            spaceId,
            status: 'waiting',
            whitePlayer: side === 'white' ? { id: userId, name: userName } : { id: null, name: null },
            blackPlayer: side === 'black' ? { id: userId, name: userName } : { id: null, name: null },
            creatorName: userName
        };

        const game = await ChessGame.create(gameData);

        // Broadcast to Lounge so others see the "Live Table"
        await pusherServer.trigger(spaceId, 'new-game', {
            type: 'chess',
            gameId: game._id,
            hostName: userName
        });

        return corsResponse(NextResponse.json(game), req);
    } catch (e: any) {
        return corsResponse(NextResponse.json({ error: e.message }, { status: 500 }), req);
    }
}