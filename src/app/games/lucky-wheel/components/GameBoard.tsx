'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Wheel, { WheelSegment } from './Wheel';
import {
    ChevronLeft,
    Save,
    Sparkles,
    Quote,
    HelpCircle,
    Trophy,
    RefreshCcw,
    History
} from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';

interface PlayerState {
    name: string;
    roundScore: number;
    totalScore: number;
}

interface SavedStateType {
    revealedLetters: string[];
    players: { name: string; roundScore: number; totalScore: number }[];
    activePlayerIdx: number;
}

interface GameBoardProps {
    onBackToMenu: () => void;
    remotePuzzle: { phrase: string; category: string };
    gameMode: 'SINGLE' | 'LOCAL_MULTI' | 'ONLINE_MULTI';
    initialPlayerNames: string[];
    savedState?: SavedStateType | null;
}

const CONSONANTS = 'BCDFGHJKLMNPRSTVWXYZ'.split('');
const VOWELS = 'AEIOUÁÉÍÓÖŐÚÜŰ'.split('');
const HUNGARIAN_ALPHABET = [
    'A', 'Á', 'B', 'C', 'D', 'E', 'É', 'F', 'G', 'H', 'I', 'Í', 'J', 'K', 'L', 'M', 'N', 'O', 'Ó', 'Ö', 'Ő', 'P', 'Q', 'R', 'S', 'T', 'U', 'Ú', 'Ü', 'Ű', 'V', 'W', 'X', 'Y', 'Z'
];

