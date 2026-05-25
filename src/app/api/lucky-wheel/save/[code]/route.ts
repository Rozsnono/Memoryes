import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SavedGame from '@/models/SavedGame';
import { corsResponse, handleOptions } from '@/lib/cors';

export async function OPTIONS(request: Request) {
    return handleOptions(request); // Pass request here
}

// Explicitly type params as a Promise to satisfy Next.js 15 constraints [4]
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ code: string }> }
) {
    try {
        await dbConnect();

        // Resolve the asynchronous params object [4]
        const { code } = await context.params;
        const saved = await SavedGame.findOne({ saveCode: code });

        if (!saved) {
            return corsResponse(NextResponse.json({ success: false, error: 'A mentés nem található ezen a kódon.' }, { status: 404 }), request);
        }

        return corsResponse(NextResponse.json({ success: true, data: saved }, { status: 200 }), request);
    } catch (error: any) {
        return corsResponse(NextResponse.json({ success: false, error: error.message }, { status: 500 }), request);
    }
}