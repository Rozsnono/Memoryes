// app/api/auth/register/route.ts
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { Space } from '@/models/Space';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { corsResponse, handleOptions } from '@/lib/cors';

export async function OPTIONS(request: Request) {
    return handleOptions(request); // Pass request here
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const { name, email, password } = await req.json();

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return corsResponse(NextResponse.json({ error: "User already exists" }, { status: 400 }), req);
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            spaces: [],
        });

        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });

        return corsResponse(NextResponse.json({ token, user: newUser }, { status: 201 }), req);

    } catch (error: any) {
        return corsResponse(NextResponse.json({ error: error.message }, { status: 500 }), req);
    }
}