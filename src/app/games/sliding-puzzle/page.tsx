"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    RotateCcw,
    Trophy,
    Loader2,
    ImageIcon,
    Play,
    Grid3X3,
    LayoutGrid,
    Move,
    CheckCircle2,
    Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";

interface Tile {
    id: number;
    currentPos: number;
    correctPos: number;
}

const GRID_OPTIONS = [
    { size: 3, label: "Relaxed", desc: "3x3 Grid", icon: Grid3X3 },
    { size: 4, label: "Classic", desc: "4x4 Grid", icon: LayoutGrid },
];

export default function SlidingPuzzleGame() {
    const router = useRouter();

    // UI Logic
    const [gameState, setGameState] = useState<'settings' | 'loading' | 'playing' | 'won'>('settings');
    const [vaultImages, setVaultImages] = useState<string[]>([]);
    const [selectedImage, setSelectedImage] = useState<string>("");
    const [gridSize, setGridSize] = useState(3);

    // Game State
    const [tiles, setTiles] = useState<Tile[]>([]);
    const [moves, setMoves] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // 1. Fetch real vault data
    useEffect(() => {
        const loadVault = async () => {
            try {
                const { data: user } = await apiClient.get('/api/auth/me/');
                const { data: memories } = await apiClient.get(`/api/memories/?spaceId=${user.activeSpace}`);

                const urls = memories
                    .flatMap((m: any) => m.media.map((i: any) => i.url))
                    .filter((url: string) => !url.includes('.mp4')); // Only images

                const uniqueUrls = Array.from(new Set(urls)) as string[];
                setVaultImages(uniqueUrls);
                if (uniqueUrls.length > 0) setSelectedImage(uniqueUrls[0]);
            } catch (err) {
                toast.error("Connect to the vault failed");
            }
        };
        loadVault();
    }, []);

    // 2. Solvable Shuffle Logic (Random Walk)
    const initGame = useCallback(() => {
        setGameState('loading');
        setMoves(0);

        let newTiles: number[] = Array.from({ length: gridSize * gridSize }, (_, i) => i);
        let emptyIdx = gridSize * gridSize - 1;

        // Perform 200 valid moves to ensure solvability
        for (let i = 0; i < 200; i++) {
            const neighbors = [];
            if (emptyIdx % gridSize > 0) neighbors.push(emptyIdx - 1);
            if (emptyIdx % gridSize < gridSize - 1) neighbors.push(emptyIdx + 1);
            if (emptyIdx >= gridSize) neighbors.push(emptyIdx - gridSize);
            if (emptyIdx < gridSize * (gridSize - 1)) neighbors.push(emptyIdx + gridSize);

            const move = neighbors[Math.floor(Math.random() * neighbors.length)];
            [newTiles[emptyIdx], newTiles[move]] = [newTiles[move], newTiles[emptyIdx]];
            emptyIdx = move;
        }

        const tileObjects = newTiles.map((val, idx) => ({
            id: val,
            currentPos: idx,
            correctPos: val
        }));

        setTiles(tileObjects);
        setTimeout(() => setGameState('playing'), 1000);
    }, [gridSize]);

    // 3. Tile Movement
    const handleTileClick = (index: number) => {
        if (gameState !== 'playing') return;

        const emptyTileIdx = tiles.findIndex(t => t.id === gridSize * gridSize - 1);

        const isNeighbor = (
            (Math.abs(index - emptyTileIdx) === 1 && Math.floor(index / gridSize) === Math.floor(emptyTileIdx / gridSize)) ||
            Math.abs(index - emptyTileIdx) === gridSize
        );

        if (isNeighbor) {
            const newTiles = [...tiles];
            [newTiles[index], newTiles[emptyTileIdx]] = [newTiles[emptyTileIdx], newTiles[index]];
            setTiles(newTiles);
            setMoves(m => m + 1);

            // Win condition check
            const isWon = newTiles.every((t, i) => t.id === i);
            if (isWon) {
                setGameState('won');
                toast.success("Memory Restored!");
            }
        }
    };

    // --- VIEW: SETTINGS ---
    if (gameState === 'settings') {
        return (
            <div className="min-h-screen bg-memoryes-background p-6 pt-16 flex flex-col">
                <header className="flex items-center justify-between mb-10">
                    <button onClick={() => router.back()} className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 active:scale-90 transition-transform">
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-serif italic text-memoryes-clay">Puzzle Settings</h1>
                    <div className="w-12" />
                </header>

                <div className="flex-1 space-y-10 overflow-y-auto no-scrollbar">
                    {/* Image Strip */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-[10px] font-black uppercase tracking-[3px] text-slate-300">1. Choose a Memory</span>
                            <Sparkles size={14} className="text-memoryes-accent" />
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar px-2">
                            {vaultImages.map((url, i) => (
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    key={i}
                                    onClick={() => setSelectedImage(url)}
                                    className={`relative min-w-[140px] h-40 rounded-[2rem] overflow-hidden border-4 transition-all ${selectedImage === url ? 'border-memoryes-primary shadow-xl scale-105 z-10' : 'border-white opacity-40'
                                        }`}
                                >
                                    <img src={url} className="w-full h-full object-cover" alt="vault" />
                                    {selectedImage === url && (
                                        <div className="absolute top-2 right-2 bg-memoryes-primary text-white p-1 rounded-full shadow-lg">
                                            <CheckCircle2 size={14} />
                                        </div>
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Difficulty Grid */}
                    <div className="space-y-4 px-2">
                        <span className="text-[10px] font-black uppercase tracking-[3px] text-slate-300 ml-2">2. Level of detail</span>
                        <div className="grid grid-cols-2 gap-4">
                            {GRID_OPTIONS.map((opt) => (
                                <button
                                    key={opt.size}
                                    onClick={() => setGridSize(opt.size)}
                                    className={`p-6 rounded-[2.5rem] border-2 transition-all flex flex-col items-center text-center gap-3 ${gridSize === opt.size
                                            ? 'bg-white border-memoryes-primary shadow-lg'
                                            : 'bg-white/40 border-transparent opacity-60'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${gridSize === opt.size ? 'bg-memoryes-soft text-memoryes-primary' : 'bg-slate-100 text-slate-400'}`}>
                                        <opt.icon size={24} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-memoryes-clay text-sm">{opt.label}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{opt.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    onClick={initGame}
                    className="mt-8 w-full py-5 bg-memoryes-clay text-white rounded-[2rem] font-bold shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-memoryes-clay/20"
                >
                    <Play size={20} fill="currentColor" />
                    <span className="uppercase text-xs tracking-widest font-black">Initialize Board</span>
                </button>
            </div>
        );
    }

    // --- VIEW: LOADING ---
    if (gameState === 'loading') {
        return (
            <div className="h-screen bg-memoryes-background flex flex-col items-center justify-center text-center p-12">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20 border-4 border-memoryes-primary border-t-transparent rounded-full mb-8"
                />
                <h2 className="text-2xl font-serif italic text-memoryes-clay leading-tight">Fragmenting the Memory</h2>
                <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-300 mt-4">Shuffling vault assets...</p>
            </div>
        );
    }

    // --- VIEW: PLAYING ---
    return (
        <div className="min-h-screen bg-memoryes-background p-6 flex flex-col items-center">
            <header className="pt-12 w-full flex justify-between items-center mb-12">
                <button onClick={() => setGameState('settings')} className="p-3 bg-white rounded-2xl shadow-sm text-slate-400"><ChevronLeft /></button>
                <div className="bg-white/80 backdrop-blur-md px-6 py-2 rounded-full shadow-sm border border-slate-100 flex items-center gap-3">
                    <Move size={14} className="text-memoryes-primary" />
                    <span className="text-xs font-black uppercase tracking-widest text-memoryes-clay">{moves} Moves</span>
                </div>
                <button onClick={initGame} className="p-3 bg-white rounded-2xl shadow-sm text-memoryes-primary active:rotate-180 transition-transform duration-500"><RotateCcw /></button>
            </header>

            {/* BOARD CONTAINER */}
            <div className="relative w-full aspect-square bg-slate-100 rounded-[3rem] p-4 shadow-2xl border-[12px] border-white overflow-hidden">
                <div
                    className="w-full h-full"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                        gridTemplateRows: `repeat(${gridSize}, 1fr)`,
                        gap: '6px'
                    }}
                >
                    {tiles.map((tile, index) => {
                        const isEmpty = tile.id === gridSize * gridSize - 1;
                        const correctRow = Math.floor(tile.id / gridSize);
                        const correctCol = tile.id % gridSize;

                        return (
                            <motion.div
                                key={tile.id}
                                layout
                                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                onClick={() => handleTileClick(index)}
                                className={`relative rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform ${isEmpty ? 'bg-slate-200 shadow-inner opacity-40' : 'shadow-md border border-white/20'
                                    }`}
                            >
                                {!isEmpty && (
                                    <div
                                        className="absolute inset-0 w-full h-full pointer-events-none"
                                        style={{
                                            backgroundImage: `url(${selectedImage})`,
                                            backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
                                            // Precise position calculation to prevent sub-pixel gaps
                                            backgroundPosition: `${(correctCol / (gridSize - 1)) * 100}% ${(correctRow / (gridSize - 1)) * 100}%`
                                        }}
                                    />
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-12 text-center space-y-2 opacity-30">
                <p className="text-[10px] font-black text-memoryes-clay uppercase tracking-[4px]">Vault Restoration in Progress</p>
                <div className="w-12 h-1 bg-memoryes-primary mx-auto rounded-full" />
            </div>

            {/* WIN MODAL */}
            <AnimatePresence>
                {gameState === 'won' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-memoryes-clay/90 backdrop-blur-xl flex items-center justify-center p-8"
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 40 }} animate={{ scale: 1, y: 0 }}
                            className="bg-white p-10 rounded-[4rem] shadow-2xl text-center space-y-8 w-full max-w-sm border border-white/20"
                        >
                            <div className="w-24 h-24 bg-memoryes-mint rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl border-4 border-white">
                                <Trophy className="text-emerald-600" size={48} />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-serif italic text-memoryes-clay leading-tight">Memory Restored</h2>
                                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                    You reassembled the history in <span className="text-memoryes-primary font-bold">{moves} moves</span>.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={initGame}
                                    className="w-full py-5 bg-memoryes-clay text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all"
                                >
                                    Try Again
                                </button>
                                <button
                                    onClick={() => setGameState('settings')}
                                    className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-memoryes-clay"
                                >
                                    Select New Image
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}