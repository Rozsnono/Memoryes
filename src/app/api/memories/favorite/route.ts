// app/api/memories/favorite/route.ts
import connectDB from '@/lib/mongodb';
import { Memory } from '@/models/Memory';
import { NextResponse } from 'next/server';
import { corsResponse, handleOptions } from '@/lib/cors';



export async function OPTIONS() {
    return handleOptions();
}

export async function PATCH(req: Request) {
    
    try {
        await connectDB();
        const { memoryId, isFavorite } = await req.json();

        const updatedMemory = await Memory.findByIdAndUpdate(
            memoryId,
            { isPinned: isFavorite },
            { new: true }
        );

        return corsResponse(NextResponse.json(updatedMemory, { status: 200 }));
    } catch (error: any) {
        return corsResponse(NextResponse.json({ error: error.message }, { status: 500 }));
    }
}