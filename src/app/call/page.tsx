"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Mic, MicOff, Video, VideoOff, PhoneOff,
    Loader2, Users, ShieldCheck, RefreshCw, Maximize2
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";

function CallContainer() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const channelName = searchParams.get("channel");

    const rtc = useRef<any>({
        client: null,
        localAudioTrack: null,
        localVideoTrack: null,
        currentCameraIndex: 0,
        cameras: []
    });

    const remoteRef = useRef<HTMLDivElement>(null);
    const localRef = useRef<HTMLDivElement>(null);
    const isProcessing = useRef(false);

    // --- UI States ---
    const [joined, setJoined] = useState(false);
    const [micOn, setMicOn] = useState(true);
    const [videoOn, setVideoOn] = useState(true);
    const [remoteUsersCount, setRemoteUsersCount] = useState(0);
    const [layoutMode, setLayoutMode] = useState<'pip' | 'grid'>('pip'); // Toggle between floating and 50/50
    const [isLocalMain, setIsLocalMain] = useState(false); // For swapping who is big

    useEffect(() => {
        if (!channelName || isProcessing.current) return;

        const initCall = async () => {
            isProcessing.current = true;
            try {
                const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
                const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
                if (!appId) throw new Error("AGORA_APP_ID_MISSING");

                if (Capacitor.isNativePlatform()) {
                    await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                }

                rtc.current.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
                const uid = Math.floor(Math.random() * 100000);
                const { data } = await apiClient.post('/api/video/token/', { channelName, uid });

                await rtc.current.client.join(appId, channelName, data.token, uid);

                rtc.current.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                rtc.current.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
                rtc.current.cameras = await AgoraRTC.getCameras();

                // Start playing local video
                if (localRef.current) rtc.current.localVideoTrack.play(localRef.current);

                await rtc.current.client.publish([rtc.current.localAudioTrack, rtc.current.localVideoTrack]);
                setJoined(true);

                rtc.current.client.on("user-published", async (user: any, mediaType: any) => {
                    await rtc.current.client.subscribe(user, mediaType);
                    if (mediaType === "video") {
                        setRemoteUsersCount(prev => prev + 1);
                        setTimeout(() => {
                            if (remoteRef.current) user.videoTrack.play(remoteRef.current);
                        }, 500);
                    }
                    if (mediaType === "audio") user.audioTrack.play();
                });

                rtc.current.client.on("user-left", () => {
                    setRemoteUsersCount(prev => Math.max(0, prev - 1));
                });

            } catch (err: any) {
                toast.error(`Vault error: ${err.message}`);
                navigator.clipboard.writeText(JSON.stringify(err) || "");
                router.replace('/dashboard');
            } finally {
                isProcessing.current = false;
            }
        };

        initCall();

        return () => {
            rtc.current.localAudioTrack?.stop();
            rtc.current.localAudioTrack?.close();
            rtc.current.localVideoTrack?.stop();
            rtc.current.localVideoTrack?.close();
            rtc.current.client?.leave();
        };
    }, [channelName, router]);

    const switchCamera = async () => {
        if (rtc.current.cameras.length < 2) return toast.error("No other camera");
        const nextIndex = (rtc.current.currentCameraIndex + 1) % rtc.current.cameras.length;
        try {
            await rtc.current.localVideoTrack.setDevice(rtc.current.cameras[nextIndex].deviceId);
            rtc.current.currentCameraIndex = nextIndex;
        } catch (e) { toast.error("Flip failed"); }
    };

    return (
        <div className="h-screen w-full bg-slate-950 overflow-hidden relative">

            {/* --- BACKGROUND LAYER (Usually Remote User) --- */}
            <div
                ref={isLocalMain ? localRef : remoteRef}
                className="absolute inset-0 z-0 bg-slate-900 transition-all duration-500"
            >
                {/* Empty State */}
                {remoteUsersCount === 0 && !isLocalMain && joined && (
                    <div className="h-full w-full flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="animate-spin text-memoryes-primary/40" size={40} />
                        <p className="text-white/20 text-[10px] font-black uppercase tracking-[4px]">Waiting for family...</p>
                    </div>
                )}
            </div>

            {/* --- FLOATING / PIP LAYER (Usually You) --- */}
            <AnimatePresence>
                {joined && (
                    <motion.div
                        drag
                        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                        dragElastic={0.1}
                        onClick={() => setIsLocalMain(!isLocalMain)} // Tap to swap
                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            // If remote is there, be small. If not, be big (unless swapped)
                            width: (remoteUsersCount > 0 && !isLocalMain) ? "120px" : "100%",
                            height: (remoteUsersCount > 0 && !isLocalMain) ? "180px" : "100%",
                            top: (remoteUsersCount > 0 && !isLocalMain) ? "80px" : "0px",
                            right: (remoteUsersCount > 0 && !isLocalMain) ? "20px" : "0px",
                            borderRadius: (remoteUsersCount > 0 && !isLocalMain) ? "24px" : "0px",
                        }}
                        className={`absolute z-40 overflow-hidden shadow-2xl bg-black border-2 transition-all ${(remoteUsersCount > 0 && !isLocalMain) ? 'border-white/20' : 'border-transparent'
                            }`}
                        ref={isLocalMain ? remoteRef : localRef}
                    >
                        {!videoOn && !isLocalMain && (
                            <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                <VideoOff className="text-white/20" size={20} />
                            </div>
                        )}
                        {/* Swap indicator */}
                        {remoteUsersCount > 0 && (
                            <div className="absolute top-2 right-2 bg-black/40 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                <Maximize2 size={12} className="text-white" />
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- TOP HUD --- */}
            <div className="absolute top-14 left-0 right-0 z-50 flex justify-center pointer-events-none">
                <div className="flex items-center gap-2 bg-black/30 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/10 shadow-2xl">
                    <ShieldCheck size={14} className="text-emerald-400" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[2px]">
                        {channelName} Vault
                    </span>
                </div>
            </div>

            {/* --- CONTROLS --- */}
            <div className="absolute bottom-12 left-0 right-0 z-[100] px-8">
                <div className="max-w-md mx-auto flex items-center justify-between">

                    <div className="flex gap-2">
                        <button
                            onClick={() => { rtc.current.localAudioTrack?.setEnabled(!micOn); setMicOn(!micOn); }}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${micOn ? 'bg-white/10 text-white border border-white/10' : 'bg-rose-500 text-white'}`}
                        >
                            {micOn ? <Mic size={20} /> : <MicOff size={20} />}
                        </button>

                        <button
                            onClick={switchCamera}
                            className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/10 text-white border border-white/10 active:scale-90 transition-all"
                        >
                            <RefreshCw size={20} />
                        </button>
                    </div>

                    <button
                        onClick={() => router.replace('/dashboard')}
                        className="w-16 h-16 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-2xl shadow-rose-600/40 active:scale-75 transition-transform"
                    >
                        <PhoneOff size={28} />
                    </button>

                    <button
                        onClick={() => { rtc.current.localVideoTrack?.setEnabled(!videoOn); setVideoOn(!videoOn); }}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${videoOn ? 'bg-white/10 text-white border border-white/10' : 'bg-rose-500 text-white'}`}
                    >
                        {videoOn ? <Video size={20} /> : <VideoOff size={20} />}
                    </button>

                </div>
            </div>
        </div>
    );
}

export default function VideoCallPage() {
    return (
        <Suspense fallback={<div className="h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>}>
            <CallContainer />
        </Suspense>
    );
}