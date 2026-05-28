"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Gamepad2,
    Trophy,
    Brain,
    HeartHandshake,
    ChevronRight,
    Lock,
    FerrisWheel,
    Grid,
    MapPin,
    MessageCircleIcon,
    Loader2,
    Sparkles,
    CircleDot,
    UserPen,
    PictureInPicture,
    LineChart
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/ui/Navbar";
import apiClient from "@/lib/apiClient";

const GAMES = [
    {
        id: "memory-match",
        title: "Memory Match",
        desc: "Pair up your vault's photos in a race against time.",
        icon: Brain,
        color: "bg-memoryes-primary",
        status: "Ready",
        path: "/games/memory-match",
        isMultiplayer: false
    },
    {
        id: "luckywheel",
        title: "Lucky Wheel",
        desc: "Guess the random puzzle.",
        icon: FerrisWheel,
        color: "bg-memoryes-accent",
        status: "Ready",
        path: "/games/lucky-wheel",
        isMultiplayer: true
    },
    {
        id: "sliding-puzzle",
        title: "Sliding Puzzle",
        desc: "Rearrange the pieces to reveal a hidden memory.",
        icon: Grid,
        color: "bg-memoryes-secondary",
        status: "Ready",
        path: "/games/sliding-puzzle",
        isMultiplayer: false
    },
    {
        id: "geoguessr",
        title: "GeoGuessr",
        desc: "Guess the location of your vault's memories.",
        icon: MapPin,
        color: "bg-memoryes-primary",
        status: "Ready",
        path: "/games/geoguessr",
        isMultiplayer: false
    },
    {
        id: "perspectives",
        title: "Echo Challenge",
        desc: "Can you link the family's feelings to the moments they shared?",
        icon: MessageCircleIcon,
        color: "bg-memoryes-accent",
        status: "Ready",
        path: "/games/echo-challenge",
        isMultiplayer: false
    },
    {
        id: "hangman",
        title: "Hangman",
        desc: "Create a hidden phrase for your family to solve.",
        icon: UserPen,
        color: "bg-memoryes-secondary",
        status: "Ready",
        path: "/games/hangman",
        isMultiplayer: true
    },
    {
        id: "fragment-recall",
        title: "Fragment Recall",
        desc: "Test your memory by recalling fragments of your vault's photos.",
        icon: PictureInPicture,
        color: "bg-memoryes-primary",
        status: "Ready",
        path: "/games/fragment-recall",
        isMultiplayer: false
    },
    {
        id: "timeline-sync",
        title: "Timeline Sync",
        desc: "Synchronize your family's memories in real-time.",
        icon: LineChart,
        color: "bg-memoryes-accent",
        status: "Ready",
        path: "/games/timeliner",
        isMultiplayer: true
    },
    {
        id: "chess",
        title: "Chess",
        desc: "Challenge your family to a strategic game of chess.",
        icon: Gamepad2,
        color: "bg-memoryes-secondary",
        status: "Ready",
        path: "/games/chess",
        isMultiplayer: true
    },
    {
        id: "truth-or-dare",
        title: "Family Truths",
        desc: "Deep questions to spark meaningful conversations.",
        icon: HeartHandshake,
        color: "bg-memoryes-accent",
        status: "Coming soon!",
        path: "/games/family-truths"
    },
];

