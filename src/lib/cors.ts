// lib/cors.ts
import { NextResponse } from "next/server";

export function corsResponse(response: NextResponse, request?: Request) {
    const reqOrigin = request?.headers.get("origin") || "*";

    response.headers.set("Access-Control-Allow-Origin", reqOrigin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.headers.set("Access-Control-Max-Age", "86400");

    return response;
}

export function handleOptions(request: Request) {
    const response = new NextResponse(null, { status: 200 });
    return corsResponse(response, request);
}