"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import {
    ChevronLeft, Users, Loader2, Sparkles, Trophy,
    Calendar, History, ArrowDown, GripVertical
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import Pusher from "pusher-js";
import { toast } from "sonner";

function TimelineSyncContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const gameId = searchParams.get('id');

    const [user, setUser] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [gameState, setGameState] = useState<'intro' | 'playing' | 'won'>('intro');
    const [loading, setLoading] = useState(true);
    const isMovingLocally = useRef(false);
    const currentId = useRef(gameId);

    useEffect(() => {
        const init = async () => {
            try {
                const { data: userData } = await apiClient.get('/api/auth/me/');
                setUser(userData);

                const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
                    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
                });

                const channel = pusher.subscribe(userData.activeSpace);

                channel.bind('timeline-move', (data: any) => {
                    if (data.gameId === (gameId || currentId.current) && !isMovingLocally.current) {
                        setItems(data.newOrder);
                    }
                });

                if (gameId) {
                    const { data: gameData } = await apiClient.get(`/api/games/timeline/single?id=${gameId}`);
                    setItems([...gameData.photos].sort(() => Math.random() - 0.5));
                    setGameState('playing');
                }
            } catch (e) {
                toast.error("Vault sync lost");
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [gameId]);

    const startSession = async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.post('/api/games/timeline/', {
                spaceId: user.activeSpace,
                userId: user._id,
                userName: user.name
            });
            currentId.current = data._id;
            setItems([...data.photos].sort(() => Math.random() - 0.5));
            setGameState('playing');
        } catch (e) {
            toast.error("Not enough memories in this vault yet!");
        } finally {
            setLoading(false);
        }
    };

    const handleReorder = (newOrder: any[]) => {
        setItems(newOrder);
        isMovingLocally.current = true;

        apiClient.post('/api/games/timeline/sync/', {
            spaceId: user.activeSpace,
            gameId: gameId || currentId.current,
            newOrder
        }).finally(() => {
            setTimeout(() => { isMovingLocally.current = false; }, 500);
        });
    };

    const verifyTimeline = () => {
        // Validation: Oldest (Smallest timestamp) to Newest
        const correctlySorted = [...items].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const isCorrect = JSON.stringify(items.map(i => i.id)) === JSON.stringify(correctlySorted.map(i => i.id));

        if (isCorrect) {
            setGameState('won');
            toast.success("Timeline Synced Perfectly!");
        } else {
            toast.error("The sequence is incorrect. Recall your history!");
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-memoryes-background"><Loader2 className="animate-spin text-memoryes-primary" /></div>;

    return (
        <div className="min-h-screen bg-memoryes-background flex flex-col items-center">
            <header className="pt-12 w-full px-6 flex justify-between items-center mb-8">
                <button onClick={() => router.back()} className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 active:scale-90 transition-transform"><ChevronLeft /></button>
                <div className="text-center">
                    <h1 className="text-xl font-serif italic text-memoryes-clay">Timeline Sync</h1>
                    {gameState === 'playing' && (
                        <div className="flex items-center gap-1.5 justify-center mt-1">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Family Live</span>
                        </div>
                    )}
                </div>
                <div className="w-12" />
            </header>

            <AnimatePresence mode="wait">
                {/* 1. INTRO VIEW */}
                {gameState === 'intro' && (
                    <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1 flex flex-col justify-center items-center text-center px-8 space-y-10">
                        <div className="w-24 h-24 bg-memoryes-soft rounded-[3rem] flex items-center justify-center mx-auto shadow-xl">
                            <History size={48} className="text-memoryes-primary" />
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-3xl font-serif italic text-memoryes-clay leading-tight">Order the Echoes</h2>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Work with your family to drag these 5 random memories into the correct chronological order.
                            </p>
                        </div>
                        <button onClick={startSession} className="w-full py-5 bg-memoryes-clay text-white rounded-[2.2rem] font-bold shadow-xl active:scale-95 transition-all uppercase text-xs tracking-widest">
                            Start Family Session
                        </button>
                    </motion.div>
                )}

                {/* 2. PLAYING VIEW */}
                {gameState === 'playing' && (
                    <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-sm px-6 flex flex-col items-center pb-20">

                        {/* PAST MARKER */}
                        <div className="flex flex-col items-center mb-6 opacity-40">
                            <span className="text-[9px] font-black uppercase tracking-[4px] text-slate-400">The Past</span>
                            <ArrowDown size={14} className="mt-1" />
                        </div>

                        <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="w-full space-y-4">
                            {items.map((item) => (
                                <Reorder.Item
                                    key={item.id}
                                    value={item}
                                    className="bg-white p-3 rounded-[2.5rem] shadow-sm border border-slate-50 flex items-center gap-4 active:scale-95 transition-transform cursor-grab active:cursor-grabbing group"
                                >
                                    <div className="w-20 h-20 rounded-[2rem] overflow-hidden border-2 border-memoryes-soft/20 flex-shrink-0">
                                        <img src={item.url} className="w-full h-full object-cover pointer-events-none" alt="" />
                                    </div>
                                    <div className="flex-1 pr-2 overflow-hidden">
                                        <h4 className="font-bold text-memoryes-clay text-sm truncate">{item.title}</h4>
                                        <div className="flex items-center gap-1.5 mt-1 text-slate-300">
                                            <Calendar size={12} />
                                            <span className="text-[9px] font-black uppercase tracking-tighter">Date Hidden</span>
                                        </div>
                                    </div>
                                    <div className="pr-2 text-slate-100 group-active:text-memoryes-primary transition-colors">
                                        <GripVertical size={20} />
                                    </div>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>

                        {/* PRESENT MARKER */}
                        <div className="flex flex-col items-center mt-6 mb-8 opacity-40">
                            <ArrowDown size={14} className="rotate-180 mb-1" />
                            <span className="text-[9px] font-black uppercase tracking-[4px] text-slate-400">The Present</span>
                        </div>

                        <button
                            onClick={verifyTimeline}
                            className="w-full py-5 bg-memoryes-clay text-white rounded-[2rem] font-bold shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all uppercase text-[11px] tracking-widest"
                        >
                            <Sparkles size={18} /> Verify Chronology
                        </button>
                    </motion.div>
                )}

                {/* 3. WON VIEW */}
                {gameState === 'won' && (
                    <motion.div key="won" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex-1 flex flex-col justify-center items-center text-center px-10 space-y-8">
                        <div className="relative">
                            <div className="w-32 h-32 bg-memoryes-mint rounded-[4rem] flex items-center justify-center shadow-xl border-4 border-white">
                                <Trophy size={64} className="text-emerald-600" />
                            </div>
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute -inset-4 border border-dashed border-emerald-500/20 rounded-full" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-4xl font-serif italic text-memoryes-clay">History Restored</h2>
                            <p className="text-slate-400 text-sm leading-relaxed">Your family timeline is perfectly synced and preserved.</p>
                        </div>
                        <div className="w-full space-y-3">
                            <button onClick={() => window.location.reload()} className="w-full py-5 bg-memoryes-clay text-white rounded-[2rem] font-bold shadow-xl">New Session</button>
                            <button onClick={() => router.push('/games')} className="w-full py-4 text-slate-300 font-bold uppercase text-[10px] tracking-widest">Return to Lounge</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function TimelineSyncPage() {
    return <Suspense fallback={null}><TimelineSyncContent /></Suspense>;
}