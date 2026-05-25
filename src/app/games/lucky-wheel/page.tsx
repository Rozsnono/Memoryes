'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    Users,
    User as UserIcon,
    Globe,
    CloudDownload,
    Plus,
    Trash2,
    CheckCircle2,
    Sparkles,
    Loader2,
    Gamepad2
} from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';

interface ThemeType {
    _id: string;
    title: string;
    puzzles: string[];
}

export default function WheelGameMenu() {
    const router = useRouter();
    const [gameState, setGameState] = useState<'MENU' | 'PLAY_SETTINGS' | 'LOAD_GAME'>('MENU');
    const [gameMode, setGameMode] = useState<'SINGLE' | 'LOCAL_MULTI'>('SINGLE');

    const [themes, setThemes] = useState<ThemeType[]>([]);
    const [selectedThemeIds, setSelectedThemeIds] = useState<string[]>([]);
    const [players, setPlayers] = useState<string[]>(['Player 1']);
    const [newPlayerName, setNewPlayerName] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadCodeInput, setLoadCodeInput] = useState('');

    useEffect(() => {
        async function fetchThemes() {
            try {
                // Using our central apiClient
                const { data } = await apiClient.get('/api/lucky-wheel/themes/');
                if (data.data.length > 0) {
                    setThemes(data.data);
                    setSelectedThemeIds([data.data[0]._id]);
                }
            } catch (err) {
                toast.error('Could not load lucky wheel themes');
            } finally {
                setLoading(false);
            }
        }
        fetchThemes();
    }, []);

    const handleToggleTheme = (id: string) => {
        if (selectedThemeIds.includes(id)) {
            if (selectedThemeIds.length > 1) {
                setSelectedThemeIds(selectedThemeIds.filter(tId => tId !== id));
            }
        } else {
            setSelectedThemeIds([...selectedThemeIds, id]);
        }
    };

    const handleStartGame = () => {
        if (selectedThemeIds.length === 0) {
            toast.error('Please select at least one theme');
            return;
        }
        const themeIds = selectedThemeIds.join(',');
        const playerNames = encodeURIComponent(players.join(','));
        router.push(`/games/lucky-wheel/game?id=${themeIds}&mode=${gameMode}&players=${playerNames}`);
    };

    const handleLoadGameSubmit = async () => {
        if (loadCodeInput.length !== 6) {
            toast.error('Please enter a 6-digit code');
            return;
        }
        setLoading(true);
        try {
            const { data } = await apiClient.get(`/api/save/${loadCodeInput}/`);
            router.push(`/games/lucky-wheel/game?saveCode=${data.saveCode}`);
        } catch (err) {
            toast.error('Invalid save code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-memoryes-background text-memoryes-clay flex flex-col items-center justify-center p-6 select-none overflow-hidden">

            {/* Background Decorative Blurs */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-memoryes-soft rounded-full blur-[100px] opacity-50 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-memoryes-accent rounded-full blur-[100px] opacity-40 translate-x-1/2 translate-y-1/2" />

            <div className="max-w-md w-full relative z-10">
                <AnimatePresence mode="wait">

                    {/* --- MAIN MENU --- */}
                    {gameState === 'MENU' && (
                        <motion.div
                            key="menu"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <div className="w-20 h-20 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center mx-auto mb-6">
                                    <Gamepad2 size={40} className="text-memoryes-primary" />
                                </div>
                                <h1 className="text-4xl font-serif italic">Memory Wheel</h1>
                                <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Spin the history</p>
                            </div>

                            <div className="space-y-3">
                                <MenuButton
                                    icon={<UserIcon size={20} />}
                                    label="Solo Journey"
                                    onClick={() => { setGameMode('SINGLE'); setPlayers(['You']); setGameState('PLAY_SETTINGS'); }}
                                    color="bg-memoryes-soft"
                                />
                                <MenuButton
                                    icon={<Users size={20} />}
                                    label="Family Night"
                                    onClick={() => { setGameMode('LOCAL_MULTI'); setPlayers(['Player 1', 'Player 2']); setGameState('PLAY_SETTINGS'); }}
                                    color="bg-memoryes-mint"
                                />
                                <MenuButton
                                    icon={<Globe size={20} />}
                                    label="Online Vault"
                                    onClick={() => router.push('/games/lucky-wheel/lobbies')}
                                    color="bg-memoryes-accent"
                                />

                                <button
                                    onClick={() => setGameState('LOAD_GAME')}
                                    className="w-full py-4 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-memoryes-primary transition-colors flex items-center justify-center gap-2"
                                >
                                    <CloudDownload size={16} /> Load Saved Progress
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* --- PLAY SETTINGS --- */}
                    {gameState === 'PLAY_SETTINGS' && (
                        <motion.div
                            key="settings"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="bg-white/80 backdrop-blur-xl border border-white p-8 rounded-[3rem] shadow-2xl space-y-6"
                        >
                            <header className="flex justify-between items-center">
                                <button onClick={() => setGameState('MENU')} className="p-2 bg-slate-50 rounded-full text-slate-400"><ChevronLeft size={20} /></button>
                                <h2 className="text-xl font-serif italic">Settings</h2>
                                <div className="w-10" />
                            </header>

                            <div className="space-y-4">
                                <div className="flex justify-between items-end px-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Themes</span>
                                    <button onClick={() => setSelectedThemeIds(themes.map(t => t._id))} className="text-[9px] font-bold text-memoryes-primary uppercase">Select All</button>
                                </div>

                                <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                                    {themes.map((theme) => {
                                        const isSelected = selectedThemeIds.includes(theme._id);
                                        return (
                                            <button
                                                key={theme._id}
                                                onClick={() => handleToggleTheme(theme._id)}
                                                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${isSelected ? 'bg-memoryes-primary text-white border-memoryes-primary shadow-md' : 'bg-slate-50 border-transparent text-slate-400'
                                                    }`}
                                            >
                                                <span className="text-sm font-bold">{theme.title}</span>
                                                <CheckCircle2 size={16} className={isSelected ? 'opacity-100' : 'opacity-0'} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {gameMode === 'LOCAL_MULTI' && (
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Players</span>
                                    <div className="flex gap-2">
                                        <input
                                            value={newPlayerName}
                                            onChange={(e) => setNewPlayerName(e.target.value)}
                                            placeholder="Add name..."
                                            className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 ring-memoryes-soft"
                                        />
                                        <button onClick={() => { if (newPlayerName) setPlayers([...players, newPlayerName]); setNewPlayerName(''); }} className="p-2 bg-memoryes-clay text-white rounded-xl"><Plus size={20} /></button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {players.map((p, i) => (
                                            <div key={i} className="bg-memoryes-soft/30 text-memoryes-primary px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
                                                {p} <Trash2 size={12} className="cursor-pointer" onClick={() => setPlayers(players.filter((_, idx) => idx !== i))} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleStartGame}
                                className="w-full bg-memoryes-clay text-white py-5 rounded-[1.5rem] font-bold shadow-xl shadow-memoryes-clay/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                            >
                                <Sparkles size={20} /> Begin Game
                            </button>
                        </motion.div>
                    )}

                    {/* --- LOAD GAME --- */}
                    {gameState === 'LOAD_GAME' && (
                        <motion.div
                            key="load"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white p-8 rounded-[3rem] shadow-2xl text-center space-y-6"
                        >
                            <h2 className="text-2xl font-serif italic">Enter Vault Code</h2>
                            <p className="text-xs text-slate-400">Enter the 6-digit session code to resume.</p>

                            <input
                                maxLength={6}
                                value={loadCodeInput}
                                onChange={(e) => setLoadCodeInput(e.target.value.replace(/\D/g, ''))}
                                placeholder="000000"
                                className="w-full text-center text-4xl font-mono tracking-[0.3em] py-6 bg-slate-50 rounded-3xl outline-none text-memoryes-clay border-2 border-transparent focus:border-memoryes-soft transition-all"
                            />

                            <div className="flex gap-3">
                                <button onClick={() => setGameState('MENU')} className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold text-slate-400">Back</button>
                                <button
                                    onClick={handleLoadGameSubmit}
                                    disabled={loading}
                                    className="flex-[2] py-4 bg-memoryes-clay text-white rounded-2xl font-bold shadow-lg flex items-center justify-center"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : "Unlock Session"}
                                </button>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

            <div className="mt-12 text-[10px] font-bold text-slate-300 uppercase tracking-[4px]">memoryes Game Engine v1.0.4</div>
        </main>
    );
}

function MenuButton({ icon, label, onClick, color }: any) {
    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="w-full p-6 bg-white rounded-[2.2rem] shadow-sm border border-slate-50 flex items-center gap-6 group hover:shadow-md transition-all"
        >
            <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-memoryes-clay shadow-inner`}>
                {icon}
            </div>
            <span className="text-lg font-bold text-memoryes-clay">{label}</span>
            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronLeft size={20} className="rotate-180 text-slate-300" />
            </div>
        </motion.button>
    );
}