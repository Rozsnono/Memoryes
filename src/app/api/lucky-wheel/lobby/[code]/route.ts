import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Lobby from '@/models/Lobby';
import { corsResponse, handleOptions } from '@/lib/cors';


export async function OPTIONS(request: Request) {
    return handleOptions(request); // Pass request here
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        await dbConnect();
        const { code } = await params;

        // Use .lean() to bypass Mongoose's hydration/schema-filtering and return raw DB properties [6]
        const lobby = await Lobby.findOne({ code: code.toUpperCase() }).lean();

        if (!lobby) {
            return corsResponse(NextResponse.json({ success: false, error: 'Szoba nem található.' }, { status: 404 }), request);
        }

        return corsResponse(NextResponse.json({ success: true, data: lobby }, { status: 200 }), request);
    } catch (error: any) {
        return corsResponse(NextResponse.json({ success: false, error: error.message }, { status: 500 }), request);
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        await dbConnect();
        const { code } = await params;
        const body = await request.json();

        // Use findOneAndUpdate with $set to bypass stale in-memory Mongoose schema validation on writes [1]
        const lobby = await Lobby.findOneAndUpdate(
            { code: code.toUpperCase() },
            { $set: body },
            { new: true, runValidators: false } // return updated document
        ).lean(); // return raw JSON

        if (!lobby) {
            return corsResponse(NextResponse.json({ success: false, error: 'Szoba nem található.' }, { status: 404 }), request);
        }

        return corsResponse(NextResponse.json({ success: true, data: lobby }, { status: 200 }), request);
    } catch (error: any) {
        return corsResponse(NextResponse.json({ success: false, error: error.message }, { status: 500 }), request);
    }
}