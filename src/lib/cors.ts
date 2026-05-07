// lib/cors.ts
import { NextResponse } from "next/server";

export function corsResponse(response: NextResponse, request?: Request) {
    // Get the specific origin from the request (e.g., capacitor://localhost or http://localhost:3000)
    const origin = request?.headers.get("origin") || "*";

    // 1. Mirror the origin (Crucial for Authorization headers)
    response.headers.set("Access-Control-Allow-Origin", origin);

    // 2. Standard CORS headers
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

    // 3. Allow credentials (Required when sending tokens/cookies)
    response.headers.set("Access-Control-Allow-Credentials", "true");

    // 4. Cache the preflight for 24 hours
    response.headers.set("Access-Control-Max-Age", "86400");

    return response;
}

/**
 * Handles the OPTIONS preflight request.
 * Use status 204 (No Content) for preflight success.
 */
export function handleOptions(request: Request) {
    const response = new NextResponse(null, { status: 204 });
    return corsResponse(response, request);
}