// app/api/spaces/join/route.ts
import connectDB from '@/lib/mongodb';
import { Space } from '@/models/Space';
import { User } from '@/models/User';
import { NextResponse } from 'next/server';
import { corsResponse, handleOptions } from '@/lib/cors';
import jwt from 'jsonwebtoken';

export async function OPTIONS(request: Request) {
    return handleOptions(request); // Pass request here
}

export async function POST(req: Request) {

    try {
        await connectDB();
        const { name, type } = await req.json();

        const authHeader = req.headers.get('authorization');
        const token = authHeader?.split(' ')[1];
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');

        // Map default colors to vault types
        const typeColors: Record<string, string> = {
            personal: '#9B86BD', // Lavender
            couple: '#FFD1DC',   // Rose
            family: '#E0F2F1'    // Mint
        };

        // 1. Create the new Space
        const newSpace = await Space.create({
            name,
            type,
            createdBy: decoded.userId,
            members: [decoded.userId],
            themeColor: typeColors[type] || '#9B86BD'
        });

        // 2. Add to User's list and set as Active
        const updatedUser = await User.findByIdAndUpdate(
            decoded.userId,
            {
                $push: { spaces: newSpace._id },
                $set: { activeSpace: newSpace._id }
            },
            { new: true }
        ).populate('spaces');

        return corsResponse(NextResponse.json({
            message: "Successfully created the vault!",
            user: updatedUser
        }, { status: 200 }), req);

    } catch (error: any) {
        return corsResponse(NextResponse.json({ error: error.message }, { status: 500 }), req);
    }
}