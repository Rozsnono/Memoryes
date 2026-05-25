import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import connectDB from '@/lib/mongodb';
import { Memory } from '@/models/Memory';
import { corsResponse, handleOptions } from '@/lib/cors';

export async function OPTIONS(request: Request) {
    return handleOptions(request); // Pass request here
}
export async function PATCH(req: Request) {
    headers();
    try {
        await connectDB();
        const { memoryId, title, location } = await req.json();

        const updatedMemory = await Memory.findByIdAndUpdate(
            memoryId,
            { title, location },
            { new: true }
        );

        return corsResponse(NextResponse.json(updatedMemory), req);
    } catch (error: any) {
        return corsResponse(NextResponse.json({ error: error.message }, { status: 500 }), req);
    }
}