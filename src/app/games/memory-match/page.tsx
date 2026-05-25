"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    RotateCcw,
    Trophy,
    Brain,
    Loader2,
    Heart,
    Grid2X2,
    Grid3X3,
    LayoutGrid,
    Sparkles,
    Play
} from "lucide-react";
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

interface GridConfig {
    rows: number;
    cols: number;
    label: string;
    icon: any;
}

const GRID_OPTIONS: GridConfig[] = [
    { rows: 3, cols: 2, label: "Beginner (3 Pairs)", icon: Grid2X2 },
    { rows: 4, cols: 3, label: "Explorer (6 Pairs)", icon: Grid3X3 },
    { rows: 4, cols: 4, label: "Master (8 Pairs)", icon: LayoutGrid },
    { rows: 6, cols: 3, label: "Vault Keeper (9 Pairs)", icon: Grid3X3 },
    { rows: 6, cols: 4, label: "Archivist (12 Pairs)", icon: LayoutGrid }
];

export default function MemoryMatchGame() {
    const router = useRouter();

    // Game State Management
    const [gameState, setGameState] = useState<'settings' | 'loading' | 'playing'>('settings');
    const [grid, setGrid] = useState<GridConfig>(GRID_OPTIONS[1]); // Default to 4x3

    // Board State
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [matches, setMatches] = useState(0);
    const [gameComplete, setGameComplete] = useState(false);

    // 1. Initialize Game with dynamic Grid Size
    const initGame = useCallback(async (selectedGrid: GridConfig) => {
        setGameState('loading');
        setGameComplete(false);
        setMoves(0);
        setMatches(0);
        setFlippedCards([]);

        const totalPairs = (selectedGrid.rows * selectedGrid.cols) / 2;

        try {
            const { data: user } = await apiClient.get('/api/auth/me/');
            const { data: memories } = await apiClient.get(`/api/memories/random?spaceId=${user.activeSpace}&limit=${totalPairs}`);

            // Flatten all media and get unique images
            console.log("Fetched Memories:", memories);
            const allImages = memories.flatMap((m: any) => m.url);
            const uniqueImages = Array.from(new Set(allImages)).slice(0, totalPairs);

            if (uniqueImages.length < totalPairs) {
                toast.error(`Your vault only has ${uniqueImages.length} unique photos. You need at least ${totalPairs} for this mode!`);
                setGameState('settings');
                return;
            }

            // Create and Shuffle Pairs
            const gameCards = [...uniqueImages, ...uniqueImages]
                .sort(() => Math.random() - 0.5)
                .map((url, index) => ({
                    id: url as string,
                    url: url as string,
                    isFlipped: false,
                    isMatched: false,
                    uniqueId: index
                }));

            setCards(gameCards);
            setGameState('playing');
        } catch (err) {
            console.error(err);
            toast.error("Failed to load vault assets");
            setGameState('settings');
        }
    }, [router]);

    // 2. Gameplay Logic
    const handleCardClick = (uniqueId: number) => {
        if (flippedCards.length === 2 || cards[uniqueId].isMatched || flippedCards.includes(uniqueId)) return;

        const newFlipped = [...flippedCards, uniqueId];
        setFlippedCards(newFlipped);

        if (newFlipped.length === 2) {
            setMoves(m => m + 1);
            const [first, second] = newFlipped;

            if (cards[first].id === cards[second].id) {
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
                setTimeout(() => setFlippedCards([]), 1000);
            }
        }
    };

    // 3. Victory Check
    useEffect(() => {
        const totalPairs = (grid.rows * grid.cols) / 2;
        if (matches === totalPairs && cards.length > 0) {
            setGameComplete(true);
        }
    }, [matches, cards.length, grid]);

    // --- RENDER: SETTINGS SCREEN ---
    if (gameState === 'settings') {
        return (
            <div className="min-h-screen bg-memoryes-background p-8 flex flex-col justify-center">
                <header className="mb-12 text-center">
                    <button onClick={() => router.back()} className="absolute top-12 left-6 p-3 bg-white rounded-2xl shadow-sm text-slate-400">
                        <ChevronLeft size={24} />
                    </button>
                    <div className="w-20 h-20 bg-memoryes-soft rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl">
                        <Brain size={40} className="text-memoryes-primary" />
                    </div>
                    <h1 className="text-4xl font-serif italic text-memoryes-clay">Memory Match</h1>
                    <p className="text-slate-400 text-sm mt-2">Test your recall of the vault's history.</p>
                </header>

                <div className="space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-[4px] text-slate-300 ml-4">Choose Difficulty</span>
                    {GRID_OPTIONS.map((opt) => (
                        <button
                            key={opt.label}
                            onClick={() => setGrid(opt)}
                            className={`w-full p-6 rounded-[2.5rem] flex items-center gap-6 border-2 transition-all ${grid.label === opt.label
                                ? 'bg-white border-memoryes-primary shadow-lg scale-[1.02]'
                                : 'bg-white/50 border-transparent opacity-60'
                                }`}
                        >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${grid.label === opt.label ? 'bg-memoryes-soft text-memoryes-primary' : 'bg-slate-100 text-slate-400'}`}>
                                <opt.icon size={28} />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-memoryes-clay text-lg">{opt.label}</h3>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{opt.rows}x{opt.cols} Grid</p>
                            </div>
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => initGame(grid)}
                    className="mt-12 w-full bg-memoryes-clay text-white py-5 rounded-[2rem] font-bold shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                    <Play size={20} fill="currentColor" />
                    Initialize Board
                </button>
            </div>
        );
    }

    // --- RENDER: LOADING SCREEN ---
    if (gameState === 'loading') {
        return (
            <div className="h-screen bg-memoryes-background flex flex-col items-center justify-center p-12 text-center">
                <div className="relative">
                    <Loader2 className="animate-spin text-memoryes-primary" size={60} />
                    <Sparkles className="absolute -top-2 -right-2 text-memoryes-accent animate-pulse" size={24} />
                </div>
                <h2 className="text-2xl font-serif italic text-memoryes-clay mt-8">Shuffling your history</h2>
                <p className="text-xs font-bold uppercase tracking-[3px] text-slate-400 mt-2">Preparing the cards...</p>
            </div>
        );
    }

    // --- RENDER: GAMEPLAY ---
    return (
        <div className="min-h-screen bg-memoryes-background p-6 flex flex-col">
            <header className="pt-12 flex justify-between items-center mb-8">
                <button onClick={() => setGameState('settings')} className="p-3 bg-white rounded-2xl shadow-sm text-slate-400">
                    <ChevronLeft size={24} />
                </button>
                <div className="flex flex-col items-center text-center">
                    <h1 className="text-xl font-serif italic text-memoryes-clay leading-none">The Vault Match</h1>
                    <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full shadow-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Moves:</span>
                            <span className="text-xs font-black text-memoryes-primary">{moves}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full shadow-sm">
                            <Heart size={10} className="text-rose-400 fill-rose-400" />
                            <span className="text-xs font-black text-memoryes-clay">{matches}/{(grid.rows * grid.cols) / 2}</span>
                        </div>
                    </div>
                </div>
                <button onClick={() => initGame(grid)} className="p-3 bg-white rounded-2xl shadow-sm text-memoryes-primary active:rotate-180 transition-transform duration-500">
                    <RotateCcw size={24} />
                </button>
            </header>

            {/* Dynamic Grid: grid-cols depends on settings */}
            <main
                className="flex-1 grid gap-3"
                style={{
                    gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${grid.rows}, minmax(0, 1fr))`
                }}
            >
                {cards.map((card) => (
                    <div
                        key={card.uniqueId}
                        className="relative perspective-1000"
                        onClick={() => handleCardClick(card.uniqueId)}
                    >
                        <motion.div
                            animate={{ rotateY: (flippedCards.includes(card.uniqueId) || card.isMatched) ? 180 : 0 }}
                            transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                            className="w-full h-full relative preserve-3d cursor-pointer"
                        >
                            {/* FRONT (Photo) */}
                            <div
                                className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden border-4 border-white shadow-lg"
                                style={{ transform: "rotateY(180deg)" }}
                            >
                                <img src={card.url} className="w-full h-full object-cover" alt="" />
                                {card.isMatched && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center backdrop-blur-[1px]"
                                    >
                                        <div className="bg-white rounded-full p-1.5 shadow-xl">
                                            <CheckCircle2 size={20} className="text-emerald-500" />
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* BACK (Logo) */}
                            <div className="absolute inset-0 backface-hidden bg-memoryes-clay rounded-2xl shadow-lg flex items-center justify-center border-4 border-white">
                                <Sparkles className="text-white/20" size={32} />
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
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white p-10 rounded-[4rem] shadow-2xl space-y-6 max-w-sm">
                            <div className="w-24 h-24 bg-memoryes-mint rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl">
                                <Trophy className="text-emerald-600" size={48} />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-4xl font-serif italic text-memoryes-clay leading-tight">Masterful.</h2>
                                <p className="text-slate-400 text-sm">You recalled all {matches} memories in only {moves} attempts.</p>
                            </div>
                            <div className="pt-4 space-y-3">
                                <button
                                    onClick={() => initGame(grid)}
                                    className="w-full bg-memoryes-primary text-white py-5 rounded-[2rem] font-bold shadow-xl active:scale-95 transition-all"
                                >
                                    Play Again
                                </button>
                                <button
                                    onClick={() => setGameState('settings')}
                                    className="w-full text-slate-400 font-black text-[10px] uppercase tracking-[4px]"
                                >
                                    Change Difficulty
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function CheckCircle2({ size, className }: { size: number, className: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}