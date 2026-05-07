// app/api/memories/media/route.ts
import connectDB from '@/lib/mongodb';
import { Memory } from '@/models/Memory';
import { NextResponse } from 'next/server';
import { corsResponse, handleOptions } from '@/lib/cors';



export async function OPTIONS(request: Request) {
    return handleOptions(request); // Pass request here
}

export async function POST(req: Request) {
    
    try {
        await connectDB();
        const { memoryId, url, publicId, mediaType } = await req.json();

        const updatedMemory = await Memory.findByIdAndUpdate(
            memoryId,
            {
                $push: {
                    media: { url, publicId, mediaType }
                }
            },
            { new: true }
        );

        return corsResponse(NextResponse.json(updatedMemory, { status: 200 }), req);
    } catch (error: any) {
        return corsResponse(NextResponse.json({ error: error.message }, { status: 500 }), req);
    }
}