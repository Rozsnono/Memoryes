// app/api/spaces/join/route.ts
import connectDB from '@/lib/mongodb';
import { Space } from '@/models/Space';
import { User } from '@/models/User';
import { NextResponse } from 'next/server';
import { corsResponse, handleOptions } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
    return handleOptions();
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const { inviteCode, userId } = await req.json();

        // 1. Find the space with this code
        const targetSpace = await Space.findOne({ inviteCode });
        if (!targetSpace) {
            return corsResponse(NextResponse.json({ error: "Invalid invite code" }, { status: 404 }));
        }

        // 2. Add user to Space members
        await Space.findByIdAndUpdate(targetSpace._id, {
            $addToSet: { members: userId } // Prevents duplicates
        });

        // 3. Update User's spaceId
        const updatedUser = await User.findByIdAndUpdate(userId, {
            spaceId: targetSpace._id,
            mode: targetSpace.type // Sync mode with the space they joined
        }, { new: true });

        return corsResponse(NextResponse.json({
            message: "Successfully joined the vault!",
            user: updatedUser
        }));

    } catch (error: any) {
        return corsResponse(NextResponse.json({ error: error.message }, { status: 500 }));
    }
}