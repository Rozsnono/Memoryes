import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import connectDB from '@/lib/mongodb';
import { corsResponse, handleOptions } from '@/lib/cors';
import { TimelineGame } from '@/models/TimeLineGame';

export async function OPTIONS(request: Request) {
    return handleOptions(request); // Pass request here
}

export async function GET(req: Request) {
    headers();
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const spaceId = searchParams.get('spaceId');
        const active = await TimelineGame.find({ spaceId, status: 'playing' });
        return corsResponse(NextResponse.json(active), req);
    } catch (e: any) { return corsResponse(NextResponse.json({ error: e.message }), req); }
}