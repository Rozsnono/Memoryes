'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import GameBoard from '../components/GameBoard'; // Note: Ensure GameBoard is also redesigned
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, Heart, ShieldAlert } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';

interface PuzzleType {
    phrase: string;
    category: string;
}

interface SavedStateType {
    revealedLetters: string[];
    players: { name: string; roundScore: number; totalScore: number }[];
    activePlayerIdx: number;
}

function GameContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const idParam = searchParams.get('id');
    const modeParam = searchParams.get('mode') || 'SINGLE';
    const playersParam = searchParams.get('players');
    const saveCodeParam = searchParams.get('saveCode');

    const [puzzle, setPuzzle] = useState<PuzzleType | null>(null);
    const [playersList, setPlayersList] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [gameMode, setGameMode] = useState<'SINGLE' | 'LOCAL_MULTI' | 'ONLINE_MULTI'>('SINGLE');
    const [loadedState, setLoadedState] = useState<SavedStateType | null>(null);

    useEffect(() => {
        const initializeGame = async () => {
            // 1. If loading from a Save Code (The "Vault Recovery" Flow)
            if (saveCodeParam) {
                try {
                    const { data } = await apiClient.get(`/api/lucky-wheel/save/${saveCodeParam}/`);
                    setPuzzle({
                        phrase: data.phrase,
                        category: data.category
                    });
                    setGameMode(data.gameMode);
                    setLoadedState({
                        revealedLetters: data.revealedLetters,
                        players: data.players,
                        activePlayerIdx: data.activePlayerIdx
                    });
                } catch (err) {
                    toast.error("Could not recover vault session");
                    router.push('/games');
                } finally {
                    setLoading(false);
                }
                return;
            }

            // 2. Standard Start Flow
            if (!idParam) {
                router.push('/games');
                return;
            }

            setGameMode(modeParam as 'SINGLE' | 'LOCAL_MULTI' | 'ONLINE_MULTI');

            if (playersParam) {
                try {
                    const decoded = decodeURIComponent(playersParam);
                    setPlayersList(decoded.split(','));
                } catch (e) {
                    setPlayersList(['Explorer 1']);
                }
            } else {
                setPlayersList(['Explorer 1']);
            }

            try {
                // Fetch puzzles from themes
                const { data } = await apiClient.get('/api/lucky-wheel/themes/');
                const selectedIds = idParam.split(',');
                const activeThemes = data.data.filter((t: any) => selectedIds.includes(t._id));

                if (activeThemes.length === 0) throw new Error('No valid themes');

                const puzzlePool: { phrase: string; category: string }[] = [];
                activeThemes.forEach((theme: any) => {
                    theme.puzzles.forEach((phrase: string) => {
                        puzzlePool.push({ phrase, category: theme.title });
                    });
                });

                if (puzzlePool.length > 0) {
                    // Selection logic
                    const hash = playersParam ? playersParam.length : 1;
                    const deterministicIndex = (hash * 31) % puzzlePool.length;
                    setPuzzle(puzzlePool[deterministicIndex]);
                } else {
                    throw new Error('Selected themes are empty');
                }
            } catch (err: any) {
                toast.error(err.message || "Initialization failed");
                router.push('/games');
            } finally {
                setLoading(false);
            }
        };

        initializeGame();
    }, [idParam, playersParam, saveCodeParam, modeParam, router]);

    // Premium Loading State
    if (loading || !puzzle) {
        return (
            <div className="h-screen w-full bg-memoryes-background flex flex-col items-center justify-center p-8">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center space-y-6"
                >
                    <div className="relative">
                        <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl">
                            <Heart size={40} className="text-memoryes-primary fill-memoryes-primary/10" />
                        </div>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            className="absolute -inset-4 border border-dashed border-memoryes-primary/20 rounded-[3rem]"
                        />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-serif italic text-memoryes-clay">Preparing Experience</h1>
                        <div className="flex items-center justify-center gap-2 text-slate-400">
                            <Loader2 size={14} className="animate-spin" />
                            <span className="text-[10px] font-black uppercase tracking-[3px]">Decrypting Vault</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-memoryes-background overflow-hidden relative">
            <GameBoard
                onBackToMenu={() => router.push('/games')}
                remotePuzzle={puzzle}
                gameMode={gameMode}
                initialPlayerNames={playersList}
                savedState={loadedState}
            />
        </div>
    );
}

// Wrapper with Suspense for Static Export Compatibility
export default function GamePage() {
    return (
        <Suspense fallback={<GameLoadingFallback />}>
            <GameContent />
        </Suspense>
    );
}

function GameLoadingFallback() {
    return (
        <div className="h-screen w-full bg-memoryes-background flex items-center justify-center">
            <Loader2 className="animate-spin text-memoryes-primary" size={32} />
        </div>
    );
}