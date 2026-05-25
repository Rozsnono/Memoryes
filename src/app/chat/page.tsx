"use client";

import { useState, useEffect, useRef } from "react";
import apiClient from "@/lib/apiClient";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Video, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function ChatInitializerPage() {
    const router = useRouter();
    const [status, setStatus] = useState("Authenticating...");
    const hasStarted = useRef(false); // Prevent double-trigger

    useEffect(() => {
        // Prevent the effect from running twice in dev mode
        if (hasStarted.current) return;

        const initSequence = async () => {
            hasStarted.current = true;
            try {
                const { data: user } = await apiClient.get('/api/auth/me/');

                if (!user || !user.activeSpace) {
                    toast.error("No active vault found.");
                    router.push('/dashboard');
                    return;
                }

                await startCall(user);

            } catch (err: any) {
                router.push('/login');
            }
        };

        initSequence();
    }, []);

    async function startCall(user: any) {
        setStatus("Inviting family...");

        const channelId = typeof user.activeSpace === 'object'
            ? user.activeSpace._id
            : user.activeSpace;

        try {
            // Optional: Send the Pusher message
            await apiClient.post('/api/messages/', {
                spaceId: channelId,
                senderId: user._id,
                senderName: user.name,
                text: "🎥 I'm starting a video call!",
                type: 'text'
            });

            setStatus("Entering Vault...");
            // Use replace instead of push to prevent back-button loops
            router.replace(`/call?channel=${channelId}`);

        } catch (err: any) {
            // If the message fails, still try to join the call
            router.replace(`/call?channel=${channelId}`);
        }
    }

    return (
        <div className="h-screen w-full bg-memoryes-background flex flex-col items-center justify-center p-8">
            <button
                onClick={() => router.push('/dashboard')}
                className="absolute top-12 left-6 p-3 bg-white rounded-full shadow-sm text-slate-400"
            >
                <ChevronLeft size={20} />
            </button>

            <motion.div animate={{ scale: [0.9, 1, 0.9] }} transition={{ repeat: Infinity, duration: 2 }} className="w-20 h-20 bg-memoryes-soft rounded-[2rem] flex items-center justify-center mb-6 shadow-lg">
                <Video size={32} className="text-memoryes-primary" />
            </motion.div>

            <h1 className="text-xl font-serif italic text-memoryes-clay">memoryes Live</h1>
            <div className="flex items-center gap-2 mt-2 text-slate-400">
                <Loader2 size={12} className="animate-spin" />
                <span className="text-[9px] font-black uppercase tracking-[2px]">{status}</span>
            </div>
        </div>
    );
}