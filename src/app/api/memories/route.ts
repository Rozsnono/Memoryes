// app/api/memories/route.ts
import connectDB from '@/lib/mongodb';
import { Memory } from '@/models/Memory';
import { NextResponse } from 'next/server';
import { corsResponse, handleOptions } from '@/lib/cors';



export async function OPTIONS() {
    return handleOptions();
}

export async function GET() {
    
    try {
        await connectDB();
        // Fetch memories that have location data
        const memories = await Memory.find({
            "location.coordinates": { $exists: true, $ne: [] }
        }).sort({ capturedAt: 1 }); // Sort by time to create the "path"

        return corsResponse(NextResponse.json(memories));
    } catch (error: any) {
        return corsResponse(NextResponse.json({ error: error.message }, { status: 500 }));
    }
}

export async function POST(req: Request) {
    
    try {
        await connectDB();
        const body = await req.json();

        // Create memory with the data sent from the Upload component
        const newMemory = await Memory.create(body);

        return corsResponse(NextResponse.json(newMemory, { status: 201 }));
    } catch (error: any) {
        return corsResponse(NextResponse.json({ error: error.message }, { status: 500 }));
    }
}