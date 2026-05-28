import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { pusherServer } from '@/lib/pusher';
import { corsResponse, handleOptions } from '@/lib/cors';

export async function OPTIONS(request: Request) {
    return handleOptions(request);
}

export async function POST(req: Request) {
    try {
        const { spaceId, newOrder } = await req.json();

        // Broadcast the new array order to all other family members in the space
        // We use 'sync-move' which the frontend component is listening for
        await pusherServer.trigger(spaceId, 'sync-move', newOrder);

        return corsResponse(NextResponse.json({ success: true }), req);
    } catch (e: any) {
        return corsResponse(NextResponse.json({ error: e.message }, { status: 500 }), req);
    }
}