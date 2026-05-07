// app/api/media/sign/route.ts
import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';
import { corsResponse, handleOptions } from '@/lib/cors';

export const dynamic = 'force-dynamic';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function OPTIONS() {
    return handleOptions();
}

export async function POST() {
    try {
        const timestamp = Math.round(new Date().getTime() / 1000);

        // Check if variables exist
        if (!process.env.CLOUDINARY_API_SECRET) {
            console.error("CRITICAL: CLOUDINARY_API_SECRET is missing from .env.local");
            throw new Error("Cloudinary Secret Missing");
        }

        const signature = cloudinary.utils.api_sign_request(
            { timestamp, folder: 'memoria_vault' },
            process.env.CLOUDINARY_API_SECRET
        );

        return corsResponse(NextResponse.json({
            signature,
            timestamp,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            apiKey: process.env.CLOUDINARY_API_KEY,
        }));
    } catch (error: any) {
        console.error("Cloudinary Signature Error:", error.message);
        return corsResponse(NextResponse.json({ error: error.message }, { status: 500 }));
    }
}