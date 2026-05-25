"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, RotateCcw, Timer, Trophy, Brain, Loader2, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";

interface Card {
    id: string;
    url: string;
    isFlipped: boolean;
    isMatched: boolean;
    uniqueId: number;
}

export default function MemoryMatchGame() {
    const router = useRouter();
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [matches, setMatches] = useState(0);
    const [loading, setLoading] = useState(true);
    const [gameComplete, setGameComplete] = useState(false);

    // 1. Fetch real photos from the vault
    const initGame = useCallback(async () => {
        setLoading(true);
        setGameComplete(false);
        setMoves(0);
        setMatches(0);
        setFlippedCards([]);

        try {
            const { data: user } = await apiClient.get('/api/auth/me/');
            const { data: memories } = await apiClient.get(`/api/memories/?spaceId=${user.activeSpace}`);

            // Extract unique images from memories
            const imageUrls = memories
                .flatMap((m: any) => m.media.map((img: any) => img.url))
                .slice(0, 6); // We need 6 unique images for a 12-card grid

            if (imageUrls.length < 6) {
                toast.error("Add at least 6 photos to your vault to play!");
                router.back();
                return;
            }

            // Create pairs
            const gameCards = [...imageUrls, ...imageUrls]
                .sort(() => Math.random() - 0.5)
                .map((url, index) => ({
                    id: url,
                    url,
                    isFlipped: false,
                    isMatched: false,
                    uniqueId: index
                }));

            setCards(gameCards);
        } catch (err) {
            toast.error("Failed to load game assets");
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        initGame();
    }, [initGame]);

    // 2. Handle Card Click
    const handleCardClick = (uniqueId: number) => {
        if (flippedCards.length === 2 || cards[uniqueId].isMatched || flippedCards.includes(uniqueId)) return;

        const newFlipped = [...flippedCards, uniqueId];
        setFlippedCards(newFlipped);

        if (newFlipped.length === 2) {
            setMoves(m => m + 1);
            const [first, second] = newFlipped;

            if (cards[first].id === cards[second].id) {
                // Match found
                setTimeout(() => {
                    setCards(prev => prev.map(card =>
                        (card.uniqueId === first || card.uniqueId === second)
                            ? { ...card, isMatched: true }
                            : card
                    ));
                    setMatches(m => m + 1);
                    setFlippedCards([]);
                }, 600);
            } else {
                // No match
                setTimeout(() => setFlippedCards([]), 1000);
            }
        }
    };

    // 3. Check for Win
    useEffect(() => {
        if (matches === 6 && cards.length > 0) {
            setGameComplete(true);
        }
    }, [matches, cards.length]);

    if (loading) return (
        <div className="h-screen bg-memoryes-background flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-memoryes-primary mb-4" size={40} />
            <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Shuffling Memories...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FDFCFB] p-6 flex flex-col">
            {/* Header */}
            <header className="pt-12 flex justify-between items-center mb-8">
                <button onClick={() => router.back()} className="p-3 bg-white rounded-2xl shadow-sm text-slate-400">
                    <ChevronLeft size={24} />
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="text-xl font-serif italic text-memoryes-clay">Memory Match</h1>
                    <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5 bg-memoryes-soft/50 px-3 py-1 rounded-full">
                            <Brain size={12} className="text-memoryes-primary" />
                            <span className="text-[10px] font-bold text-memoryes-primary">{moves} Moves</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-memoryes-mint/50 px-3 py-1 rounded-full">
                            <Heart size={12} className="text-emerald-600" />
                            <span className="text-[10px] font-bold text-emerald-600">{matches}/6 Pairs</span>
                        </div>
                    </div>
                </div>
                <button onClick={initGame} className="p-3 bg-white rounded-2xl shadow-sm text-memoryes-primary">
                    <RotateCcw size={24} />
                </button>
            </header>

            {/* Game Board */}
            <main className="flex-1 grid grid-cols-3 gap-3">
                {cards.map((card) => (
                    <div
                        key={card.uniqueId}
                        className="aspect-[3/4] relative perspective-1000"
                        onClick={() => handleCardClick(card.uniqueId)}
                    >
                        <motion.div
                            animate={{ rotateY: (flippedCards.includes(card.uniqueId) || card.isMatched) ? 180 : 0 }}
                            transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                            className="w-full h-full relative preserve-3d cursor-pointer"
                        >
                            {/* Card Front (The Memory) */}
                            <div
                                className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden border-4 border-white shadow-md"
                                style={{ transform: "rotateY(180deg)" }}
                            >
                                <img src={card.url} className="w-full h-full object-cover" alt="memory" />
                                {card.isMatched && (
                                    <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                                        <div className="bg-white rounded-full p-1 shadow-lg">
                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Card Back (memoryes Pattern) */}
                            <div className="absolute inset-0 backface-hidden bg-memoryes-clay rounded-2xl shadow-md flex items-center justify-center border-4 border-white">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                    <Heart className="text-white/20 fill-white/10" size={20} />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                ))}
            </main>

            {/* Victory Overlay */}
            <AnimatePresence>
                {gameComplete && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[200] bg-memoryes-clay/90 backdrop-blur-md flex items-center justify-center p-8 text-center"
                    >
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white p-10 rounded-[3.5rem] shadow-2xl space-y-6 max-w-sm">
                            <div className="w-20 h-20 bg-memoryes-mint rounded-[2rem] flex items-center justify-center mx-auto shadow-lg">
                                <Trophy className="text-emerald-600" size={40} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-serif italic text-memoryes-clay">Brilliant!</h2>
                                <p className="text-slate-400 text-sm mt-2">You matched all memories in <span className="font-bold text-memoryes-primary">{moves} moves</span>.</p>
                            </div>
                            <button
                                onClick={initGame}
                                className="w-full bg-memoryes-clay text-white py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-all"
                            >
                                Play Again
                            </button>
                            <button
                                onClick={() => router.push('/games')}
                                className="w-full text-slate-400 font-bold text-xs uppercase tracking-widest"
                            >
                                Back to Lounge
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Sub-component helper for CheckCircle (optional, or import from Lucide)
function CheckCircle2({ size, className }: { size: number, className: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}