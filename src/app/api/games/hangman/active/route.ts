import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import connectDB from '@/lib/mongodb';
import { Hangman } from '@/models/Hangman';
import { corsResponse, handleOptions } from '@/lib/cors';

export async function OPTIONS(request: Request) {
    return handleOptions(request); // Pass request here
}

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const spaceId = searchParams.get('spaceId');

        if (!spaceId) return NextResponse.json({ error: "Space ID required" }, { status: 400 });

        // Fetch games that are not won or lost yet
        const activeGames = await Hangman.find({
            spaceId,
            status: { $in: ['waiting', 'playing'] }
        }).sort({ createdAt: -1 });

        return corsResponse(NextResponse.json(activeGames), req);
    } catch (e: any) {
        return corsResponse(NextResponse.json({ error: e.message }, { status: 500 }), req);
    }
}