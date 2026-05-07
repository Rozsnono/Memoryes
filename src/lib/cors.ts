// lib/cors.ts
import { NextResponse } from "next/server";

export function corsResponse(response: NextResponse) {
    const origin = "capacitor://localhost"; // In dev, you can use "*" to test

    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.headers.set("Access-Control-Max-Age", "86400");

    return response;
}

export function handleOptions() {
    const response = new NextResponse(null, { status: 204 });
    return corsResponse(response);
}