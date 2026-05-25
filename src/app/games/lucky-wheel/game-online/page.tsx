'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Wheel, { WheelSegment } from '../components/Wheel';
import {
    ChevronLeft,
    Sparkles,
    Quote,
    HelpCircle,
    Trophy,
    User,
    ShieldCheck,
    Loader2,
    MessageCircle,
    Info,
    History,
    DoorOpen
} from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';

interface SyncLobbyType {
    code: string;
    phrase: string;
    category: string;
    players: string[];
    playerScores: number[];
    playerTotalScores: number[];
    revealedLetters: string[];
    activePlayerIdx: number;
    currentTurnScore: number;
    currentWheelValue: string;
    turnState: 'idle' | 'spinning' | 'spinned' | 'buying_vowel' | 'solving' | 'game_over' | 'round_over';
    round: number;
    maxRounds: number;
    themes: string[];
    hostName: string;
}

const CONSONANTS = 'BCDFGHJKLMNPRSTVWXYZ'.split('');
const VOWELS = 'AEIOUÁÉÍÓÖŐÚÜŰ'.split('');
const HUNGARIAN_ALPHABET = ['A', 'Á', 'B', 'C', 'D', 'E', 'É', 'F', 'G', 'H', 'I', 'Í', 'J', 'K', 'L', 'M', 'N', 'O', 'Ó', 'Ö', 'Ő', 'P', 'Q', 'R', 'S', 'T', 'U', 'Ú', 'Ü', 'Ű', 'V', 'W', 'X', 'Y', 'Z'];

function OnlineGameContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const codeParam = searchParams.get('code');

    const [onlinePlayerName] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('onlinePlayerName')?.trim() || 'Explorer';
        }
        return 'Explorer';
    });

    const [lobby, setLobby] = useState<SyncLobbyType | null>(null);
    const [loading, setLoading] = useState(true);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // 1. SYNC LOGIC (Cloud Polling)
    useEffect(() => {
        if (!codeParam) {
            router.push('/games');
            return;
        }

        const pollGame = async () => {
            try {
                const { data } = await apiClient.get(`/api/lucky-wheel/lobby/${codeParam}/`);
                setLobby(data.data);
                setLoading(false);
            } catch (err) {
                console.error('Vault Sync Interrupted');
            }
        };

        pollGame();
        pollIntervalRef.current = setInterval(pollGame, 2000);
        return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); };
    }, [codeParam, router]);

    const pushStateUpdate = async (updates: Partial<SyncLobbyType>) => {
        if (!codeParam) return;
        try {
            const { data } = await apiClient.put(`/api/lucky-wheel/lobby/${codeParam}/`, updates);
            setLobby(data.data);
        } catch (err) {
            toast.error("Cloud synchronization failed");
        }
    };

    // 2. GAME LOGIC HANDLERS
    const handleSpinComplete = (segment: WheelSegment) => {
        if (!lobby) return;
        if (segment.value === 'LOST') {
            const nextIdx = (lobby.activePlayerIdx + 1) % lobby.players.length;
            const nextScores = [...lobby.playerScores];
            nextScores[lobby.activePlayerIdx] = 0;
            pushStateUpdate({ playerScores: nextScores, activePlayerIdx: nextIdx, turnState: 'idle' });
            toast.error('Bankrupt! Balance cleared.');
        } else if (segment.value === 'SKIP') {
            const nextIdx = (lobby.activePlayerIdx + 1) % lobby.players.length;
            pushStateUpdate({ activePlayerIdx: nextIdx, turnState: 'idle' });
            toast.info('Turn passed to next player');
        } else {
            pushStateUpdate({ currentWheelValue: String(segment.value), turnState: 'spinned' });
        }
    };

    const handleLetterSelect = (letter: string, isVowel: boolean) => {
        if (!lobby) return;
        let nextScores = [...lobby.playerScores];
        let nextTotalScores = [...lobby.playerTotalScores];

        if (isVowel) {
            const cost = 250;
            if (nextScores[lobby.activePlayerIdx] < cost && nextTotalScores[lobby.activePlayerIdx] < cost) {
                return toast.error("Not enough points for a vowel");
            }
            if (nextScores[lobby.activePlayerIdx] >= cost) nextScores[lobby.activePlayerIdx] -= cost;
            else nextTotalScores[lobby.activePlayerIdx] -= cost;
        }

        const nextRevealed = [...lobby.revealedLetters, letter];
        const occurrences = lobby.phrase.toUpperCase().split('').filter(c => c === letter).length;

        if (occurrences > 0) {
            if (!isVowel) nextScores[lobby.activePlayerIdx] += Number(lobby.currentWheelValue) * occurrences;

            const isSolved = lobby.phrase.toUpperCase().split('').every(char => char === ' ' || nextRevealed.includes(char));
            if (isSolved) {
                const finalTotals = [...lobby.playerTotalScores];
                finalTotals[lobby.activePlayerIdx] += nextScores[lobby.activePlayerIdx];
                const isGameOver = (lobby.round || 1) >= (lobby.maxRounds || 3);
                pushStateUpdate({ revealedLetters: nextRevealed, playerTotalScores: finalTotals, turnState: isGameOver ? 'game_over' : 'round_over' });
                toast.success(isGameOver ? "Champion Crowned!" : "Round Won!");
            } else {
                pushStateUpdate({ revealedLetters: nextRevealed, playerScores: nextScores, turnState: 'idle' });
                toast.success(`Found ${occurrences} "${letter}"!`);
            }
        } else {
            const nextIdx = (lobby.activePlayerIdx + 1) % lobby.players.length;
            pushStateUpdate({ revealedLetters: nextRevealed, activePlayerIdx: nextIdx, turnState: 'idle' });
            toast.error(`No "${letter}". Passing turn.`);
        }
    };

    // --- NEW: NEXT ROUND LOGIC ---
    const handleStartNextRound = async () => {
        if (!lobby || !codeParam) return;
        const toastId = toast.loading("Fetching next puzzle...");
        try {
            const { data: themesData } = await apiClient.get('/api/lucky-wheel/themes');
            const activeThemes = themesData.data.filter((t: any) => lobby.themes.includes(t._id));
            const puzzlePool: { phrase: string; category: string }[] = [];

            activeThemes.forEach((theme: any) => {
                theme.puzzles.forEach((phrase: string) => {
                    if (phrase.toUpperCase() !== lobby.phrase.toUpperCase()) {
                        puzzlePool.push({ phrase, category: theme.title });
                    }
                });
            });

            if (puzzlePool.length === 0) {
                toast.error("No more puzzles available in these themes.");
                return;
            }

            const selectedPuzzle = puzzlePool[Math.floor(Math.random() * puzzlePool.length)];

            await pushStateUpdate({
                phrase: selectedPuzzle.phrase,
                category: selectedPuzzle.category,
                revealedLetters: [],
                playerScores: lobby.players.map(() => 0),
                currentTurnScore: 0,
                currentWheelValue: '',
                turnState: 'idle',
                round: (lobby.round || 1) + 1
            });
            toast.success("Round started!", { id: toastId });
        } catch (err) {
            toast.error("Failed to start round", { id: toastId });
        }
    };

    if (loading || !lobby) return (
        <div className="h-screen bg-memoryes-background flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-memoryes-primary mb-4" size={40} />
            <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Connecting to Room...</p>
        </div>
    );

    const activePlayerName = lobby.players[lobby.activePlayerIdx];
    const isMyTurn = activePlayerName === onlinePlayerName;
    const myIndex = lobby.players.indexOf(onlinePlayerName);
    const myRoundScore = lobby.playerScores[myIndex] || 0;
    const myTotalScore = lobby.playerTotalScores[myIndex] || 0;

    return (
        <div className="min-h-screen w-full bg-memoryes-background text-memoryes-clay flex flex-col items-center justify-between pb-10 relative overflow-hidden">

            {/* 1. HEADER HUD */}
            <header className="w-full p-6 pt-12 flex justify-between items-center bg-white/50 backdrop-blur-md border-b border-slate-100 z-50">
                <button onClick={() => router.push('/games')} className="p-3 bg-white rounded-2xl shadow-sm text-slate-400">
                    <ChevronLeft size={20} />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[9px] font-black uppercase tracking-[3px] text-slate-300">
                        Round {lobby.round || 1}/{lobby.maxRounds || 3}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                        <h2 className="text-sm font-bold uppercase tracking-widest">{lobby.code}</h2>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[8px] font-black uppercase tracking-[2px] text-memoryes-primary">Contributor</p>
                    <h3 className={`text-md font-serif italic ${isMyTurn ? 'text-memoryes-primary' : 'text-slate-400'}`}>
                        {isMyTurn ? 'Your Turn' : activePlayerName}
                    </h3>
                </div>
            </header>

            {/* 2. SYNCED SCOREBOARD */}
            <section className="w-full px-6 mt-4 flex gap-3 overflow-x-auto no-scrollbar py-2">
                {lobby.players.map((name, idx) => (
                    <motion.div
                        key={idx}
                        animate={{
                            scale: idx === lobby.activePlayerIdx ? 1.05 : 1,
                            backgroundColor: idx === lobby.activePlayerIdx ? '#FFF' : 'rgba(255,255,255,0.4)',
                            borderColor: idx === lobby.activePlayerIdx ? '#9B86BD' : 'transparent'
                        }}
                        className="min-w-[130px] p-4 rounded-[2rem] border-2 shadow-sm flex flex-col items-center text-center transition-colors"
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 font-black text-[10px] ${idx === lobby.activePlayerIdx ? 'bg-memoryes-primary text-white shadow-lg shadow-memoryes-primary/30' : 'bg-memoryes-soft text-memoryes-primary'}`}>
                            {name.charAt(0)}
                        </div>
                        <p className="text-[10px] font-bold truncate w-full">{name} {name === onlinePlayerName && ' (You)'}</p>
                        <p className="text-sm font-black text-memoryes-primary">{lobby.playerScores[idx]}$</p>
                        <p className="text-[8px] font-black text-slate-300 uppercase">Bank: {lobby.playerTotalScores[idx]}$</p>
                    </motion.div>
                ))}
            </section>

            {/* 3. SCAPBOOK TILES BOARD */}
            <section className="w-full max-w-lg px-4 my-6 flex-1 flex flex-col justify-center">
                <div className="bg-memoryes-clay p-6 rounded-[3.5rem] shadow-2xl space-y-2 border-8 border-white/10">
                    <div className="flex flex-wrap justify-center gap-1.5">
                        {lobby.phrase.toUpperCase().split('').map((char, i) => (
                            <div
                                key={i}
                                className={`w-[7%] aspect-[3/4] flex items-center justify-center rounded-lg transition-all duration-500 shadow-sm ${char === ' '
                                    ? 'opacity-0'
                                    : lobby.revealedLetters.includes(char)
                                        ? 'bg-white text-memoryes-clay'
                                        : 'bg-memoryes-soft/20 border border-white/10 shadow-inner'
                                    }`}
                            >
                                <AnimatePresence>
                                    {lobby.revealedLetters.includes(char) && (
                                        <motion.span initial={{ scale: 0, rotateY: 180 }} animate={{ scale: 1, rotateY: 0 }} className="font-black text-sm md:text-lg">{char}</motion.span>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                    <div className="pt-6 text-center">
                        <span className="bg-white/10 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[5px] text-white/40">{lobby.category}</span>
                    </div>
                </div>
            </section>

            {/* 4. ACTION INTERFACE */}
            <section className="w-full max-w-md px-6 z-50">
                <AnimatePresence mode="wait">
                    {isMyTurn ? (
                        <motion.div key="my-turn" initial={{ y: 20 }} animate={{ y: 0 }} className="space-y-4">
                            {lobby.turnState === 'idle' && (
                                <div className="grid grid-cols-1 gap-3">
                                    <GameBtn onClick={() => pushStateUpdate({ turnState: 'spinning' })} icon={<Sparkles size={20} />} label="Spin the Wheel" color="bg-memoryes-clay text-white shadow-2xl" />
                                    <div className="grid grid-cols-2 gap-3">
                                        <GameBtn onClick={() => pushStateUpdate({ turnState: 'buying_vowel' })} icon={<Quote size={18} />} label="Buy Vowel" color="bg-white text-memoryes-clay border border-slate-100 shadow-sm" disabled={myRoundScore < 250 && myTotalScore < 250} />
                                        <GameBtn onClick={() => pushStateUpdate({ turnState: 'solving' })} icon={<HelpCircle size={18} />} label="Solve" color="bg-white text-memoryes-clay border border-slate-100 shadow-sm" />
                                    </div>
                                </div>
                            )}

                            {lobby.turnState === 'spinning' && (
                                <Wheel onSpinComplete={handleSpinComplete} isSpinning={true} setIsSpinning={() => { }} />
                            )}

                            {(lobby.turnState === 'spinned' || lobby.turnState === 'buying_vowel' || lobby.turnState === 'solving') && (
                                <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-slate-100">
                                    <div className="flex justify-between items-center mb-4 px-2">
                                        <span className="text-[10px] font-black uppercase tracking-[3px] text-slate-300">
                                            {lobby.turnState === 'spinned' ? `Consonant (${lobby.currentWheelValue}$)` : lobby.turnState === 'buying_vowel' ? 'Choose Vowel' : 'Solve Vault'}
                                        </span>
                                        <button onClick={() => pushStateUpdate({ turnState: 'idle' })} className="text-slate-200 hover:text-memoryes-primary transition-colors"><RefreshCcw size={16} /></button>
                                    </div>
                                    <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto no-scrollbar">
                                        {(lobby.turnState === 'spinned' ? CONSONANTS : lobby.turnState === 'buying_vowel' ? VOWELS : HUNGARIAN_ALPHABET).map(l => (
                                            <button
                                                key={l}
                                                disabled={lobby.revealedLetters.includes(l)}
                                                onClick={() => handleLetterSelect(l, lobby.turnState === 'buying_vowel')}
                                                className={`aspect-square rounded-xl font-bold flex items-center justify-center transition-all ${lobby.revealedLetters.includes(l) ? 'bg-slate-50 text-slate-200' : 'bg-memoryes-soft/40 text-memoryes-clay active:bg-memoryes-primary active:text-white active:scale-90 shadow-sm'}`}
                                            >
                                                {l}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    ) : (
                        /* LIVE SPECTATOR CARD */
                        <motion.div key="spectator" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/95 backdrop-blur-md text-white p-8 rounded-[3rem] text-center space-y-4 shadow-2xl">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto border border-white/5">
                                <Loader2 className="animate-spin text-memoryes-primary" size={24} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold uppercase tracking-widest">{activePlayerName} is Contributing...</h4>
                                <p className="text-[10px] text-slate-500 uppercase mt-2 tracking-[2px]">
                                    {lobby.turnState === 'spinning' ? 'Spinning the Wheel' : lobby.turnState === 'spinned' ? 'Thinking of a letter' : 'Syncing state...'}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

            {/* 5. SUMMARIES (ROUND & GAME) */}
            <AnimatePresence>
                {(lobby.turnState === 'game_over' || lobby.turnState === 'round_over') && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-memoryes-clay/90 backdrop-blur-md flex items-center justify-center p-8">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white p-10 rounded-[4rem] shadow-2xl w-full max-w-sm text-center space-y-8">
                            <div className="w-20 h-20 bg-memoryes-mint rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl border-4 border-white">
                                <Trophy className="text-emerald-600" size={40} />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-serif italic text-memoryes-clay leading-tight">
                                    {lobby.turnState === 'game_over' ? 'Vault Master' : 'Round Secured'}
                                </h2>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[3px]">Scoreboard Synced</p>
                            </div>

                            <div className="space-y-2 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 shadow-inner">
                                {lobby.players.map((n, i) => (
                                    <div key={i} className="flex justify-between items-center py-1">
                                        <span className={`text-xs font-bold ${n === onlinePlayerName ? 'text-memoryes-primary' : 'text-slate-500'}`}>{n}</span>
                                        <span className="font-black text-sm text-memoryes-clay">{lobby.playerTotalScores[i]}$</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col gap-3">
                                {lobby.turnState === 'round_over' && (
                                    lobby.hostName === onlinePlayerName ? (
                                        <button onClick={handleStartNextRound} className="w-full py-5 bg-memoryes-primary text-white rounded-[1.5rem] font-bold shadow-xl shadow-memoryes-primary/30 active:scale-95 transition-transform">
                                            Start Next Round
                                        </button>
                                    ) : (
                                        <div className="p-4 bg-memoryes-soft/30 rounded-2xl flex items-center justify-center gap-3">
                                            <Loader2 className="animate-spin text-memoryes-primary" size={16} />
                                            <span className="text-[10px] font-black text-memoryes-primary uppercase tracking-[2px]">Awaiting Host...</span>
                                        </div>
                                    )
                                )}
                                <button onClick={() => router.push('/games')} className="w-full py-4 text-slate-300 font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                                    <DoorOpen size={14} /> Exit to Lounge
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <footer className="w-full max-w-md px-4 pt-6 border-t border-slate-100 space-y-4 flex flex-col items-center">
                <div className="bg-memoryes-soft/50 px-4 py-1.5 rounded-full border border-memoryes-primary/10 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-memoryes-primary" />
                    <span className="text-[10px] font-black text-memoryes-primary uppercase tracking-[3px]">Secure Session</span>
                </div>
            </footer>
        </div>
    );
}

function GameBtn({ onClick, icon, label, color, disabled }: any) {
    return (
        <button disabled={disabled} onClick={onClick} className={`w-full py-5 rounded-[2.2rem] font-bold flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all disabled:opacity-20 ${color}`}>
            {icon} <span className="uppercase text-[11px] tracking-[2px]">{label}</span>
        </button>
    );
}

function RefreshCcw(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21h5v-5" /></svg>; }

export default function OnlineGamePage() {
    return <Suspense fallback={<div className="h-screen bg-memoryes-background flex items-center justify-center"><Loader2 className="animate-spin text-memoryes-primary" /></div>}><OnlineGameContent /></Suspense>;
}