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
        const { memoryId, perspectiveId, userId, type } = await req.json();

        const memory = await Memory.findById(memoryId);
        const perspective = memory.perspectives.id(perspectiveId);

        // Find if user already reacted
        const existingIndex = perspective.reactions.findIndex((r: any) => r.userId === userId);

        if (existingIndex > -1) {
            if (perspective.reactions[existingIndex].type === type) {
                // Same reaction? Remove it
                perspective.reactions.splice(existingIndex, 1);
            } else {
                // Different? Update it
                perspective.reactions[existingIndex].type = type;
            }
        } else {
            // New reaction? Add it
            perspective.reactions.push({ userId, type });
        }

        await memory.save();
        return corsResponse(NextResponse.json(memory), req);
    } catch (error: any) {
        return corsResponse(NextResponse.json({ error: error.message }, { status: 500 }), req);
    }
}