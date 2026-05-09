// app/api/spaces/join/route.ts
import connectDB from '@/lib/mongodb';
import { Space } from '@/models/Space';
import { User } from '@/models/User';
import { NextResponse } from 'next/server';
import { corsResponse, handleOptions } from '@/lib/cors';



export async function OPTIONS(request: Request) {
    return handleOptions(request); // Pass request here
}

export async function POST(req: Request) {

    try {
        await connectDB();
        const { inviteCode, userId } = await req.json();

        // 1. Find the space with this code
        const targetSpace = await Space.findOne({ inviteCode });
        if (!targetSpace) {
            return corsResponse(NextResponse.json({ error: "Invalid invite code" }, { status: 404 }), req);
        }

        // 2. Add user to Space members
        await Space.findByIdAndUpdate(targetSpace._id, {
            $addToSet: { members: userId } // Prevents duplicates
        });

        // 3. Update User's spaceId
        const updatedUser = await User.findByIdAndUpdate(userId, {
            spaces: [targetSpace._id], // For simplicity, we set this as the only space. In a real app, you'd likely want to allow multiple spaces.
            activeSpace: targetSpace._id,
            mode: targetSpace.type // Sync mode with the space they joined
        }, { new: true });

        return corsResponse(NextResponse.json({
            message: "Successfully joined the vault!",
            user: updatedUser
        }, { status: 200 }), req);

    } catch (error: any) {
        return corsResponse(NextResponse.json({ error: error.message }, { status: 500 }), req);
    }
}