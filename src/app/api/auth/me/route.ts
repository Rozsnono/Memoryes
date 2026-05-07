// app/api/auth/me/route.ts
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { Space } from '@/models/Space';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { corsResponse, handleOptions } from '@/lib/cors';

export async function OPTIONS(request: Request) {
    return handleOptions(request); // Pass request here
}

export async function GET(req: Request) {
    try {
        await connectDB();

        // Get token from Authorization header
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        const _forceRegisterUser = User.modelName;
        const _forceRegisterSpace = Space.modelName;

        if (!token) {
            return corsResponse(NextResponse.json({ error: "No token" }, { status: 401 }));
        }

        // Verify Token
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');

        // Find User & Populate Space
        const user = await User.findById(decoded.userId).populate('spaceId');
        if (!user) {
            return corsResponse(NextResponse.json({ error: "User not found" }, { status: 404 }));
        }

        return corsResponse(NextResponse.json(user));
    } catch (error: any) {
        console.error("GET /api/auth/me - Error:", error);
        return corsResponse(NextResponse.json({ error: "Invalid token" }, { status: 401 }));
    }
}