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
        const limitParam = searchParams.get('limit');
        const limit = limitParam ? parseInt(limitParam) : 100; // Default to 100 if not provided

        if (!spaceId) return corsResponse(NextResponse.json({ error: "Space ID required" }, { status: 400 }), req);

        const memories = await Memory.aggregate([
            { $match: { spaceId } }, // Filter by spaceId
            { $sample: { size: limit } }, // Randomly sample 'limit' number of memories
            {
                $project: {
                    media: 1,              // 3. Csak a 'media' mezőt tartjuk meg
                }
            }
        ]).exec();


        const formattedMemories = memories.map((memory: any) => ({
            ...memory.media,
        })).flatMap((mediaArray: any) => Object.values(mediaArray)).sort(() => Math.random() - 0.5); // Shuffle the media items

        return corsResponse(NextResponse.json(formattedMemories), req);
    } catch (error: any) {
        return corsResponse(NextResponse.json({ error: error.message }, { status: 500 }), req);
    }
}