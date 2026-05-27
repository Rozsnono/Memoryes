"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft, Trophy, Loader2, Sparkles,
    Eye, CheckCircle2, XCircle, ArrowRight,
    Zap, EyeOff
} from "lucide-react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";

interface Round {
    targetImageUrl: string;
    options: string[];
}

export default function FragmentRecall() {
    const router = useRouter();

    // Game Flow State
    const [gameState, setGameState] = useState<'loading' | 'playing' | 'result' | 'complete'>('loading');
    const [rounds, setRounds] = useState<Round[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);

    // Round-Specific State
    const [blurLevel, setBlurLevel] = useState(40); // Starts at 40px
    const [potentialPoints, setPotentialPoints] = useState(2000);
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    const initGame = useCallback(async () => {
        setGameState('loading');
        try {
            const { data: user } = await apiClient.get('/api/auth/me/');
            const { data: mems } = await apiClient.get(`/api/memories/?spaceId=${user.activeSpace}`);

            const allImages = mems.flatMap((m: any) => m.media.map((img: any) => img.url));
            const uniqueImages = Array.from(new Set(allImages)) as string[];

            if (uniqueImages.length < 4) {
                toast.error("You need at least 4 photos to play!");
                router.back();
                return;
            }

            const generatedRounds: Round[] = [];
            for (let i = 0; i < 5; i++) {
                const shuffled = [...uniqueImages].sort(() => 0.5 - Math.random());
                const target = shuffled[0];
                const options = shuffled.slice(0, 4).sort(() => 0.5 - Math.random());
                generatedRounds.push({ targetImageUrl: target, options });
            }

            setRounds(generatedRounds);
            setScore(0);
            setCurrentIndex(0);
            resetRoundState();
            setGameState('playing');
        } catch (err) {
            toast.error("Vault link failed");
        }
    }, [router]);

    const resetRoundState = () => {
        setBlurLevel(40);
        setPotentialPoints(2000);
        setSelectedIdx(null);
        setIsCorrect(null);
    };

    useEffect(() => { initGame(); }, [initGame]);

    // --- GAME ACTIONS ---

    const handleReveal = () => {
        if (blurLevel <= 0 || gameState !== 'playing') return;

        setBlurLevel(prev => Math.max(0, prev - 10));
        setPotentialPoints(prev => {
            if (prev > 500) return prev - 500;
            return 100; // Minimum points for full reveal
        });
        toast.info("Memory sharpened, points reduced!");
    };

    const handleSelect = (url: string, index: number) => {
        if (selectedIdx !== null) return;

        setSelectedIdx(index);
        const correct = url === rounds[currentIndex].targetImageUrl;
        setIsCorrect(correct);

        if (correct) {
            setScore(s => s + potentialPoints);
            toast.success(`Correct! +${potentialPoints} pts`);
        } else {
            toast.error("Incorrect choice");
        }

        setBlurLevel(0); // Show image on result
        setGameState('result');
    };

    const nextRound = () => {
        if (currentIndex < rounds.length - 1) {
            setCurrentIndex(c => c + 1);
            resetRoundState();
            setGameState('playing');
        } else {
            setGameState('complete');
        }
    };

    if (gameState === 'loading') return (
        <div className="h-screen bg-memoryes-background flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-memoryes-primary" size={40} />
            <p className="text-[10px] font-black uppercase tracking-[4px] mt-4 text-slate-400">Loading Fragments...</p>
        </div>
    );

    const currentRound = rounds[currentIndex];

    return (
        <div className="min-h-screen bg-memoryes-background text-memoryes-clay flex flex-col">

            {/* Header HUD */}
            <header className="p-6 pt-12 flex justify-between items-center z-50">
                <button onClick={() => router.back()} className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 active:scale-90 transition-transform">
                    <ChevronLeft size={24} />
                </button>
                <div className="flex gap-2">
                    <div className="bg-white px-4 py-2 rounded-2xl shadow-sm flex flex-col items-center min-w-[70px]">
                        <span className="text-[8px] font-black text-slate-300 uppercase">Points</span>
                        <span className="text-sm font-bold text-memoryes-primary">{score}</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 px-6 pb-12 flex flex-col">
                <AnimatePresence mode="wait">

                    {(gameState === 'playing' || gameState === 'result') && (
                        <motion.div
                            key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col space-y-6"
                        >
                            {/* THE MYSTERY IMAGE */}
                            <div className="relative">
                                <div className="aspect-square w-full rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl relative bg-slate-200">
                                    <motion.img
                                        src={currentRound.targetImageUrl}
                                        className="w-full h-full object-cover"
                                        animate={{ filter: `blur(${blurLevel}px)` }}
                                        transition={{ duration: 0.5 }}
                                    />

                                    {/* Potential Points Badge */}
                                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 flex items-center gap-2">
                                        <Zap size={12} className="text-yellow-400 fill-yellow-400" />
                                        <span className="text-[10px] font-black text-white">{potentialPoints}</span>
                                    </div>
                                </div>

                                {/* REVEAL CONTROL */}
                                {gameState === 'playing' && blurLevel > 0 && (
                                    <button
                                        onClick={handleReveal}
                                        className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-memoryes-soft active:scale-95 transition-all"
                                    >
                                        <Eye size={16} className="text-memoryes-primary" />
                                        <span className="text-xs font-bold text-memoryes-clay uppercase tracking-widest">Reveal Details (-500)</span>
                                    </button>
                                )}
                            </div>

                            {/* CHOICES GRID */}
                            <div className="flex-1 flex flex-col justify-center pt-4">
                                <div className="grid grid-cols-2 gap-3">
                                    {currentRound.options.map((url, idx) => (
                                        <motion.button
                                            key={idx}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleSelect(url, idx)}
                                            disabled={gameState === 'result'}
                                            className={`relative aspect-square rounded-[2rem] overflow-hidden border-4 transition-all shadow-md ${selectedIdx === idx
                                                    ? isCorrect ? 'border-emerald-500' : 'border-rose-500'
                                                    : (gameState === 'result' && url === currentRound.targetImageUrl)
                                                        ? 'border-emerald-500 animate-pulse'
                                                        : 'border-white'
                                                }`}
                                        >
                                            <img src={url} className="w-full h-full object-cover" alt="" />
                                            {selectedIdx === idx && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                    {isCorrect ? <CheckCircle2 className="text-white" size={40} /> : <XCircle className="text-white" size={40} />}
                                                </div>
                                            )}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* NEXT ACTION */}
                            {gameState === 'result' && (
                                <button
                                    onClick={nextRound}
                                    className="w-full py-5 bg-memoryes-clay text-white rounded-[2rem] font-bold shadow-xl flex items-center justify-center gap-3"
                                >
                                    {currentIndex < rounds.length - 1 ? "Next Round" : "Final Results"}
                                    <ArrowRight size={20} />
                                </button>
                            )}
                        </motion.div>
                    )}

                    {/* COMPLETION VIEW */}
                    {gameState === 'complete' && (
                        <motion.div
                            key="complete" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            className="flex-1 flex flex-col justify-center items-center text-center space-y-8"
                        >
                            <div className="w-24 h-24 bg-memoryes-mint rounded-[2.5rem] flex items-center justify-center shadow-xl border-4 border-white">
                                <Trophy size={48} className="text-emerald-600" />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-4xl font-serif italic text-memoryes-clay">Sharp Eye</h1>
                                <p className="text-slate-400 text-sm">Your total score from the fragments:</p>
                                <div className="text-6xl font-black text-memoryes-primary pt-4">{score}</div>
                            </div>
                            <div className="w-full space-y-3 pt-6">
                                <button onClick={initGame} className="w-full py-5 bg-memoryes-clay text-white rounded-[2rem] font-bold shadow-xl">New Session</button>
                                <button onClick={() => router.push('/games')} className="w-full py-4 text-slate-300 font-bold uppercase text-[10px] tracking-widest">Back to Lounge</button>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>
        </div>
    );
}