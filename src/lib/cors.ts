// lib/cors.ts
import { NextResponse } from "next/server";

export function corsResponse(response: NextResponse, request: Request) {
    // 1. Get the specific origin from the incoming request
    const origin = request.headers.get("origin");

    // 2. Define allowed origins (Add your Vercel URL here too)
    const allowedOrigins = [
        "capacitor://localhost",
        "http://localhost",
        "ionic://localhost",
        "http://localhost:3000",
        "https://memoryes.vercel.app"
    ];

    // 3. Logic: If the origin is in our list or is a Capacitor app, echo it back.
    // If we can't find an origin, we MUST NOT use "*" if we want to send tokens.
    if (origin && (allowedOrigins.includes(origin) || origin.startsWith('capacitor://'))) {
        response.headers.set("Access-Control-Allow-Origin", origin);
    } else {
        // Fallback for safety, but this might block Auth. 
        // It's better to echo the origin if it exists.
        response.headers.set("Access-Control-Allow-Origin", origin || "https://memoryes.vercel.app");
    }

    // 4. Critical Headers for Vercel + Authorization
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version");

    // 5. Cache preflight for 24 hours
    response.headers.set("Access-Control-Max-Age", "86400");

    return response;
}

export function handleOptions(request: Request) {
    // Vercel prefers 200 or 204 for OPTIONS
    const response = new NextResponse(null, { status: 204 });
    return corsResponse(response, request);
}