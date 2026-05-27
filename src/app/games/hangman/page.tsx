"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Send, Trophy, Skull, Loader2, Type, Sparkles } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";
import { HangmanSketch } from "@/components/HangmanSketch";
import Pusher from "pusher-js";

function HangmanContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const gameId = searchParams.get('id');

    const [user, setUser] = useState<any>(null);
    const [game, setGame] = useState<any>(null);
    const [setupWord, setSetupWord] = useState("");
    const [setupCategory, setSetupCategory] = useState("");
    const [loading, setLoading] = useState(true);

    const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    // 1. Initial Load & Pusher Sync
    useEffect(() => {
        const init = async () => {
            try {
                const { data: userData } = await apiClient.get('/api/auth/me/');
                setUser(userData);

                if (gameId) {
                    const { data: gameData } = await apiClient.get(`/api/games/hangman/single/?id=${gameId}`);
                    setGame(gameData);

                    // Setup Real-time Sync
                    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
                        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
                    });
                    const channel = pusher.subscribe(userData.activeSpace);
                    channel.bind('game-update', (updatedGame: any) => {
                        if (updatedGame._id === gameId) setGame(updatedGame);
                    });

                    return () => {
                        pusher.unsubscribe(userData.activeSpace);
                    };
                }
            } catch (e) {
                console.error("Initialization failed");
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [gameId]);

    const createGame = async () => {
        if (!setupWord.trim()) return;
        setLoading(true);
        try {
            const { data } = await apiClient.post('/api/games/hangman/', {
                spaceId: user.activeSpace,
                creatorId: user._id,
                creatorName: user.name,
                word: setupWord.toUpperCase().trim(),
                category: setupCategory || "A Family Secret"
            });
            router.push(`/games/hangman?id=${data._id}`);
        } catch (e) {
            toast.error("Failed to start game");
        } finally {
            setLoading(false);
        }
    };

    const makeGuess = async (letter: string) => {
        if (!game || game.status !== 'playing' && game.status !== 'waiting') return;
        try {
            const { data } = await apiClient.patch('/api/games/hangman/', {
                gameId: game._id,
                letter
            });
            setGame(data);
        } catch (e) {
            toast.error("Guess failed");
        }
    };

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center bg-memoryes-background">
            <Loader2 className="animate-spin text-memoryes-primary mb-4" size={32} />
            <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Opening Secret Vault...</p>
        </div>
    );

    // --- VIEW 1: CREATION (If no ID in URL) ---
    if (!gameId) {
        return (
            <div className="min-h-screen bg-memoryes-background p-8 flex flex-col justify-center">
                <header className="absolute top-12 left-6">
                    <button onClick={() => router.back()} className="p-3 bg-white rounded-2xl shadow-sm active:scale-90 transition-transform"><ChevronLeft /></button>
                </header>
                <div className="text-center mb-10 space-y-2">
                    <div className="w-20 h-20 bg-memoryes-soft rounded-[2.5rem] flex items-center justify-center mx-auto shadow-lg mb-4">
                        <Type size={40} className="text-memoryes-primary" />
                    </div>
                    <h1 className="text-3xl font-serif italic text-memoryes-clay">The Secret Echo</h1>
                    <p className="text-slate-400 text-sm">Challenge family to find the hidden phrase.</p>
                </div>

                <div className="space-y-4 max-w-sm mx-auto w-full">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-300 ml-4">Secret Word/Phrase</label>
                        <input
                            placeholder="Type here..."
                            className="w-full p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm text-center font-serif text-xl outline-none focus:border-memoryes-primary transition-all text-memoryes-clay"
                            value={setupWord}
                            onChange={e => setSetupWord(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-300 ml-4">Hint/Category</label>
                        <input
                            placeholder="e.g. Summer Trip 2023"
                            className="w-full p-4 bg-white/50 rounded-2xl border border-transparent text-center text-[10px] font-bold uppercase tracking-widest outline-none focus:bg-white transition-all"
                            value={setupCategory}
                            onChange={e => setSetupCategory(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={createGame}
                        disabled={!setupWord}
                        className="w-full py-5 bg-memoryes-clay text-white rounded-[2.2rem] font-bold shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-30 mt-4"
                    >
                        <Sparkles size={20} /> Encrypt & Send
                    </button>
                </div>
            </div>
        );
    }

    // --- VIEW 2: GAMEPLAY (Safe check for game data) ---
    if (!game) return null;

    const isCreator = user?._id === game.creatorId;

    return (
        <div className="min-h-screen bg-memoryes-background p-6 flex flex-col items-center">
            <header className="pt-12 w-full flex justify-between items-center mb-6">
                <button onClick={() => router.push('/games')} className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 active:scale-90 transition-transform"><ChevronLeft /></button>
                <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-slate-300 tracking-[3px]">{game.category}</p>
                    <p className="text-[9px] font-bold text-memoryes-primary uppercase tracking-widest">Host: {game.creatorName}</p>
                </div>
                <div className="w-12" />
            </header>

            <div className="flex-1 flex flex-col items-center justify-center w-full">
                <HangmanSketch mistakes={game.wrongGuesses} />

                {/* Word Display */}
                <div className="flex flex-wrap justify-center gap-2 my-12">
                    {game.word.split('').map((letter: string, i: number) => (
                        <div key={i} className={`w-8 h-10 border-b-4 flex items-center justify-center text-xl font-black transition-all ${letter === ' ' ? 'border-transparent mx-2' : 'border-memoryes-soft'}`}>
                            <span className={game.guessedLetters.includes(letter) || isCreator ? "opacity-100" : "opacity-0"}>
                                {letter}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Guesser Controls */}
                {(!isCreator && (game.status === 'playing' || game.status === 'waiting')) ? (
                    <div className="grid grid-cols-6 gap-2 max-w-sm px-4">
                        {ALPHABET.map(l => {
                            const isGuessed = game.guessedLetters.includes(l);
                            return (
                                <button
                                    key={l}
                                    disabled={isGuessed}
                                    onClick={() => makeGuess(l)}
                                    className={`w-10 h-10 rounded-xl font-bold transition-all active:scale-90 ${isGuessed ? 'bg-slate-50 text-slate-200' : 'bg-white shadow-sm text-memoryes-clay'}`}
                                >
                                    {l}
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-8 bg-white/40 backdrop-blur-sm rounded-[2.5rem] text-center border border-white/20">
                        <p className="text-sm font-serif italic text-slate-400">
                            {isCreator ? "Your family is currently guessing..." : "This echo has concluded."}
                        </p>
                    </div>
                )}
            </div>

            {/* Result Overlays */}
            <AnimatePresence>
                {(game.status === 'won' || game.status === 'lost') && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[200] bg-memoryes-clay/90 backdrop-blur-md flex items-center justify-center p-8">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white p-10 rounded-[4rem] shadow-2xl text-center space-y-8 w-full max-w-xs">
                            <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl ${game.status === 'won' ? 'bg-memoryes-mint text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                                {game.status === 'won' ? <Trophy size={48} /> : <Skull size={48} />}
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-serif italic text-memoryes-clay">
                                    {game.status === 'won' ? "Echo Found!" : "Echo Faded"}
                                </h2>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
                                    The secret was: <span className="block text-sm text-memoryes-primary mt-1 font-black">{game.word}</span>
                                </p>
                            </div>
                            <button onClick={() => router.push('/games')} className="w-full py-5 bg-memoryes-clay text-white rounded-[2rem] font-bold shadow-xl active:scale-95 transition-all">Back to Lounge</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function HangmanGame() {
    return (
        <Suspense fallback={null}>
            <HangmanContent />
        </Suspense>
    );
}