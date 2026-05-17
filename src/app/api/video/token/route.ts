import { NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token'; // You may need to npm install agora-access-token
import { handleOptions } from '@/lib/cors';

// CRITICAL: This prevents the 'output: export' error


export async function OPTIONS(request: Request) {
    return handleOptions(request); // Pass request here
}

export async function POST(req: Request) {
    try {
        const { channelName, uid } = await req.json();
        const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
        const appCertificate = process.env.AGORA_APP_CERTIFICATE!;

        // Token expires in 1 hour
        const expirationTimeInSeconds = 3600;
        const privilegeExpireTime = Math.floor(Date.now() / 1000) + expirationTimeInSeconds;

        const token = RtcTokenBuilder.buildTokenWithUid(
            appId, appCertificate, channelName, uid, RtcRole.PUBLISHER, privilegeExpireTime
        );

        return NextResponse.json({ token });
    } catch (error) {
        return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
    }
}