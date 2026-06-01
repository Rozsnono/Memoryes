import { NextResponse } from "next/server";
import connectDB from "./mongodb";
import { Log } from "@/models/Log";

/**
 * Background worker to save logs to MongoDB
 */
async function saveLog(req: Request, res: NextResponse, startTime: number) {
    try {
        await connectDB();
        const { pathname } = new URL(req.url);

        // Skip logging for the log viewer itself to prevent loops
        if (pathname.includes('/api/admin/logs')) return;

        await Log.create({
            method: req.method,
            path: pathname,
            status: res.status,
            duration: Date.now() - startTime,
            ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
            userAgent: req.headers.get("user-agent") || "unknown",
        });
    } catch (error) {
        console.error("Logging Error:", error);
    }
}

export function corsResponse(response: NextResponse, request: Request, startTime?: number) {
    const origin = request.headers.get("origin");

    const allowedOrigins = [
        "capacitor://localhost",
        "http://localhost",
        "ionic://localhost",
        "http://localhost:3000",
        "https://memoryes.vercel.app"
    ];

    if (origin && (allowedOrigins.includes(origin) || origin.startsWith('capacitor://'))) {
        response.headers.set("Access-Control-Allow-Origin", origin);
    } else {
        response.headers.set("Access-Control-Allow-Origin", origin || "https://memoryes.vercel.app");
    }

    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version");
    response.headers.set("Access-Control-Max-Age", "86400");

    // --- NEW: LOGGING TRIGGER ---
    // If the request is NOT a preflight (OPTIONS) and we have a start time, log it
    if (request.method !== 'OPTIONS' && startTime) {
        // We don't use 'await' here so the API response returns immediately to the user
        saveLog(request, response, startTime);
    }

    return response;
}

export function handleOptions(request: Request) {
    const response = new NextResponse(null, { status: 204 });
    return corsResponse(response, request);
}