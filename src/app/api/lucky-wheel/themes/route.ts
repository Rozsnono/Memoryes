import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Theme from '@/models/Theme';
import { SEED_DATA } from '@/lib/seed';
import { corsResponse, handleOptions } from '@/lib/cors';

export async function OPTIONS(request: Request) {
    return handleOptions(request); // Pass request here
}

export async function GET(request: Request) {
    try {
        await dbConnect();
        let themes = await Theme.find({});

        // Auto-seed if collection is completely fresh
        if (themes.length === 0) {
            await Theme.insertMany(SEED_DATA);
            themes = await Theme.find({});
        }

        return corsResponse(NextResponse.json({ success: true, data: themes }, { status: 200 }), request);
    } catch (error: any) {
        return corsResponse(NextResponse.json({ success: false, error: error.message }, { status: 500 }), request);
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();
        const newTheme = await Theme.create(body);
        return corsResponse(NextResponse.json({ success: true, data: newTheme }, { status: 201 }), request);
    } catch (error: any) {
        return corsResponse(NextResponse.json({ success: false, error: error.message }, { status: 400 }), request);
    }
}