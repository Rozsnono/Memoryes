"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, MapPin, Trophy, Loader2, Play, Navigation, Target, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";

const GeoguessrMap = dynamic(() => import("@/components/GeoguessrMap"), { ssr: false });

export default function GeoguessrPage() {
    const router = useRouter();
    const [gameState, setGameState] = useState<'loading' | 'playing' | 'result' | 'gameover'>('loading');
    const [memories, setMemories] = useState<any[]>([]);
    const [currentRound, setCurrentRound] = useState(0);
    const [score, setScore] = useState(0);
    const [roundPoints, setRoundPoints] = useState(0);

    // Round Logic
    const [userGuess, setUserGuess] = useState<[number, number] | null>(null);
    const [distance, setDistance] = useState<number | null>(null);

    useEffect(() => {
        const fetchGameData = async () => {
            try {
                const { data: user } = await apiClient.get('/api/auth/me/');
                const { data: allMems } = await apiClient.get(`/api/memories/?spaceId=${user.activeSpace}`);

                // Only take memories with valid manual or GPS coordinates
                const pool = allMems.filter((m: any) =>
                    m.location?.coordinates && m.location.coordinates[0] !== 0
                ).sort(() => Math.random() - 0.5).slice(0, 5);

                if (pool.length < 3) {
                    toast.error("You need at least 3 geotagged photos to play!");
                    router.back();
                    return;
                }
                setMemories(pool);
                setGameState('playing');
            } catch (e) {
                toast.error("Failed to load vault");
            }
        };
        fetchGameData();
    }, []);

    const calculateDistance = (p1: [number, number], p2: [number, number]) => {
        const R = 6371; // Earth radius in KM
        const dLat = (p2[1] - p1[1]) * Math.PI / 180;
        const dLon = (p2[0] - p1[0]) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(p1[1] * Math.PI / 180) * Math.cos(p2[1] * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c);
    };

    const handleConfirmGuess = () => {
        // 1. Double check that guess exists and is valid
        if (!userGuess || userGuess[0] === undefined || userGuess[1] === undefined) {
            toast.error("Please drop a pin on the map first!");
            return;
        }

        const actual = memories[currentRound].location.coordinates;

        // 2. Validate Actual coordinates from DB
        if (!actual || actual[0] === undefined || actual[1] === undefined) {
            toast.error("This memory is missing valid location data. Skipping...");
            nextRound();
            return;
        }

        const dist = calculateDistance(userGuess, actual);

        // Scoring: 5000 is max. Every km off loses 2 points.
        const points = Math.max(0, 5000 - Math.round(dist * 2));

        setDistance(dist);
        setRoundPoints(points);
        setScore(prev => prev + points);
        setGameState('result');
    };

    const nextRound = () => {
        if (currentRound < memories.length - 1) {
            setCurrentRound(prev => prev + 1);
            setUserGuess(null);
            setGameState('playing');
        } else {
            setGameState('gameover');
        }
    };

    if (gameState === 'loading') return (
        <div className="h-screen bg-memoryes-background flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-memoryes-primary" size={40} />
            <p className="text-[10px] font-black uppercase tracking-[4px] mt-4 text-slate-400">Loading Map Data</p>
        </div>
    );

    const currentMem = memories[currentRound];

    return (
        <div className="h-screen w-full bg-slate-950 flex flex-col overflow-hidden relative">

            {/* Header HUD */}
            <div className="absolute top-12 left-0 right-0 z-[100] px-6 flex justify-between items-center pointer-events-none">
                <button
                    onClick={() => router.back()}
                    className="p-3 bg-black/40 backdrop-blur-md rounded-2xl text-white pointer-events-auto active:scale-90 transition-all border border-white/10"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="bg-black/40 backdrop-blur-md border border-white/10 px-5 py-2 rounded-2xl flex items-center gap-6 shadow-2xl">
                    <div className="text-center">
                        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Round</p>
                        <p className="text-sm font-bold text-white">{currentRound + 1}/{memories.length}</p>
                    </div>
                    <div className="w-[1px] h-6 bg-white/10" />
                    <div className="text-center">
                        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Total Score</p>
                        <p className="text-sm font-bold text-memoryes-primary">{score}</p>
                    </div>
                </div>
            </div>

            {/* 1. CLUE: PHOTO (Top 45%) */}
            <div className="h-[45vh] w-full relative">
                <img
                    src={currentMem.media[0].url}
                    className="w-full h-full object-cover"
                    alt="Clue"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-6 left-6 pr-20">
                    <h2 className="text-white font-serif italic text-3xl drop-shadow-lg">{currentMem.title}</h2>
                    <p className="text-white/40 text-[9px] font-bold uppercase tracking-[2px] mt-1">
                        Captured {new Date(currentMem.capturedAt).toLocaleDateString()}
                    </p>
                </div>
            </div>

            {/* 2. GUESS: MAP (Bottom 55%) */}
            <div className="flex-1 relative bg-slate-900 rounded-t-[3rem] shadow-[0_-20px_60px_rgba(0,0,0,0.4)] overflow-hidden z-10 -mt-8">
                <GeoguessrMap
                    onGuess={(coords: [number, number]) => setUserGuess(coords)}
                    currentGuess={userGuess}
                    actualLocation={gameState === 'result' ? currentMem.location.coordinates : null}
                    showResult={gameState === 'result'}
                />

                {/* Floating Guess Button */}
                {gameState === 'playing' && (
                    <div className="absolute bottom-10 left-0 right-0 z-[1000] px-8">
                        <button
                            disabled={!userGuess}
                            onClick={handleConfirmGuess}
                            className="w-full py-5 bg-memoryes-clay text-white rounded-[2rem] font-black uppercase text-xs tracking-[3px] shadow-2xl disabled:opacity-30 active:scale-95 transition-all border border-white/10"
                        >
                            <Target size={18} className="inline mr-2" />
                            Lock in Guess
                        </button>
                    </div>
                )}
            </div>

            {/* 3. ROUND RESULT DRAWER */}
            <AnimatePresence>
                {gameState === 'result' && (
                    <motion.div
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                        className="absolute inset-x-0 bottom-0 z-[110] bg-white rounded-t-[4rem] p-10 flex flex-col items-center text-center shadow-2xl"
                    >
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full mb-8" />
                        <div className="w-20 h-20 bg-memoryes-soft rounded-3xl flex items-center justify-center mb-6">
                            <Navigation className="text-memoryes-primary" size={32} />
                        </div>
                        <h3 className="text-2xl font-serif italic text-memoryes-clay">
                            {distance === 0 ? "Perfect Match!" : `You were ${distance}km away`}
                        </h3>
                        <div className="mt-2 bg-memoryes-mint/30 px-4 py-1 rounded-full border border-memoryes-mint">
                            <span className="text-xs font-bold text-emerald-700">+{roundPoints} Points</span>
                        </div>
                        <p className="text-slate-400 mt-4 text-sm font-medium">
                            Real spot: <span className="text-memoryes-primary">{currentMem.location.name || "The Vault"}</span>
                        </p>

                        <button
                            onClick={nextRound}
                            className="mt-10 w-full py-5 bg-memoryes-clay text-white rounded-[2rem] font-bold shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                        >
                            {currentRound < memories.length - 1 ? "Next Round" : "See Final Score"}
                            <ArrowRight size={20} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 4. FINAL SCORE OVERLAY */}
            <AnimatePresence>
                {gameState === 'gameover' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[200] bg-memoryes-clay flex items-center justify-center p-8"
                    >
                        <motion.div
                            initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                            className="bg-white rounded-[4rem] p-12 w-full max-w-sm text-center shadow-2xl border border-white/20"
                        >
                            <Trophy size={64} className="text-amber-500 mx-auto mb-6 drop-shadow-lg" />
                            <h2 className="text-4xl font-serif italic text-memoryes-clay leading-tight">Vault Legend</h2>
                            <p className="text-slate-400 mt-2 font-medium">Total Family Score</p>
                            <div className="mt-4 text-5xl font-black text-memoryes-primary">{score}</div>

                            <div className="mt-10 space-y-3">
                                <button onClick={() => window.location.reload()} className="w-full py-5 bg-memoryes-clay text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all">New Challenge</button>
                                <button onClick={() => router.push('/games')} className="w-full py-4 text-slate-300 font-bold uppercase text-[10px] tracking-widest">Back to Lounge</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}