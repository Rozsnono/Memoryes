"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Send, Trophy, Skull, Loader2, Type, Sparkles, History } from "lucide-react";
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

    const ALPHABET = "AÁBCDEÉFGHIÍJKLMNOÓÖŐPQRSTUÚÜŰVWXYZ".split("");

    useEffect(() => {
        const init = async () => {
            try {
                const { data: userData } = await apiClient.get('/api/auth/me/');
                setUser(userData);

                if (gameId) {
                    const { data: gameData } = await apiClient.get(`/api/games/hangman/single/?id=${gameId}`);
                    setGame(gameData);

                    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
                        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
                    });
                    const channel = pusher.subscribe(userData.activeSpace);
                    channel.bind('game-update', (updatedGame: any) => {
                        if (updatedGame._id === gameId) setGame(updatedGame);
                    });

                    return () => pusher.unsubscribe(userData.activeSpace);
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
            await apiClient.post('/api/games/hangman/', {
                spaceId: user.activeSpace,
                creatorId: user._id,
                creatorName: user.name,
                word: setupWord.toUpperCase().trim(),
                category: setupCategory || "A Family Secret"
            });
            toast.success("Echo released to the family!");
            router.push('/games');
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
            <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Opening Vault...</p>
        </div>
    );

    if (!gameId) {
        return (
            <div className="min-h-screen bg-memoryes-background p-8 flex flex-col justify-center">
                <header className="absolute top-12 left-6">
                    <button onClick={() => router.back()} className="p-3 bg-white rounded-2xl shadow-sm"><ChevronLeft /></button>
                </header>
                <div className="text-center mb-10 space-y-2">
                    <div className="w-20 h-20 bg-memoryes-soft rounded-[2.5rem] flex items-center justify-center mx-auto shadow-lg mb-4">
                        <Type size={40} className="text-memoryes-primary" />
                    </div>
                    <h1 className="text-3xl font-serif italic text-memoryes-clay">Secret Echo</h1>
                    <p className="text-slate-400 text-sm px-10">Create a phrase for your family to solve.</p>
                </div>

                <div className="space-y-4 max-w-sm mx-auto w-full">
                    <input
                        placeholder="Secret Word/Phrase"
                        className="w-full p-5 bg-white rounded-[2rem] border border-slate-100 text-center font-serif text-xl outline-none focus:border-memoryes-primary transition-all"
                        value={setupWord}
                        onChange={e => setSetupWord(e.target.value)}
                    />
                    <input
                        placeholder="Hint / Category"
                        className="w-full p-4 bg-white/50 rounded-2xl border border-transparent text-center text-[10px] font-bold uppercase tracking-widest outline-none focus:bg-white transition-all"
                        value={setupCategory}
                        onChange={e => setSetupCategory(e.target.value)}
                    />
                    <button
                        onClick={createGame}
                        disabled={!setupWord}
                        className="w-full py-5 bg-memoryes-clay text-white rounded-[2.2rem] font-bold shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-30 mt-4"
                    >
                        <Sparkles size={20} /> Encrypt & Send
                    </button>
                </div>
            </div>
        );
    }

    if (!game) return null;
    const isCreator = user?._id === game.creatorId;

    return (
        <div className="min-h-screen bg-memoryes-background p-6 flex flex-col items-center">
            <header className="pt-12 w-full flex justify-between items-center mb-6">
                <button onClick={() => router.push('/games')} className="p-3 bg-white rounded-2xl shadow-sm text-slate-400"><ChevronLeft /></button>
                <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-slate-300 tracking-[3px]">{game.category}</p>
                    <p className="text-[9px] font-bold text-memoryes-primary uppercase">Host: {game.creatorName}</p>
                </div>
                <div className="w-12" />
            </header>

            <div className="flex-1 flex flex-col items-center justify-center w-full">
                <HangmanSketch mistakes={game.wrongGuesses} />

                {/* --- THE WORD GRID --- */}
                <div className="flex flex-wrap justify-center gap-2 my-10 px-4">
                    {game.word.split('').map((letter: string, i: number) => (
                        <div key={i} className={`w-8 h-10 border-b-4 flex items-center justify-center text-xl font-black transition-all ${letter === ' ' ? 'border-transparent mx-2' : 'border-memoryes-soft'}`}>
                            <span className={game.guessedLetters.includes(letter) ? "opacity-100" : isCreator ? "opacity-25 text-memoryes-primary" : "opacity-0"}>
                                {letter}
                            </span>
                        </div>
                    ))}
                </div>

                {/* --- NEW: GUESSED LETTERS HISTORY --- */}
                <div className="mb-10 w-full max-w-sm px-6">
                    <div className="flex items-center gap-3 mb-3">
                        <History size={12} className="text-slate-300" />
                        <span className="text-[8px] font-black uppercase tracking-[3px] text-slate-300">Attempt History</span>
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[32px]">
                        {game.guessedLetters.length === 0 && (
                            <span className="text-[10px] text-slate-200 italic">No attempts yet...</span>
                        )}
                        {game.guessedLetters.map((l: string) => {
                            const isHit = game.word.toUpperCase().includes(l);
                            return (
                                <motion.div
                                    key={l}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 shadow-sm ${isHit
                                            ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                                            : 'bg-rose-50 border-rose-500 text-rose-600'
                                        }`}
                                >
                                    {l}
                                </motion.div>
                            );
                        })}
                    </div>
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

            <AnimatePresence>
                {(game.status === 'won' || game.status === 'lost') && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[200] bg-memoryes-clay/90 backdrop-blur-md flex items-center justify-center p-8">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white p-10 rounded-[4rem] shadow-2xl text-center space-y-8 w-full max-w-xs">
                            <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl ${game.status === 'won' ? 'bg-memoryes-mint text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                                {game.status === 'won' ? <Trophy size={48} /> : <Skull size={48} />}
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-serif italic text-memoryes-clay">{game.status === 'won' ? "Echo Found!" : "Echo Faded"}</h2>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Secret: <span className="text-memoryes-primary font-black ml-1">{game.word}</span></p>
                            </div>
                            <button onClick={() => router.push('/games')} className="w-full py-5 bg-memoryes-clay text-white rounded-[2rem] font-bold shadow-xl">Back to Lounge</button>
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