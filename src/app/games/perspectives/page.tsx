"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    Quote,
    User,
    ImageIcon,
    CheckCircle2,
    XCircle,
    Trophy,
    Loader2,
    ArrowRight,
    Sparkles,
    Camera
} from "lucide-react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";

interface Question {
    text: string;
    correctAuthor: string;
    correctMemoryId: string;
    correctImageUrl: string;
    authorOptions: string[];
    memoryOptions: { id: string; url: string }[];
}

export default function EchoChallenge() {
    const router = useRouter();

    // Game States
    const [gameState, setGameState] = useState<'loading' | 'intro' | 'who' | 'moment' | 'result' | 'complete'>('loading');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);

    // User Selections
    const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
    const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);

    useEffect(() => {
        const initGame = async () => {
            try {
                const { data: user } = await apiClient.get('/api/auth/me/');
                const { data: mems } = await apiClient.get(`/api/memories/?spaceId=${user.activeSpace}`);

                const validMems = mems.filter((m: any) => m.perspectives?.length > 0 && m.media?.length > 0);

                if (validMems.length < 4) {
                    toast.error("You need at least 4 memories with thoughts to play!");
                    router.back();
                    return;
                }

                const allAuthors = Array.from(new Set(mems.flatMap((m: any) => m.perspectives.map((p: any) => p.userName)))) as string[];

                const generated: Question[] = validMems
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 5)
                    .map((m: any) => {
                        const randomP = m.perspectives[Math.floor(Math.random() * m.perspectives.length)];

                        // Get distractors for photos
                        const otherMems = validMems.filter((om: any) => om._id !== m._id);
                        const shuffledOthers = otherMems.sort(() => 0.5 - Math.random()).slice(0, 3);

                        const memoryOptions = [
                            { id: m._id, url: m.media[0].url },
                            ...shuffledOthers.map((som: any) => ({ id: som._id, url: som.media[0].url }))
                        ].sort(() => 0.5 - Math.random());

                        return {
                            text: randomP.content,
                            correctAuthor: randomP.userName,
                            correctMemoryId: m._id,
                            correctImageUrl: m.media[0].url,
                            authorOptions: [randomP.userName, ...allAuthors.filter(a => a !== randomP.userName).sort(() => 0.5 - Math.random()).slice(0, 2)].sort(() => 0.5 - Math.random()),
                            memoryOptions
                        };
                    });

                setQuestions(generated);
                setGameState('intro');
            } catch (e) {
                toast.error("Vault offline. Try again.");
            }
        };
        initGame();
    }, [router]);

    const handleNext = () => {
        if (gameState === 'who') setGameState('moment');
        else if (gameState === 'moment') {
            const q = questions[currentIndex];
            let points = 0;
            if (selectedAuthor === q.correctAuthor) points += 500;
            if (selectedMemoryId === q.correctMemoryId) points += 500;
            setScore(s => s + points);
            setGameState('result');
        }
    };

    const nextRound = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedAuthor(null);
            setSelectedMemoryId(null);
            setGameState('who');
        } else {
            setGameState('complete');
        }
    };

    if (gameState === 'loading') return (
        <div className="h-screen bg-memoryes-background flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-memoryes-primary" size={40} />
            <p className="text-[10px] font-black uppercase tracking-[4px] mt-4 text-slate-400">Filtering Echoes...</p>
        </div>
    );

    const currentQ = questions[currentIndex];

    return (
        <div className="min-h-screen bg-memoryes-background text-memoryes-clay flex flex-col overflow-x-hidden">

            {/* Header HUD */}
            <header className="p-6 pt-12 flex justify-between items-center z-50">
                <button onClick={() => router.back()} className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 active:scale-90 transition-transform">
                    <ChevronLeft size={24} />
                </button>
                <div className="bg-white/80 backdrop-blur-md border border-slate-100 px-5 py-2 rounded-full shadow-sm flex items-center gap-4">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Vault Score</span>
                    <span className="text-sm font-bold text-memoryes-primary">{score}</span>
                </div>
            </header>

            <main className="flex-1 px-6 pb-20 flex flex-col">
                <AnimatePresence mode="wait">

                    {/* 1. INTRO VIEW */}
                    {gameState === 'intro' && (
                        <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col justify-center items-center text-center space-y-8">
                            <div className="relative">
                                <div className="w-24 h-24 bg-memoryes-soft rounded-[3rem] flex items-center justify-center shadow-xl">
                                    <Sparkles size={48} className="text-memoryes-primary" />
                                </div>
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute -inset-4 border border-dashed border-memoryes-primary/20 rounded-full" />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-4xl font-serif italic">The Echo Challenge</h1>
                                <p className="text-slate-400 text-sm max-w-[250px] mx-auto">Can you link the family's feelings to the moments they shared?</p>
                            </div>
                            <button onClick={() => setGameState('who')} className="w-full py-5 bg-memoryes-clay text-white rounded-[2rem] font-bold shadow-xl flex items-center justify-center gap-3">
                                Enter the Vault <ArrowRight size={20} />
                            </button>
                        </motion.div>
                    )}

                    {/* 2. GAMEPLAY: WHO & MOMENT */}
                    {(gameState === 'who' || gameState === 'moment') && (
                        <motion.div key="gameplay" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col pt-4">

                            {/* The Perspective Quote */}
                            <div className="bg-white p-8 rounded-[3.5rem] shadow-xl border border-slate-50 relative mb-10 min-h-[180px] flex items-center justify-center">
                                <Quote className="absolute top-6 left-6 text-memoryes-soft opacity-40" size={40} />
                                <p className="text-xl font-serif italic text-slate-700 leading-relaxed text-center relative z-10">
                                    "{currentQ.text}"
                                </p>
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-memoryes-clay text-white text-[8px] font-black uppercase px-4 py-1.5 rounded-full tracking-[2px] shadow-lg">
                                    Round {currentIndex + 1}/5
                                </div>
                            </div>

                            <div className="space-y-6 flex-1">
                                <h3 className="text-center text-[10px] font-black uppercase tracking-[4px] text-slate-300">
                                    {gameState === 'who' ? "Who felt this way?" : "Which memory is this?"}
                                </h3>

                                {gameState === 'who' ? (
                                    <div className="grid grid-cols-1 gap-3">
                                        {currentQ.authorOptions.map((name) => (
                                            <button
                                                key={name}
                                                onClick={() => setSelectedAuthor(name)}
                                                className={`p-5 rounded-[2rem] border-2 transition-all flex items-center gap-4 ${selectedAuthor === name ? 'bg-memoryes-primary text-white border-memoryes-primary shadow-lg' : 'bg-white border-transparent text-slate-400'
                                                    }`}
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedAuthor === name ? 'bg-white/20' : 'bg-slate-50'}`}>
                                                    <User size={18} />
                                                </div>
                                                <span className="font-bold text-sm">{name}</span>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        {currentQ.memoryOptions.map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setSelectedMemoryId(opt.id)}
                                                className={`relative aspect-[4/5] rounded-[2rem] overflow-hidden border-4 transition-all ${selectedMemoryId === opt.id ? 'border-memoryes-primary scale-95 shadow-inner' : 'border-white shadow-md'
                                                    }`}
                                            >
                                                <img src={opt.url} className="w-full h-full object-cover" alt="Option" />
                                                {selectedMemoryId === opt.id && (
                                                    <div className="absolute inset-0 bg-memoryes-primary/20 flex items-center justify-center">
                                                        <CheckCircle2 className="text-white" size={32} />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleNext}
                                disabled={gameState === 'who' ? !selectedAuthor : !selectedMemoryId}
                                className="mt-8 w-full py-5 bg-memoryes-clay text-white rounded-[2.2rem] font-bold shadow-2xl flex items-center justify-center gap-3 disabled:opacity-30 transition-all"
                            >
                                {gameState === 'who' ? "Identify Moment" : "Confirm Recall"}
                                <ArrowRight size={20} />
                            </button>
                        </motion.div>
                    )}

                    {/* 3. ROUND RESULT */}
                    {gameState === 'result' && (
                        <motion.div key="result" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex-1 flex flex-col justify-center items-center text-center space-y-10">
                            <div className="relative w-48 h-64 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white">
                                <img src={currentQ.correctImageUrl} className="w-full h-full object-cover" alt="Correct" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-4 left-0 right-0">
                                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Shared By</p>
                                    <p className="text-white font-bold">{currentQ.correctAuthor}</p>
                                </div>
                            </div>

                            <div className="flex gap-6">
                                <ResultIndicator correct={selectedAuthor === currentQ.correctAuthor} label="Soul" />
                                <ResultIndicator correct={selectedMemoryId === currentQ.correctMemoryId} label="Moment" />
                            </div>

                            <button onClick={nextRound} className="w-full py-5 bg-memoryes-clay text-white rounded-[2rem] font-bold shadow-xl active:scale-95 transition-all">
                                Next Echo
                            </button>
                        </motion.div>
                    )}

                    {/* 4. FINAL COMPLETION */}
                    {gameState === 'complete' && (
                        <motion.div key="complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col justify-center items-center text-center space-y-8">
                            <div className="w-24 h-24 bg-memoryes-mint rounded-[3rem] flex items-center justify-center shadow-xl border-4 border-white">
                                <Trophy size={48} className="text-emerald-600" />
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-4xl font-serif italic text-memoryes-clay">Vault Link Secured</h1>
                                <p className="text-slate-400 text-sm font-medium">Your historical sync score</p>
                                <div className="text-6xl font-black text-memoryes-primary pt-4">{score}</div>
                            </div>
                            <div className="w-full space-y-3 pt-6">
                                <button onClick={() => window.location.reload()} className="w-full py-5 bg-memoryes-clay text-white rounded-[2rem] font-bold shadow-xl">New Session</button>
                                <button onClick={() => router.push('/games')} className="w-full py-4 text-slate-300 font-bold uppercase text-[10px] tracking-widest">Exit Lounge</button>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>
        </div>
    );
}

function ResultIndicator({ correct, label }: any) {
    return (
        <div className="flex flex-col items-center gap-3">
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center border-4 ${correct ? 'bg-emerald-50 border-emerald-500 text-emerald-500' : 'bg-rose-50 border-rose-500 text-rose-500'}`}>
                {correct ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
            </div>
            <span className="text-[10px] font-black uppercase text-slate-300 tracking-[3px]">{label}</span>
        </div>
    );
}