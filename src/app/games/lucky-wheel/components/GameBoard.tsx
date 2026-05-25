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
const HUNGARIAN_ALPHABET = ['A', 'Á', 'B', 'C', 'D', 'E', 'É', 'F', 'G', 'H', 'I', 'Í', 'J', 'K', 'L', 'M', 'N', 'O', 'Ó', 'Ö', 'Ő', 'P', 'Q', 'R', 'S', 'T', 'U', 'Ú', 'Ü', 'Ű', 'V', 'W', 'X', 'Y', 'Z'];

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
            setPlayers(initialPlayerNames.map(name => ({ name, roundScore: 0, totalScore: gameMode === 'SINGLE' ? 2500 : 0 })));
            setActivePlayerIdx(0);
            setRevealedLetters(new Set());
        }
    }, [initialPlayerNames, gameMode, savedState]);

    const handleSaveGame = async () => {
        if (saving || gameState === 'SPINNING') return;
        setSaving(true);
        try {
            await apiClient.post('/api/lucky-wheel/save/', {
                phrase: remotePuzzle.phrase,
                category: remotePuzzle.category,
                revealedLetters: Array.from(revealedLetters),
                players,
                activePlayerIdx,
                gameMode,
            });
            toast.success(`Vault State Saved`);
        } catch (err) {
            toast.error("Save failed");
        } finally {
            setSaving(false);
        }
    };

    // --- LOGIC: DYNAMIC GRID WITH HYPHENATION & CENTERING ---
    const renderBoardGrid = () => {
        const COLS = 12;
        const words = remotePuzzle.phrase.toUpperCase().split(' ');
        const rows: { char: string; isActive: boolean; isRevealed: boolean }[][] = [];

        let currentLine: { char: string; isActive: boolean; isRevealed: boolean }[] = [];

        const commitLine = () => {
            if (currentLine.length === 0) return;
            // Trim trailing space if any
            if (currentLine[currentLine.length - 1].char === ' ') currentLine.pop();

            const row = Array.from({ length: COLS }, () => ({ char: '', isActive: false, isRevealed: false }));
            const startIdx = Math.floor((COLS - currentLine.length) / 2);

            currentLine.forEach((item, i) => {
                row[startIdx + i] = item;
            });
            rows.push(row);
            currentLine = [];
        };

        let workingWords = [...words];
        for (let i = 0; i < workingWords.length; i++) {
            let word = workingWords[i];

            // If word is strictly too long for a single row (12 chars)
            if (word.length > COLS) {
                commitLine();
                const part1 = word.slice(0, COLS - 1) + "-";
                const part2 = word.slice(COLS - 1);

                part1.split('').forEach(c => currentLine.push({
                    char: c, isActive: true, isRevealed: c === '-' || revealedLetters.has(c)
                }));
                commitLine();
                workingWords.splice(i + 1, 0, part2); // Process remainder in next iteration
                continue;
            }

            // Check if word fits in remaining space of current line
            const spaceNeeded = currentLine.length > 0 ? 1 : 0;
            if (currentLine.length + spaceNeeded + word.length <= COLS) {
                if (spaceNeeded) currentLine.push({ char: ' ', isActive: false, isRevealed: true });
                word.split('').forEach(c => currentLine.push({
                    char: c, isActive: true, isRevealed: revealedLetters.has(c)
                }));
            } else {
                commitLine();
                word.split('').forEach(c => currentLine.push({
                    char: c, isActive: true, isRevealed: revealedLetters.has(c)
                }));
            }
        }
        commitLine();

        return { rows, cols: COLS };
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
                return toast.error('Insufficient funds!');
            }
            setPlayers(prev => prev.map((p, idx) => idx === activePlayerIdx ? (p.roundScore >= cost ? { ...p, roundScore: p.roundScore - cost } : { ...p, totalScore: p.totalScore - cost }) : p));
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
            const isSolved = remotePuzzle.phrase.toUpperCase().split('').every(char => char === ' ' || char === '-' || nextRevealed.has(char));
            if (isSolved) {
                setPlayers(prev => prev.map((p, idx) => idx === activePlayerIdx ? { ...p, totalScore: p.totalScore + p.roundScore, roundScore: 0 } : p));
                setGameState('GAME_OVER');
            }
        } else {
            nextTurn(`Wrong! Solution failed.`);
        }
    };

    const nextTurn = (msg: string) => {
        toast.info(msg);
        setActivePlayerIdx(prev => (players.length > 1 ? (prev + 1) % players.length : prev));
        setGameState('IDLE');
        setWheelResult(null);
    };

    const { rows: boardGrid, cols: totalCols } = renderBoardGrid();
    const activePlayer = players[activePlayerIdx];
    const canAffordVowel = activePlayer ? (activePlayer.roundScore >= 250 || activePlayer.totalScore >= 250) : false;

    return (
        <div className="min-h-screen w-full bg-memoryes-background text-memoryes-clay flex flex-col items-center justify-between pb-10 relative overflow-hidden">
            <header className="w-full p-6 pt-12 flex justify-between items-center bg-white/50 backdrop-blur-md border-b border-slate-100 z-50">
                <div className="flex gap-2">
                    <button onClick={onBackToMenu} className="p-3 bg-white rounded-2xl shadow-sm text-slate-400"><ChevronLeft size={20} /></button>
                    {gameState !== 'GAME_OVER' && <button onClick={handleSaveGame} disabled={saving} className="p-3 bg-white rounded-2xl shadow-sm text-memoryes-primary"><Save size={20} /></button>}
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-[3px] text-slate-300">Turn Owner</p>
                    <h3 className="text-lg font-serif italic">{activePlayer?.name}</h3>
                </div>
            </header>

            <section className="w-full px-6 mt-4 flex gap-3 overflow-x-auto no-scrollbar py-2 z-40">
                {players.map((p, idx) => (
                    <motion.div key={idx} animate={{ scale: idx === activePlayerIdx ? 1.05 : 1, backgroundColor: idx === activePlayerIdx ? '#FFF' : 'rgba(255,255,255,0.4)', borderColor: idx === activePlayerIdx ? '#9B86BD' : 'transparent' }} className="min-w-[120px] p-4 rounded-[2rem] border-2 shadow-sm flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 font-bold text-[10px] ${idx === activePlayerIdx ? 'bg-memoryes-primary text-white' : 'bg-memoryes-soft'}`}>{p.name.charAt(0)}</div>
                        <p className="text-[10px] font-bold truncate w-full text-center">{p.name}</p>
                        <p className="text-sm font-black text-memoryes-primary">{p.roundScore}$</p>
                    </motion.div>
                ))}
            </section>

            <section className="w-full max-w-lg px-4 my-4 flex-1 flex flex-col justify-center">
                <motion.div layout className="bg-memoryes-clay p-5 rounded-[3rem] shadow-2xl space-y-1.5 border-8 border-white/10">
                    {boardGrid.map((row, rIdx) => (
                        <div key={rIdx} className="flex justify-center gap-1">
                            {row.map((tile, tIdx) => (
                                <div
                                    key={tIdx}
                                    style={{ width: `${100 / totalCols}%` }}
                                    className={`aspect-[3/4] flex items-center justify-center rounded-md transition-all duration-500 shadow-inner ${tile.isActive
                                        ? tile.isRevealed ? 'bg-white text-memoryes-clay' : 'bg-memoryes-soft/20 border border-white/10'
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
                        <motion.div key="idle" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="grid grid-cols-1 gap-3">
                            <ActionButton onClick={() => setGameState('SPINNING')} icon={<Sparkles size={20} />} label="Spin the Wheel" color="bg-memoryes-clay text-white" />
                            <div className="grid grid-cols-2 gap-3">
                                <ActionButton onClick={() => setGameState('BUYING_VOWEL')} icon={<Quote size={18} />} label="Buy Vowel" color="bg-white border border-slate-100" disabled={!canAffordVowel} />
                                <ActionButton onClick={() => setGameState('SOLVING')} icon={<HelpCircle size={18} />} label="Solve" color="bg-white border border-slate-100" />
                            </div>
                        </motion.div>
                    )}

                    {(gameState === 'SPINNING' || gameState === 'WHEEL_SHOW') && (
                        <motion.div key="wheel" initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                            <Wheel onSpinComplete={handleSpinComplete} isSpinning={gameState === 'SPINNING'} setIsSpinning={(s) => setGameState(s ? 'SPINNING' : 'WHEEL_SHOW')} />
                        </motion.div>
                    )}

                    {(gameState === 'SPINNED' || gameState === 'BUYING_VOWEL' || gameState === 'SOLVING') && (
                        <motion.div key="keyboard" initial={{ y: 100 }} animate={{ y: 0 }} className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-slate-50">
                            <div className="flex justify-between items-center mb-4 px-2">
                                <h4 className="text-[10px] font-black uppercase tracking-[3px] text-slate-300">
                                    {gameState === 'SPINNED' ? `Pick Consonant (${wheelResult?.value}$)` : gameState === 'BUYING_VOWEL' ? 'Buy Vowel' : 'Solve Vault'}
                                </h4>
                                <button onClick={() => setGameState('IDLE')} className="text-slate-300"><RefreshCcw size={14} /></button>
                            </div>
                            <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto no-scrollbar">
                                {(gameState === 'SPINNED' ? CONSONANTS : gameState === 'BUYING_VOWEL' ? VOWELS : HUNGARIAN_ALPHABET)
                                    .filter(l => gameState === 'SOLVING' ? !revealedLetters.has(l) : true)
                                    .map(l => (
                                        <button key={l} disabled={revealedLetters.has(l)} onClick={() => gameState === 'SOLVING' ? handleSolveLetterSelect(l) : handleLetterSelect(l, gameState === 'BUYING_VOWEL')} className={`aspect-square rounded-xl flex items-center justify-center font-bold ${revealedLetters.has(l) ? 'bg-slate-50 text-slate-200' : 'bg-memoryes-soft/30 text-memoryes-clay active:bg-memoryes-primary active:text-white'}`}>{l}</button>
                                    ))}
                            </div>
                        </motion.div>
                    )}

                    {gameState === 'GAME_OVER' && (
                        <motion.div key="win" initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-center space-y-6">
                            <div className="w-20 h-20 bg-memoryes-mint rounded-[2rem] flex items-center justify-center mx-auto shadow-xl"><Trophy className="text-emerald-600" size={40} /></div>
                            <h2 className="text-3xl font-serif italic">Puzzle Solved</h2>
                            <button onClick={onBackToMenu} className="w-full py-5 bg-memoryes-clay text-white rounded-[1.5rem] font-bold shadow-2xl flex items-center justify-center gap-3"><History size={20} /> Back to Lounge</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>
        </div>
    );
}

function ActionButton({ onClick, icon, label, color, disabled }: any) {
    return (
        <button disabled={disabled} onClick={onClick} className={`w-full py-5 rounded-[2rem] font-bold flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all disabled:opacity-20 ${color}`}>
            {icon}
            <span className="uppercase text-[10px] tracking-widest">{label}</span>
        </button>
    );
}