import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import jwt from 'jsonwebtoken';
import { corsResponse, handleOptions } from '@/lib/cors';

export async function OPTIONS(request: Request) {
    return handleOptions(request); // Pass request here
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const { spaceId } = await req.json();

        const authHeader = req.headers.get('authorization');
        const token = authHeader?.split(' ')[1] as string;
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');

        const user = await User.findByIdAndUpdate(
            decoded.userId,
            { activeSpace: spaceId },
            { new: true }
        ).populate('spaces');

        return corsResponse(NextResponse.json(user), req);
    } catch (error: any) {
        return corsResponse(NextResponse.json({ error: error.message }, { status: 500 }), req);
    }
}