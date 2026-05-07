// app/api/memories/route.ts
import connectDB from '@/lib/mongodb';
import { Memory } from '@/models/Memory';
import { NextResponse } from 'next/server';
import { corsResponse, handleOptions } from '@/lib/cors';



export async function OPTIONS(request: Request) {
    return handleOptions(request); // Pass request here
}

export async function GET(req: Request) {

    try {
        await connectDB();
        // Fetch memories that have location data
        const { searchParams } = new URL(req.url);
        const spaceId = searchParams.get('spaceId'); // Get spaceId from URL

        if (!spaceId) return corsResponse(NextResponse.json({ error: "Space ID required" }, { status: 400 }), req);

        const memories = await Memory.find({
            "location.coordinates": { $exists: true, $ne: [] }, spaceId
        }).sort({ capturedAt: 1 }); // Sort by time to create the "path"

        return corsResponse(NextResponse.json(memories), req);
    } catch (error: any) {
        return corsResponse(NextResponse.json({ error: error.message }, { status: 500 }), req);
    }
}

export async function POST(req: Request) {

    try {
        await connectDB();
        const body = await req.json();

        // Create memory with the data sent from the Upload component
        const newMemory = await Memory.create(body);

        return corsResponse(NextResponse.json(newMemory, { status: 201 }), req);
    } catch (error: any) {
        return corsResponse(NextResponse.json({ error: error.message }, { status: 500 }), req);
    }
}