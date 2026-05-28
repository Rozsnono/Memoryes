import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import connectDB from '@/lib/mongodb';
import { Memory } from '@/models/Memory';
import { TimelineGame } from '@/models/TimeLineGame';
import { pusherServer } from '@/lib/pusher';
import { corsResponse, handleOptions } from '@/lib/cors';

export async function OPTIONS(req: Request) { return handleOptions(req); }

export async function POST(req: Request) {
    try {
        await connectDB();
        const { spaceId, userId, userName } = await req.json();

        // 1. Pick 5 random memories
        const memories = await Memory.aggregate([
            { $match: { spaceId: spaceId, "media.0": { $exists: true } } },
            { $sample: { size: 5 } }
        ]);

        const photos = memories.map(m => ({
            id: m._id, url: m.media[0].url, date: m.capturedAt, title: m.title
        }));

        // 2. Create the game record
        const game = await TimelineGame.create({
            spaceId, hostId: userId, hostName: userName, photos
        });

        // 3. Tell the Lounge there is a live game
        await pusherServer.trigger(spaceId, 'new-game', {
            type: 'timeline',
            gameId: game._id,
            hostName: userName
        });

        return corsResponse(NextResponse.json(game), req);
    } catch (e: any) {
        return corsResponse(NextResponse.json({ error: e.message }, { status: 500 }), req);
    }
}