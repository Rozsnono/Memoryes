import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import connectDB from '@/lib/mongodb';
import { TimelineGame } from '@/models/TimeLineGame';
import { corsResponse, handleOptions } from '@/lib/cors';

// Ensure the route is always dynamic for Vercel
export const dynamic = 'force-dynamic';

/**
 * Handle CORS Preflight
 */
export async function OPTIONS(request: Request) {
    return handleOptions(request);
}

/**
 * GET: Fetch a single timeline game by ID
 */
export async function GET(req: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return corsResponse(
                NextResponse.json({ error: "Game ID is required" }, { status: 400 }),
                req
            );
        }

        const game = await TimelineGame.findById(id);

        if (!game) {
            return corsResponse(
                NextResponse.json({ error: "Game session has expired or does not exist" }, { status: 404 }),
                req
            );
        }

        // Return the game document with our standard CORS wrapper
        return corsResponse(NextResponse.json(game), req);

    } catch (error: any) {
        console.error("Timeline Single API Error:", error.message);
        return corsResponse(
            NextResponse.json({ error: error.message }, { status: 500 }),
            req
        );
    }
}