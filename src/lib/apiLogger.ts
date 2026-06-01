import connectDB from './mongodb';
import { Log } from '@/models/Log';
import { NextResponse } from 'next/server';

export async function logRequest(
    req: Request,
    res: NextResponse,
    startTime: number,
    user?: any,
    payload?: any
) {
    try {
        await connectDB();
        const duration = Date.now() - startTime;
        const { pathname } = new URL(req.url);

        // Don't log the log-viewer itself to avoid infinite loops
        if (pathname.includes('/api/admin/logs')) return;

        await Log.create({
            method: req.method,
            path: pathname,
            status: res.status,
            userId: user?._id || user?.id || 'anonymous',
            userName: user?.name || 'Guest',
            ip: req.headers.get('x-forwarded-for') || '127.0.0.1',
            userAgent: req.headers.get('user-agent'),
            duration,
            // Only log payload for non-GET requests and mask passwords
            payload: req.method !== 'GET' ? JSON.parse(JSON.stringify(payload || {})) : null
        });
    } catch (error) {
        console.error("Logging failed:", error);
    }
}