export default function GamesPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [activeChallenges, setActiveChallenges] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initLounge = async () => {
            try {
                // 1. Get user context
                const { data: userData } = await apiClient.get('/api/auth/me/');
                setUser(userData);

                // 2. Fetch active family challenges (Hangman/Secret Echo)
                // Ensure this API endpoint exists from the previous steps
                const { data: games } = await apiClient.get(`/api/games/hangman/active/?spaceId=${userData.activeSpace}`);

                const { data: timelineGames } = await apiClient.get(`/api/games/timeline/active/?spaceId=${userData.activeSpace}`);

                const { data: chessGames } = await apiClient.get(`/api/games/chess/active/?spaceId=${userData.activeSpace}`);

                const allActiveGames = [...games.map((game: any) => ({ ...game, title: game.category, click: () => router.push(`/games/hangman?id=${game._id}`) })),
                ...timelineGames.map((game: any) => ({ ...game, title: 'Timeline Sync', click: () => router.push(`/games/timeliner?id=${game._id}`) })),
                ...chessGames.map((game: any) => ({ ...game, title: 'Chess', click: () => router.push(`/games/chess?id=${game._id}`) }))];
                setActiveChallenges(allActiveGames);
            } catch (err) {
                console.error("Lounge synchronization failed", err);
            } finally {
                setLoading(false);
            }
        };
        initLounge();
    }, []);

    return (
        <div className="min-h-screen bg-memoryes-background pb-40">
            {/* 1. HEADER */}
            <header className="p-8 pt-20">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h1 className="text-4xl font-serif italic text-memoryes-clay leading-tight">Games</h1>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[4px] mt-2">
                            Connect through Play
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-slate-50">
                        <Trophy className="text-memoryes-primary" size={24} />
                    </div>
                </div>
            </header>

            <main className="px-6 space-y-10">

                {/* 2. LIVE CHALLENGES SECTION */}
                <section className="no-scrollbar">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-memoryes-primary" />
                            <span className="text-[10px] font-black text-memoryes-primary uppercase tracking-[3px]">Family Challenges</span>
                        </div>
                        {activeChallenges.length > 0 && (
                            <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-full">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                                <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">Active</span>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="h-36 bg-white/50 rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-slate-100">
                            <Loader2 className="animate-spin text-memoryes-primary/30" size={24} />
                        </div>
                    ) : activeChallenges.length > 0 ? (
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
                            {activeChallenges.map((game, idx) => (
                                <motion.div
                                    key={game._id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    onClick={game.click}
                                    className="min-w-[260px] bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50 relative overflow-hidden active:scale-95 transition-transform"
                                >
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-memoryes-primary/5 rounded-bl-full pointer-events-none" />
                                    <p className="text-[9px] font-black text-memoryes-primary uppercase mb-2 flex items-center gap-2">
                                        <CircleDot size={10} />
                                        {game.creatorId === user?._id ? "Your Secret Echo" : `${game.creatorName}'s Challenge`}
                                    </p>
                                    <h4 className="text-lg font-serif italic text-memoryes-clay truncate mb-4">
                                        "{game.title}"
                                    </h4>
                                    <div className="flex items-center justify-between">
                                        <div className="flex -space-x-2">
                                            <div className="w-7 h-7 rounded-full bg-memoryes-soft border-2 border-white flex items-center justify-center text-[10px] font-bold text-memoryes-primary">
                                                {game.creatorName.charAt(0)}
                                            </div>
                                            <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400 italic">
                                                ?
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-1">
                                            {game.creatorId === user?._id ? "View Status" : "Solve This"} <ChevronRight size={14} />
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-10 text-center bg-white/40 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                            <p className="text-sm font-serif italic text-slate-300">No active echoes. Start a challenge below!</p>
                        </div>
                    )}
                </section>

                {/* 3. GAME COLLECTION */}
                <section className="space-y-4">
                    <div className="px-2">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[3px]">Family games</span>
                    </div>

                    {GAMES.filter(f => f.isMultiplayer).map((game, idx) => (
                        <motion.div
                            key={game.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + (idx * 0.05) }}
                            onClick={() => game.status === "Ready" && router.push(game.path)}
                            className={`relative p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer flex items-center gap-6 ${game.status === "Ready"
                                ? "bg-white border-white shadow-sm active:scale-[0.98]"
                                : "bg-slate-50/50 border-transparent opacity-60 grayscale cursor-not-allowed"
                                }`}
                        >
                            {/* Icon Container */}
                            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg ${game.color} text-white`}>
                                <game.icon size={32} />
                            </div>

                            {/* Text Content */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-memoryes-clay text-lg leading-none">{game.title}</h3>
                                    {game.status !== "Ready" && (
                                        <span className="bg-slate-200 text-slate-500 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                                            Soon
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed max-w-[180px]">
                                    {game.desc}
                                </p>
                            </div>

                            {/* Action Icon */}
                            <div className="text-slate-200">
                                {game.status === "Ready" ? <ChevronRight size={20} /> : <Lock size={16} />}
                            </div>

                            {/* Decoration Background */}
                            {game.status === "Ready" && (
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-transparent to-slate-50/20 rounded-bl-full pointer-events-none" />
                            )}
                        </motion.div>
                    ))}

                    <div className="px-2">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[3px]">Local games</span>
                    </div>

                    {GAMES.filter(f => !f.isMultiplayer).map((game, idx) => (
                        <motion.div
                            key={game.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + (idx * 0.05) }}
                            onClick={() => game.status === "Ready" && router.push(game.path)}
                            className={`relative p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer flex items-center gap-6 ${game.status === "Ready"
                                ? "bg-white border-white shadow-sm active:scale-[0.98]"
                                : "bg-slate-50/50 border-transparent opacity-60 grayscale cursor-not-allowed"
                                }`}
                        >
                            {/* Icon Container */}
                            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg ${game.color} text-white`}>
                                <game.icon size={32} />
                            </div>

                            {/* Text Content */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-memoryes-clay text-lg leading-none">{game.title}</h3>
                                    {game.status !== "Ready" && (
                                        <span className="bg-slate-200 text-slate-500 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                                            Soon
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed max-w-[180px]">
                                    {game.desc}
                                </p>
                            </div>

                            {/* Action Icon */}
                            <div className="text-slate-200">
                                {game.status === "Ready" ? <ChevronRight size={20} /> : <Lock size={16} />}
                            </div>

                            {/* Decoration Background */}
                            {game.status === "Ready" && (
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-transparent to-slate-50/20 rounded-bl-full pointer-events-none" />
                            )}
                        </motion.div>
                    ))}
                </section>
            </main>

            <Navbar />
        </div>
    );
}