"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2, Users, ShieldCheck } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";

function CallContainer() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const channelName = searchParams.get("channel");

    // 1. Refs for Agora and Lifecycle
    const rtc = useRef<any>({ client: null, localAudioTrack: null, localVideoTrack: null });
    const remoteRef = useRef<HTMLDivElement>(null);
    const localRef = useRef<HTMLDivElement>(null);
    const isConnecting = useRef(false);

    // 2. UI States
    const [joined, setJoined] = useState(false);
    const [micOn, setMicOn] = useState(true);
    const [videoOn, setVideoOn] = useState(true);
    const [remoteUsersCount, setRemoteUsersCount] = useState(0);

    useEffect(() => {
        if (!channelName) return;

        // Cleanup flag to prevent state updates after unmount
        let isComponentActive = true;

        const initCall = async () => {
            // Guard: If already connecting or connected, do nothing
            if (isConnecting.current) return;
            isConnecting.current = true;

            try {
                const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;

                // --- MOBILE PERMISSION CHECK ---
                if (Capacitor.isNativePlatform()) {
                    // This triggers the native iOS/Android permission prompt
                    await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                }

                // Create client if it doesn't exist
                if (!rtc.current.client) {
                    rtc.current.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
                }

                // Ensure we are starting from a clean slate
                if (rtc.current.client.connectionState !== "DISCONNECTED") {
                    await rtc.current.client.leave();
                }

                // Get Token
                const uid = Math.floor(Math.random() * 100000);
                const { data } = await apiClient.post('/api/video/token/', { channelName, uid });

                if (!isComponentActive) return;

                rtc.current.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                rtc.current.localVideoTrack = await AgoraRTC.createCameraVideoTrack();

                // JOIN
                await rtc.current.client.join(
                    process.env.NEXT_PUBLIC_AGORA_APP_ID!,
                    channelName,
                    data.token,
                    uid
                );

                if (!isComponentActive) {
                    await rtc.current.client.leave();
                    return;
                }

                // Create and Publish Tracks
                rtc.current.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                rtc.current.localVideoTrack = await AgoraRTC.createCameraVideoTrack();

                if (localRef.current) {
                    rtc.current.localVideoTrack.play(localRef.current);
                }

                await rtc.current.client.publish([rtc.current.localAudioTrack, rtc.current.localVideoTrack]);

                if (isComponentActive) {
                    setJoined(true);
                    isConnecting.current = false;
                }

                // Remote User Listeners
                rtc.current.client.on("user-published", async (user: any, mediaType: "video" | "audio") => {
                    await rtc.current.client.subscribe(user, mediaType);
                    if (mediaType === "video") {
                        setRemoteUsersCount(prev => prev + 1);
                        setTimeout(() => {
                            if (remoteRef.current) user.videoTrack.play(remoteRef.current);
                        }, 200);
                    }
                    if (mediaType === "audio") user.audioTrack.play();
                });

                rtc.current.client.on("user-left", () => {
                    setRemoteUsersCount(prev => Math.max(0, prev - 1));
                });

            } catch (err: any) {
                console.error("Agora Critical Error:", err);
                isConnecting.current = false;
                if (isComponentActive) {
                    toast.error("Call failed to initialize", { description: JSON.stringify(err) || "Please try again." });
                    router.replace('/dashboard');
                }
            }
        };

        initCall();

        // CLEANUP: Executed when user leaves page or Strict Mode re-mounts
        return () => {
            isComponentActive = false;
            const cleanup = async () => {
                if (rtc.current.localAudioTrack) {
                    rtc.current.localAudioTrack.stop();
                    rtc.current.localAudioTrack.close();
                }
                if (rtc.current.localVideoTrack) {
                    rtc.current.localVideoTrack.stop();
                    rtc.current.localVideoTrack.close();
                }
                if (rtc.current.client) {
                    await rtc.current.client.leave();
                }
                isConnecting.current = false;
            };
            cleanup();
        };
    }, [channelName, router]);

    const endCall = () => {
        router.replace('/dashboard');
    };

    return (
        <div className="h-screen w-full bg-slate-950 relative overflow-hidden">
            {/* Remote Video Container */}
            <div ref={remoteRef} className="absolute inset-0 z-0 bg-slate-900">
                {remoteUsersCount === 0 && joined && (
                    <div className="h-full w-full flex flex-col items-center justify-center space-y-6">
                        <div className="w-24 h-24 rounded-[3rem] bg-memoria-primary/10 border border-white/5 flex items-center justify-center animate-pulse">
                            <Users className="text-memoria-primary" size={40} />
                        </div>
                        <p className="text-white/20 text-[10px] font-black uppercase tracking-[5px]">Waiting for family...</p>
                    </div>
                )}
                {!joined && (
                    <div className="h-full w-full flex flex-col items-center justify-center gap-4">
                        <Loader2 className="animate-spin text-memoria-primary" size={32} />
                        <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Opening Secure Vault...</span>
                    </div>
                )}
            </div>

            {/* Local View (PiP) */}
            <motion.div
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                ref={localRef}
                className="absolute top-16 right-6 w-32 h-48 bg-black rounded-[2.5rem] z-50 overflow-hidden border-2 border-white/10 shadow-2xl"
            >
                {!videoOn && (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800">
                        <VideoOff className="text-white/10" size={20} />
                    </div>
                )}
            </motion.div>

            {/* Floating Top UI */}
            <div className="absolute top-14 left-0 right-0 z-30 flex justify-center pointer-events-none">
                <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/5">
                    <ShieldCheck size={12} className="text-emerald-400" />
                    <span className="text-[9px] font-black text-white/50 uppercase tracking-[3px]">Memoria Live</span>
                </div>
            </div>

            {/* Control Center */}
            <div className="absolute bottom-12 left-0 right-0 z-50 px-8">
                <div className="max-w-xs mx-auto bg-white/10 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-4 flex justify-between items-center shadow-2xl">
                    <button
                        onClick={() => { rtc.current.localAudioTrack?.setEnabled(!micOn); setMicOn(!micOn); }}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${micOn ? 'bg-white/10 text-white' : 'bg-rose-500 text-white shadow-lg'}`}
                    >
                        {micOn ? <Mic size={24} /> : <MicOff size={24} />}
                    </button>

                    <button onClick={endCall} className="w-16 h-16 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xl active:scale-95 transition-transform">
                        <PhoneOff size={28} />
                    </button>

                    <button
                        onClick={() => { rtc.current.localVideoTrack?.setEnabled(!videoOn); setVideoOn(!videoOn); }}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${videoOn ? 'bg-white/10 text-white' : 'bg-rose-500 text-white shadow-lg'}`}
                    >
                        {videoOn ? <Video size={24} /> : <VideoOff size={24} />}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function VideoCallPage() {
    return (
        <Suspense fallback={<div className="h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>}>
            <CallContainer />
        </Suspense>
    );
}