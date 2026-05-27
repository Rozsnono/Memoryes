import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import connectDB from '@/lib/mongodb';
import { Space } from '@/models/Space';
import { corsResponse, handleOptions } from '@/lib/cors';

export async function OPTIONS(request: Request) {
    return handleOptions(request); // Pass request here
}

export async function PATCH(req: Request) {
    try {
        await connectDB();
        const { spaceId, title, targetDate, isActive } = await req.json();

        const updatedSpace = await Space.findByIdAndUpdate(
            spaceId,
            {
                $set: {
                    "countdown.title": title,
                    "countdown.targetDate": targetDate,
                    "countdown.isActive": isActive
                }
            },
            { new: true }
        );

        return corsResponse(NextResponse.json(updatedSpace), req);
    } catch (error: any) {
        return corsResponse(NextResponse.json({ error: error.message }, { status: 500 }), req);
    }
}