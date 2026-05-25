'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Plus,
    ChevronLeft,
    Copy,
    Check,
    Gamepad2,
    Globe,
    User as UserIcon,
    Loader2,
    LayoutGrid,
    Trophy,
    DoorOpen,
    Lock
} from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';

interface ThemeType {
    _id: string;
    title: string;
    puzzles: string[];
}

interface LobbyType {
    code: string;
    hostName: string;
    maxPlayers: number;
    players: string[];
    themes: string[];
    passcode?: string;
    status: string;
    maxRounds: number;
}

function LobbiesContent() {
    const router = useRouter();
    const [viewState, setViewState] = useState<'BROWSE' | 'CREATE' | 'WAITING_ROOM'>('BROWSE');

    // Data State
    const [themes, setThemes] = useState<ThemeType[]>([]);
    const [selectedThemeIds, setSelectedThemeIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [onlinePlayerName, setOnlinePlayerName] = useState('');
    const [openLobbies, setOpenLobbies] = useState<LobbyType[]>([]);
    const [activeLobby, setActiveLobby] = useState<LobbyType | null>(null);

    // Form State
    const [maxPlayersOnline, setMaxPlayersOnline] = useState<number>(3);
    const [maxRoundsOnline, setMaxRoundsOnline] = useState<number>(3);
    const [lobbyPasscode, setLobbyPasscode] = useState('');
    const [joinCodeInput, setJoinCodeInput] = useState('');
    const [joinPasscodeInput, setJoinPasscodeInput] = useState('');
    const [copied, setCopied] = useState(false);

    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize Identity & Session
    useEffect(() => {
        const savedName = localStorage.getItem('onlinePlayerName');
        if (savedName) {
            setOnlinePlayerName(savedName);
        } else {
            const defaultName = 'Vault_Explorer_' + Math.floor(1000 + Math.random() * 9000);
            setOnlinePlayerName(defaultName);
            localStorage.setItem('onlinePlayerName', defaultName);
        }

        const savedCode = localStorage.getItem('activeLobbyCode');
        if (savedCode) {
            const restoreSession = async () => {
                try {
                    const { data } = await apiClient.get(`/api/lucky-wheel/lobby/${savedCode}/`);
                    if (data && data.data.status === 'waiting' && data.data.players.includes(savedName || '')) {
                        setActiveLobby(data.data);
                        setViewState('WAITING_ROOM');
                        startPollingLobbyStatus(data.data.code);
                    } else {
                        localStorage.removeItem('activeLobbyCode');
                    }
                } catch (e) {
                    localStorage.removeItem('activeLobbyCode');
                }
            };
            restoreSession();
        }
    }, []);

    // Load Themes
    useEffect(() => {
        const fetchThemes = async () => {
            try {
                const { data } = await apiClient.get('/api/lucky-wheel/themes/');
                if (data.data.length > 0) {
                    setThemes(data.data);
                    setSelectedThemeIds([data.data[0]._id]);
                }
            } catch (err) {
                toast.error("Could not load vault themes");
            }
        };
        fetchThemes();
    }, []);

    // Polling for Lobby List
    useEffect(() => {
        if (viewState === 'BROWSE') {
            const fetchList = async () => {
                try {
                    const { data } = await apiClient.get('/api/lucky-wheel/lobby/');
                    setOpenLobbies(data.data);
                } catch (e) { }
            };
            fetchList();
            const interval = setInterval(fetchList, 4000);
            return () => clearInterval(interval);
        }
    }, [viewState]);

    const startPollingLobbyStatus = (code: string) => {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = setInterval(async () => {
            try {
                const { data } = await apiClient.get(`/api/lucky-wheel/lobby/${code}/`);
                setActiveLobby(data.data);
                if (data.data.status === 'active') {
                    clearInterval(pollingIntervalRef.current!);
                    localStorage.removeItem('activeLobbyCode');
                    router.push(`/games/lucky-wheel/game-online?code=${data.data.code}`);
                }
            } catch (err) {
                console.error('Polling error');
            }
        }, 2500);
    };

    // --- START GAME LOGIC (FIXED) ---
    const handleHostStartGame = async () => {
        if (!activeLobby) return;
        setLoading(true);
        const toastId = toast.loading("Initializing vault experience...");

        try {
            // 1. Get themes and filter selected ones
            const themesRes = await apiClient.get('/api/lucky-wheel/themes/');
            const activeThemes = themesRes.data.data.filter((t: any) => activeLobby.themes.includes(t._id));

            // 2. Pool all puzzles
            const puzzlePool: { phrase: string; category: string }[] = [];
            activeThemes.forEach((theme: any) => {
                theme.puzzles.forEach((phrase: string) => {
                    puzzlePool.push({ phrase, category: theme.title });
                });
            });

            if (puzzlePool.length === 0) {
                toast.error('No puzzles found in selected themes.', { id: toastId });
                return;
            }

            // 3. Select first puzzle and init state
            const selectedPuzzle = puzzlePool[Math.floor(Math.random() * puzzlePool.length)];
            const initialScores = activeLobby.players.map(() => 0);

            // 4. PUT request to set lobby as active
            await apiClient.put(`/api/lucky-wheel/lobby/${activeLobby.code}/`, {
                status: 'active',
                phrase: selectedPuzzle.phrase,
                category: selectedPuzzle.category,
                activePlayerIdx: 0,
                revealedLetters: [],
                playerScores: initialScores,
                playerTotalScores: initialScores,
                currentTurnScore: 0,
                currentWheelValue: '',
                turnState: 'idle',
                round: 1
            });

            toast.success("Experience started!", { id: toastId });
            // The polling loop will automatically redirect the host and all players
        } catch (err) {
            console.error(err);
            toast.error('Failed to start game room.', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLobby = async () => {
        if (selectedThemeIds.length === 0) return toast.error("Select at least one theme");
        setLoading(true);
        try {
            const { data } = await apiClient.post('/api/lucky-wheel/lobby/', {
                hostName: onlinePlayerName.trim(),
                maxPlayers: maxPlayersOnline,
                passcode: lobbyPasscode.trim(),
                themes: selectedThemeIds,
                maxRounds: maxRoundsOnline
            });
            localStorage.setItem('activeLobbyCode', data.data.code);
            setActiveLobby(data.data);
            setViewState('WAITING_ROOM');
            startPollingLobbyStatus(data.data.code);
            toast.success("Lobby Created!");
        } catch (err) {
            toast.error("Failed to create room");
        } finally {
            setLoading(false);
        }
    };

    const handleJoinLobby = async (code: string, passcode = '') => {
        setLoading(true);
        try {
            const { data } = await apiClient.post('/api/lucky-wheel/lobby/join/', {
                code: code.toUpperCase(),
                playerName: onlinePlayerName.trim(),
                passcode
            });
            localStorage.setItem('activeLobbyCode', data.data.code);
            setActiveLobby(data.data);
            setViewState('WAITING_ROOM');
            startPollingLobbyStatus(data.data.code);
            toast.success("Connected to Vault");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Connection failed");
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveLobby = async () => {
        if (!activeLobby) return;
        try {
            await apiClient.post('/api/lucky-wheel/lobby/leave/', {
                code: activeLobby.code,
                playerName: onlinePlayerName
            });
        } finally {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            localStorage.removeItem('activeLobbyCode');
            setActiveLobby(null);
            setViewState('BROWSE');
        }
    };

    return (
        <main className="min-h-screen bg-memoryes-background text-memoryes-clay flex flex-col pb-20">
            <header className="px-6 pt-12 pb-6 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-memoryes-soft rounded-xl text-memoryes-primary">
                        <Globe size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-serif italic leading-none">Matchmaking</h1>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Lobby Center</p>
                    </div>
                </div>

                {viewState !== 'WAITING_ROOM' && (
                    <button onClick={() => router.push('/games')} className="p-2 bg-slate-50 rounded-full text-slate-400">
                        <ChevronLeft size={24} />
                    </button>
                )}
            </header>

            <div className="p-4 max-w-2xl mx-auto w-full space-y-6">
                <AnimatePresence mode="wait">

                    {/* VIEW: BROWSE */}
                    {viewState === 'BROWSE' && (
                        <motion.div key="browse" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50 flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-memoryes-soft flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${onlinePlayerName}`} alt="avatar" />
                                </div>
                                <div className="flex-1">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Public Identity</span>
                                    <input
                                        value={onlinePlayerName}
                                        onChange={(e) => {
                                            setOnlinePlayerName(e.target.value);
                                            localStorage.setItem('onlinePlayerName', e.target.value);
                                        }}
                                        className="w-full bg-transparent border-none p-0 font-bold text-memoryes-clay outline-none text-lg"
                                    />
                                </div>
                                <button onClick={() => setViewState('CREATE')} className="w-12 h-12 bg-memoryes-clay text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                                    <Plus size={24} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white p-2 rounded-[1.8rem] shadow-sm flex items-center border border-slate-50">
                                    <input
                                        placeholder="CODE"
                                        value={joinCodeInput}
                                        onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
                                        maxLength={4}
                                        className="flex-1 bg-transparent text-center font-mono font-black tracking-widest text-memoryes-clay outline-none uppercase"
                                    />
                                </div>
                                <button
                                    onClick={() => handleJoinLobby(joinCodeInput)}
                                    className="bg-memoryes-primary text-white font-bold rounded-[1.8rem] shadow-md"
                                >
                                    Quick Join
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4 px-2">
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[3px]">Active Vaults</span>
                                    <div className="h-[1px] flex-1 bg-slate-100" />
                                </div>

                                {openLobbies.length === 0 ? (
                                    <div className="py-20 text-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
                                        <p className="text-sm font-serif italic text-slate-400">The lounge is quiet right now...</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {openLobbies.map((lobby) => (
                                            <motion.div
                                                key={lobby.code}
                                                whileTap={{ scale: 0.98 }}
                                                className="bg-white p-5 rounded-[2rem] border border-slate-50 shadow-sm flex justify-between items-center"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-memoryes-soft flex items-center justify-center text-memoryes-primary">
                                                        <LayoutGrid size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-memoryes-clay flex items-center gap-2">
                                                            {lobby.code}
                                                            {lobby.passcode && <Lock size={12} className="text-rose-400" />}
                                                        </h4>
                                                        <p className="text-[10px] text-slate-400 font-medium">Host: {lobby.hostName}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xs font-black text-memoryes-primary">{lobby.players.length}/{lobby.maxPlayers}</span>
                                                    <button
                                                        onClick={() => handleJoinLobby(lobby.code)}
                                                        className="px-5 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                                                    >
                                                        Enter
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* VIEW: CREATE */}
                    {viewState === 'CREATE' && (
                        <motion.div key="create" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 pb-20">
                            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-50 space-y-8">
                                <h2 className="text-2xl font-serif italic text-memoryes-clay text-center">Configure Vault</h2>
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="flex-1 space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Players</label>
                                            <select
                                                value={maxPlayersOnline}
                                                onChange={e => setMaxPlayersOnline(Number(e.target.value))}
                                                className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm appearance-none border border-transparent focus:border-memoryes-soft"
                                            >
                                                <option value={2}>2 Players</option>
                                                <option value={3}>3 Players</option>
                                                <option value={4}>4 Players</option>
                                            </select>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Rounds</label>
                                            <select
                                                value={maxRoundsOnline}
                                                onChange={e => setMaxRoundsOnline(Number(e.target.value))}
                                                className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm appearance-none border border-transparent focus:border-memoryes-soft"
                                            >
                                                <option value={3}>3 Rounds</option>
                                                <option value={5}>5 Rounds</option>
                                                <option value={7}>7 Rounds</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 text-center block">Security PIN (Optional)</label>
                                        <input
                                            type="password"
                                            placeholder="4 Digit PIN"
                                            maxLength={4}
                                            value={lobbyPasscode}
                                            onChange={e => setLobbyPasscode(e.target.value)}
                                            className="w-full p-4 bg-slate-50 rounded-2xl text-center font-mono tracking-widest outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[3px] px-4 block">Select Vault Themes</span>
                                <div className="grid grid-cols-2 gap-3">
                                    {themes.map((theme) => {
                                        const isSelected = selectedThemeIds.includes(theme._id);
                                        return (
                                            <button
                                                key={theme._id}
                                                onClick={() => {
                                                    if (isSelected) setSelectedThemeIds(selectedThemeIds.filter(id => id !== theme._id));
                                                    else setSelectedThemeIds([...selectedThemeIds, theme._id]);
                                                }}
                                                className={`p-5 rounded-[2rem] text-left border-2 transition-all ${isSelected ? 'bg-white border-memoryes-primary shadow-md' : 'bg-white border-transparent opacity-60'}`}
                                            >
                                                <h5 className="font-bold text-sm text-memoryes-clay">{theme.title}</h5>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{theme.puzzles.length} Puzzles</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setViewState('BROWSE')} className="flex-1 py-5 bg-slate-100 text-slate-400 rounded-3xl font-bold uppercase text-[10px] tracking-widest">Cancel</button>
                                <button
                                    onClick={handleCreateLobby}
                                    disabled={loading}
                                    className="flex-[2] py-5 bg-memoryes-clay text-white rounded-3xl font-bold uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : <Gamepad2 size={16} />}
                                    Initialize Room
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* VIEW: WAITING ROOM */}
                    {viewState === 'WAITING_ROOM' && activeLobby && (
                        <motion.div key="waiting" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 py-10">
                            <div className="text-center space-y-6">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[4px]">Room Access Code</span>
                                    <div
                                        onClick={() => {
                                            navigator.clipboard.writeText(activeLobby.code);
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 2000);
                                            toast.info("Code copied");
                                        }}
                                        className="text-6xl font-serif italic text-memoryes-primary flex items-center justify-center gap-4 cursor-pointer"
                                    >
                                        {activeLobby.code}
                                        {copied ? <Check size={24} className="text-emerald-500" /> : <Copy size={24} className="text-slate-200" />}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-50 space-y-6">
                                <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                                    <div className="flex items-center gap-2">
                                        <Users size={16} className="text-slate-400" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contributors</span>
                                    </div>
                                    <span className="text-xs font-black text-emerald-500">{activeLobby.players.length} / {activeLobby.maxPlayers}</span>
                                </div>

                                <div className="grid gap-3">
                                    {activeLobby.players.map((name, i) => (
                                        <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-black text-xs text-memoryes-primary">
                                                    {name.charAt(0)}
                                                </div>
                                                <span className="text-sm font-bold text-memoryes-clay">{name}</span>
                                            </div>
                                            {name === activeLobby.hostName && (
                                                <span className="text-[8px] font-black bg-memoryes-primary/10 text-memoryes-primary px-2 py-1 rounded-md uppercase">Host</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {activeLobby.hostName === onlinePlayerName ? (
                                    <button
                                        onClick={handleHostStartGame}
                                        disabled={loading || activeLobby.players.length < 2}
                                        className="w-full py-5 bg-memoryes-clay text-white rounded-3xl font-bold uppercase text-[10px] tracking-[4px] shadow-2xl disabled:opacity-30 flex items-center justify-center gap-3"
                                    >
                                        <Trophy size={18} />
                                        {activeLobby.players.length < 2 ? "Waiting for players" : "Start Experience"}
                                    </button>
                                ) : (
                                    <div className="p-6 bg-memoryes-soft/30 rounded-[2rem] text-center space-y-2 border border-memoryes-soft/50">
                                        <Loader2 className="animate-spin mx-auto text-memoryes-primary" size={24} />
                                        <p className="text-xs text-memoryes-primary font-bold uppercase tracking-widest">Awaiting Host...</p>
                                    </div>
                                )}

                                <button onClick={handleLeaveLobby} className="w-full py-4 text-slate-300 font-bold uppercase text-[9px] tracking-widest flex items-center justify-center gap-2">
                                    <DoorOpen size={14} /> Leave Room
                                </button>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </main>
    );
}

export default function LobbiesPage() {
    return (
        <Suspense fallback={<div className="h-screen bg-memoryes-background flex flex-col items-center justify-center"><Loader2 className="animate-spin text-memoryes-primary" size={40} /></div>}>
            <LobbiesContent />
        </Suspense>
    );
}