export default function GameBoard({ onBackToMenu, remotePuzzle, gameMode, initialPlayerNames, savedState }: GameBoardProps) {
    const [players, setPlayers] = useState<PlayerState[]>([]);
    const [activePlayerIdx, setActivePlayerIdx] = useState<number>(0);
    const [revealedLetters, setRevealedLetters] = useState<Set<string>>(new Set());
    const [gameState, setGameState] = useState<'IDLE' | 'WHEEL_SHOW' | 'SPINNING' | 'SPINNED' | 'BUYING_VOWEL' | 'SOLVING' | 'GAME_OVER'>('IDLE');
    const [wheelResult, setWheelResult] = useState<WheelSegment | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (savedState) {
            setPlayers(savedState.players);
            setActivePlayerIdx(savedState.activePlayerIdx);
            setRevealedLetters(new Set(savedState.revealedLetters));
        } else {
            const initialized = initialPlayerNames.map((name) => ({
                name,
                roundScore: 0,
                totalScore: gameMode === 'SINGLE' ? 2500 : 0
            }));
            setPlayers(initialized);
            setActivePlayerIdx(0);
            setRevealedLetters(new Set());
        }
    }, [initialPlayerNames, gameMode, savedState]);

    const handleSaveGame = async () => {
        if (saving || gameState === 'SPINNING') return;
        setSaving(true);
        const toastId = toast.loading("Saving vault state...");
        try {
            await apiClient.post('/api/lucky-wheel/save/', {
                phrase: remotePuzzle.phrase,
                category: remotePuzzle.category,
                revealedLetters: Array.from(revealedLetters),
                players,
                activePlayerIdx,
                gameMode,
            });
            toast.success(`Game Saved!`, { id: toastId });
        } catch (err) {
            toast.error("Failed to save progress", { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    const nextTurn = (reasonMessage: string) => {
        if (players.length <= 1) {
            toast.info(reasonMessage);
            setGameState('IDLE');
            return;
        }
        const nextIndex = (activePlayerIdx + 1) % players.length;
        toast.info(`${reasonMessage} Turn: ${players[nextIndex].name}`);
        setActivePlayerIdx(nextIndex);
        setGameState('IDLE');
        setWheelResult(null);
    };

    // --- ENHANCED GRID LOGIC: HYPHENATION + CENTERING ---
    const renderBoardGrid = () => {
        const COLS = 12;
        const words = remotePuzzle.phrase.toUpperCase().split(' ');
        const activeRows: { char: string; isActive: boolean; isRevealed: boolean }[][] = [];

        let workingWords = [...words];
        let currentLineChars: { char: string; isActive: boolean; isRevealed: boolean }[] = [];

        const pushLine = () => {
            if (currentLineChars.length === 0) return;
            // Create full 12-col row initialized as inactive
            const row = Array.from({ length: COLS }, () => ({ char: '', isActive: false, isRevealed: false }));
            // Calculate start position for centering
            const startIdx = Math.floor((COLS - currentLineChars.length) / 2);
            // Place chars into the row
            currentLineChars.forEach((item, index) => {
                row[startIdx + index] = item;
            });
            activeRows.push(row);
            currentLineChars = [];
        };

        for (let i = 0; i < workingWords.length; i++) {
            let word = workingWords[i];

            // Check if we need a space before this word (if not at start of line)
            const spaceNeeded = currentLineChars.length > 0 ? 1 : 0;

            // CASE 1: Word is longer than the whole board
            if (word.length > COLS) {
                // If there's stuff on current line, push it first
                if (currentLineChars.length > 0) pushLine();

                // Split word
                const part1 = word.slice(0, COLS - 1) + "-";
                const remainder = word.slice(COLS - 1);

                // Add part 1 as its own line (already centered by pushLine logic)
                currentLineChars = part1.split('').map(c => ({
                    char: c,
                    isActive: true,
                    isRevealed: c === '-' || revealedLetters.has(c)
                }));
                pushLine();

                // Put remainder back into word list to be processed
                workingWords.splice(i + 1, 0, remainder);
                continue;
            }

            // CASE 2: Word fits in current line
            if (currentLineChars.length + spaceNeeded + word.length <= COLS) {
                if (spaceNeeded) currentLineChars.push({ char: ' ', isActive: false, isRevealed: true });
                word.split('').forEach(c => {
                    currentLineChars.push({
                        char: c,
                        isActive: true,
                        isRevealed: revealedLetters.has(c)
                    });
                });
            }
            // CASE 3: Word doesn't fit, start new line
            else {
                pushLine();
                word.split('').forEach(c => {
                    currentLineChars.push({
                        char: c,
                        isActive: true,
                        isRevealed: revealedLetters.has(c)
                    });
                });
            }
        }
        pushLine(); // Push the final line

        return { rows: activeRows, cols: COLS };
    };

    const handleSpinComplete = (segment: WheelSegment) => {
        setWheelResult(segment);
        if (segment.value === 'LOST') {
            setPlayers(prev => prev.map((p, idx) => idx === activePlayerIdx ? { ...p, roundScore: 0 } : p));
            nextTurn('Bankrupt!');
        } else if (segment.value === 'SKIP') {
            nextTurn('Turn skipped!');
        } else {
            toast.success(`${segment.value}$ Spinned!`);
            setGameState('SPINNED');
        }
    };

    const handleLetterSelect = (letter: string, isVowel: boolean) => {
        const activePlayer = players[activePlayerIdx];
        if (!activePlayer) return;

        if (isVowel) {
            const cost = 250;
            if (activePlayer.roundScore < cost && activePlayer.totalScore < cost) {
                toast.error('Not enough money!');
                return;
            }
            setPlayers(prev => prev.map((p, idx) => {
                if (idx === activePlayerIdx) {
                    return p.roundScore >= cost ? { ...p, roundScore: p.roundScore - cost } : { ...p, totalScore: p.totalScore - cost };
                }
                return p;
            }));
        }

        const nextRevealed = new Set(revealedLetters);
        nextRevealed.add(letter);
        setRevealedLetters(nextRevealed);

        const occurrences = remotePuzzle.phrase.toUpperCase().split('').filter(c => c === letter).length;

        if (occurrences > 0) {
            if (!isVowel && wheelResult && typeof wheelResult.value === 'number') {
                const gained = wheelResult.value * occurrences;
                setPlayers(prev => prev.map((p, idx) => idx === activePlayerIdx ? { ...p, roundScore: p.roundScore + gained } : p));
            }
            setGameState('IDLE');
        } else {
            nextTurn(`No "${letter}"`);
        }
    };

    const handleSolveLetterSelect = (letter: string) => {
        const nextRevealed = new Set(revealedLetters);
        nextRevealed.add(letter);
        setRevealedLetters(nextRevealed);
        const occurrences = remotePuzzle.phrase.toUpperCase().split('').filter(c => c === letter).length;

        if (occurrences > 0) {
            const isFullySolved = remotePuzzle.phrase.toUpperCase().split('').every(char => char === ' ' || char === '-' || nextRevealed.has(char));
            if (isFullySolved) {
                setPlayers(prev => prev.map((p, idx) => idx === activePlayerIdx ? { ...p, totalScore: p.totalScore + p.roundScore, roundScore: 0 } : p));
                setGameState('GAME_OVER');
            }
        } else {
            nextTurn(`Wrong letter! Solution failed.`);
        }
    };

    const { rows: boardGrid, cols: totalCols } = renderBoardGrid();
    const activePlayer = players[activePlayerIdx];
    const canAffordVowel = activePlayer ? (activePlayer.roundScore >= 250 || activePlayer.totalScore >= 250) : false;

    return (
        <div className="min-h-screen w-full bg-memoryes-background text-memoryes-clay flex flex-col items-center justify-between pb-10 relative overflow-hidden">

            <header className="w-full p-6 pt-12 flex justify-between items-center bg-white/50 backdrop-blur-md border-b border-slate-100 z-50">
                <div className="flex gap-2">
                    <button onClick={onBackToMenu} className="p-3 bg-white rounded-2xl shadow-sm hover:bg-slate-50 text-slate-400">
                        <ChevronLeft size={20} />
                    </button>
                    {gameState !== 'GAME_OVER' && (
                        <button onClick={handleSaveGame} disabled={saving} className="p-3 bg-white rounded-2xl shadow-sm text-memoryes-primary">
                            <Save size={20} />
                        </button>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-[3px] text-slate-300">Turn Owner</p>
                    <h3 className="text-lg font-serif italic text-memoryes-clay">{activePlayer?.name}</h3>
                </div>
            </header>

            <section className="w-full px-6 mt-4 flex gap-3 overflow-x-auto no-scrollbar py-2 z-40">
                {players.map((p, idx) => (
                    <motion.div
                        key={idx}
                        animate={{
                            scale: idx === activePlayerIdx ? 1.05 : 1,
                            backgroundColor: idx === activePlayerIdx ? '#FFF' : 'rgba(255,255,255,0.4)',
                            borderColor: idx === activePlayerIdx ? '#9B86BD' : 'transparent'
                        }}
                        className="min-w-[120px] p-4 rounded-[2rem] border-2 shadow-sm flex flex-col items-center text-center"
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 font-bold text-[10px] ${idx === activePlayerIdx ? 'bg-memoryes-primary text-white' : 'bg-memoryes-soft text-memoryes-clay'}`}>
                            {p.name.charAt(0)}
                        </div>
                        <p className="text-[10px] font-bold truncate w-full">{p.name}</p>
                        <motion.p key={p.roundScore} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="text-sm font-black text-memoryes-primary">{p.roundScore}$</motion.p>
                    </motion.div>
                ))}
            </section>

            {/* THE REDESIGNED BOARD GRID */}
            <section className="w-full max-w-lg px-4 my-4 flex-1 flex flex-col justify-center">
                <motion.div layout className="bg-memoryes-clay p-5 rounded-[3rem] shadow-2xl space-y-1.5 border-8 border-white/10">
                    {boardGrid.map((row, rIdx) => (
                        <div key={rIdx} className="flex justify-center gap-1">
                            {row.map((tile, tIdx) => (
                                <div
                                    key={tIdx}
                                    style={{ width: `${100 / totalCols}%` }}
                                    className={`aspect-[3/4] flex items-center justify-center rounded-md transition-all duration-500 shadow-inner ${tile.isActive
                                        ? tile.isRevealed
                                            ? 'bg-white text-memoryes-clay'
                                            : 'bg-memoryes-soft/20 border border-white/10'
                                        : 'opacity-0 pointer-events-none'
                                        }`}
                                >
                                    <AnimatePresence>
                                        {tile.isActive && tile.isRevealed && (
                                            <motion.span initial={{ scale: 0, rotateY: 180 }} animate={{ scale: 1, rotateY: 0 }} className="text-sm md:text-lg font-black select-none">
                                                {tile.char}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    ))}
                    <div className="pt-4 text-center">
                        <span className="bg-white/10 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-[4px] text-white/60">{remotePuzzle.category}</span>
                    </div>
                </motion.div>
            </section>

            <section className="w-full max-w-md px-6 z-50">
                <AnimatePresence mode="wait">
                    {gameState === 'IDLE' && (
                        <motion.div key="idle" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="grid grid-cols-1 gap-3">
                            <ActionButton onClick={() => setGameState('SPINNING')} icon={<Sparkles size={20} />} label="Spin the Wheel" color="bg-memoryes-clay text-white" />
                            <div className="grid grid-cols-2 gap-3">
                                <ActionButton onClick={() => setGameState('BUYING_VOWEL')} icon={<Quote size={18} />} label="Buy Vowel" color="bg-white text-memoryes-clay border border-slate-100" disabled={!canAffordVowel} />
                                <ActionButton onClick={() => setGameState('SOLVING')} icon={<HelpCircle size={18} />} label="Solve" color="bg-white text-memoryes-clay border border-slate-100" />
                            </div>
                        </motion.div>
                    )}

                    {(gameState === 'SPINNING' || gameState === 'WHEEL_SHOW') && (
                        <motion.div key="wheel" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="flex flex-col items-center">
                            <Wheel onSpinComplete={handleSpinComplete} isSpinning={gameState === 'SPINNING'} setIsSpinning={(s) => setGameState(s ? 'SPINNING' : 'WHEEL_SHOW')} />
                            {gameState === 'WHEEL_SHOW' && (
                                <button onClick={() => setGameState('IDLE')} className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-200">Go Back</button>
                            )}
                        </motion.div>
                    )}

                    {(gameState === 'SPINNED' || gameState === 'BUYING_VOWEL' || gameState === 'SOLVING') && (
                        <motion.div key="keyboard" initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-slate-50">
                            <div className="flex justify-between items-center mb-4 px-2">
                                <h4 className="text-[10px] font-black uppercase tracking-[3px] text-slate-300">
                                    {gameState === 'SPINNED' ? `Select Consonant (${wheelResult?.value}$)` : gameState === 'BUYING_VOWEL' ? 'Select Vowel (250$)' : 'Solve Puzzle'}
                                </h4>
                                <button onClick={() => setGameState('IDLE')} className="text-slate-300 hover:text-rose-400"><RefreshCcw size={14} /></button>
                            </div>
                            <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto no-scrollbar">
                                {(gameState === 'SPINNED' ? CONSONANTS : gameState === 'BUYING_VOWEL' ? VOWELS : HUNGARIAN_ALPHABET)
                                    .filter(l => gameState === 'SOLVING' ? !revealedLetters.has(l) : true)
                                    .map(l => (
                                        <button
                                            key={l}
                                            disabled={revealedLetters.has(l)}
                                            onClick={() => gameState === 'SOLVING' ? handleSolveLetterSelect(l) : handleLetterSelect(l, gameState === 'BUYING_VOWEL')}
                                            className={`aspect-square rounded-xl flex items-center justify-center font-bold transition-all ${revealedLetters.has(l) ? 'bg-slate-50 text-slate-200' : 'bg-memoryes-soft/30 text-memoryes-clay active:scale-90 active:bg-memoryes-primary active:text-white'}`}
                                        >
                                            {l}
                                        </button>
                                    ))}
                            </div>
                        </motion.div>
                    )}

                    {gameState === 'GAME_OVER' && (
                        <motion.div key="win" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-6">
                            <div className="w-20 h-20 bg-memoryes-mint rounded-[2rem] flex items-center justify-center mx-auto shadow-xl">
                                <Trophy className="text-emerald-600" size={40} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-serif italic text-memoryes-clay">Puzzle Solved</h2>
                                <button onClick={onBackToMenu} className="w-full py-5 bg-memoryes-clay text-white rounded-[1.5rem] font-bold shadow-2xl flex items-center justify-center gap-3">
                                    <History size={20} /> Back to Lounge
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>
        </div>
    );
}

function ActionButton({ onClick, icon, label, color, disabled }: any) {
    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className={`w-full py-5 rounded-[2rem] font-bold flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all disabled:opacity-20 ${color}`}
        >
            {icon}
            <span className="uppercase text-[10px] tracking-widest">{label}</span>
        </button>
    );
}