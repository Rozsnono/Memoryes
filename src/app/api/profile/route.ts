// app/api/profile/route.ts
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { Space } from '@/models/Space';
import { NextResponse } from 'next/server';
import { corsResponse, handleOptions } from '@/lib/cors';
import jwt from 'jsonwebtoken';



export async function OPTIONS(request: Request) {
    return handleOptions(request); // Pass request here
}

export async function GET(req: Request) {

    try {
        await connectDB();

        // 1. Get token from headers
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.split(' ')[1];

        const _forceRegisterUser = User.modelName;
        const _forceRegisterSpace = Space.modelName;

        if (!token) return corsResponse(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));

        // 2. Verify and find user
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const user = await User.findById(decoded.userId).populate('spaceId');

        if (!user) return corsResponse(NextResponse.json({ error: "User not found" }, { status: 404 }));

        return corsResponse(NextResponse.json(user));
    } catch (error: any) {
        return corsResponse(NextResponse.json({ error: "Invalid session" }, { status: 401 }));
    }
}

export async function PATCH(req: Request) {

    try {
        await connectDB();
        const body = await req.json(); // Expected: { name, avatar, bioEnabled, themeColor }

        const authHeader = req.headers.get('authorization');
        const token = authHeader?.split(' ')[1];
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');

        // Dynamically build the update object
        const updateData: any = {};
        if (body.name) updateData.name = body.name;
        if (body.avatar) updateData.avatar = body.avatar; // This is the Cloudinary URL
        if (typeof body.bioEnabled === 'boolean') updateData.bioEnabled = body.bioEnabled;

        const user = await User.findByIdAndUpdate(
            decoded.userId,
            updateData,
            { new: true }
        ).populate('spaceId');

        return corsResponse(NextResponse.json(user));
    } catch (error: any) {
        return corsResponse(NextResponse.json({ error: error.message }, { status: 500 }));
    }
}