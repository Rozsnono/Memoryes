"use client";

import { motion } from "framer-motion";
import {
    Gamepad2,
    Trophy,
    Users,
    Dices,
    Brain,
    HeartHandshake,
    Sparkles,
    ChevronRight,
    Lock,
    FerrisWheel
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/ui/Navbar";

// Define the game structure for easy future expansion
const GAMES = [
    {
        id: "memory-match",
        title: "Memory Match",
        desc: "Pair up your vault's photos in a race against time.",
        icon: Brain,
        color: "bg-memoryes-primary",
        status: "Ready",
        path: "/games/memory-match"
    },
    {
        id: "truth-or-dare",
        title: "Family Truths",
        desc: "Deep questions to spark meaningful conversations.",
        icon: HeartHandshake,
        color: "bg-memoryes-accent",
        status: "Comming soon!",
        path: "/games/family-truths"
    },
    {
        id: "luckywheel",
        title: "Lucky Wheel",
        desc: "Guess the random puzzle.",
        icon: FerrisWheel,
        color: "bg-memoryes-accent",
        status: "Ready",
        path: "/games/lucky-wheel"
    }
];

export default function GamesPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-memoryes-background">
            {/* 1. HEADER */}
            <header className="p-8 pt-20">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h1 className="text-4xl font-serif italic text-memoryes-clay">Lounge</h1>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[4px] mt-2">
                            Play & Connect
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-slate-50">
                        <Trophy className="text-memoryes-primary" size={24} />
                    </div>
                </div>
            </header>

            {/* 2. GAME GRID */}
            <main className="px-6 space-y-4">
                {GAMES.map((game, idx) => (
                    <motion.div
                        key={game.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => game.status === "Ready" && router.push(game.path)}
                        className={`relative p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer flex items-center gap-6 ${game.status === "Ready"
                                ? "bg-white border-white shadow-sm active:scale-[0.98] active:shadow-inner"
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
                                <h3 className="font-bold text-memoryes-clay text-lg">{game.title}</h3>
                                {game.status === "Coming Soon" && (
                                    <span className="bg-slate-200 text-slate-500 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                                        Soon
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed max-w-[200px]">
                                {game.desc}
                            </p>
                        </div>

                        {/* Action Icon */}
                        <div className="text-slate-200">
                            {game.status === "Ready" ? <ChevronRight size={20} /> : <Lock size={16} />}
                        </div>

                        {/* Decoration Background */}
                        {game.status === "Ready" && (
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-transparent to-slate-50/50 rounded-bl-full pointer-events-none" />
                        )}
                    </motion.div>
                ))}

                {/* 3. PROMO SECTION */}
                <div className="mt-8 bg-memoryes-clay p-8 rounded-[3rem] text-center relative overflow-hidden">
                    <Sparkles className="absolute top-4 left-4 text-white/10" size={60} />
                    <h4 className="text-white font-serif italic text-xl relative z-10">Compete with Family</h4>
                    <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mt-2 relative z-10">
                        Monthly Leaderboard resets in 4 days
                    </p>
                    <button className="mt-6 bg-white text-memoryes-clay px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                        View Standings
                    </button>
                </div>
            </main>

            <Navbar />
        </div>
    );
}