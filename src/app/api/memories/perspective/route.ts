// app/api/memories/perspective/route.ts
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
        const { memoryId, userId, userName, content } = await req.json();

        if (!memoryId || !content) {
            return corsResponse(NextResponse.json({ error: "Missing data" }, { status: 400 }));
        }

        // Find the memory and push the new perspective into the array
        const updatedMemory = await Memory.findByIdAndUpdate(
            memoryId,
            {
                $push: {
                    perspectives: {
                        userId,
                        userName,
                        content,
                        capturedAt: new Date()
                    }
                }
            },
            { new: true } // Return the updated document
        );

        return corsResponse(NextResponse.json(updatedMemory, { status: 200 }));
    } catch (error: any) {
        console.error("PERSPECTIVE ERROR:", error.message);
        return corsResponse(NextResponse.json({ error: error.message }, { status: 500 }));
    }
}