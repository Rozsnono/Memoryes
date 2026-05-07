import connectDB from '@/lib/mongodb';
import { Message } from '@/models/Message';
import { pusherServer } from '@/lib/pusher';
import { NextResponse } from 'next/server';
import { corsResponse, handleOptions } from '@/lib/cors';

// CRITICAL: This prevents the 'output: export' error


export async function OPTIONS(request: Request) {
    return handleOptions(request); // Pass request here
}

export async function POST(req: Request) {
    
    try {
        await connectDB();
        const body = await req.json();

        if (!body.text || !body.spaceId || !body.senderName) {
            return corsResponse(NextResponse.json({ error: "Missing fields" }, { status: 400 }));
        }

        const newMessage = await Message.create({
            spaceId: body.spaceId,
            senderId: body.senderId,
            senderName: body.senderName,
            text: body.text,
            type: body.type || 'text'
        });

        try {
            await pusherServer.trigger(body.spaceId, 'new-message', newMessage);
        } catch (pusherError) {
            console.error("Pusher Error:", pusherError);
        }

        return corsResponse(NextResponse.json(newMessage, { status: 201 }));
    } catch (error: any) {
        return corsResponse(NextResponse.json({ error: error.message }, { status: 500 }));
    }
}

export async function GET(req: Request) {
    
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const spaceId = searchParams.get('spaceId') || 'family_vault_1';

        const messages = await Message.find({ spaceId }).sort({ createdAt: 1 });
        return corsResponse(NextResponse.json(messages));
    } catch (error: any) {
        return corsResponse(NextResponse.json({ error: error.message }, { status: 500 }));
    }
}