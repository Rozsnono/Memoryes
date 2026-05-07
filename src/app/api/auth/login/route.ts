// app/api/auth/login/route.ts
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { corsResponse, handleOptions } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
    return handleOptions();
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const { email, password } = await req.json();

        const user = await User.findOne({ email });
        if (!user) {
            return corsResponse(NextResponse.json({ error: "Invalid credentials" }, { status: 400 }));
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return corsResponse(NextResponse.json({ error: "Invalid credentials" }, { status: 400 }));
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '30d' }
        );

        return corsResponse(NextResponse.json({
            token,
            user: { id: user._id, name: user.name, email: user.email, mode: user.mode, spaceId: user.spaceId }
        }));

    } catch (error: any) {
        return corsResponse(NextResponse.json({ error: error.message }, { status: 500 }));
    }
}