"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users, ArrowRight, CheckCircle2, Loader2, ChevronLeft, Heart, User } from "lucide-react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";

type SetupStep = 'choice' | 'type-selection' | 'naming' | 'join';

export default function SetupVaultPage() {
    const router = useRouter();
    const [step, setStep] = useState<SetupStep>('choice');
    const [loading, setLoading] = useState(false);

    // Data for creation
    const [vaultType, setVaultType] = useState<'personal' | 'couple' | 'family'>('personal');
    const [inputValue, setInputValue] = useState("");

    const handleCreate = async () => {
        if (!inputValue) return;
        setLoading(true);
        try {
            await apiClient.post("/api/spaces/create/", {
                name: inputValue,
                type: vaultType
            });
            router.push("/dashboard");
        } catch (err) { toast.error("Failed to create vault"); }
        finally { setLoading(false); }
    };

    const handleJoin = async () => {
        if (!inputValue) return;
        setLoading(true);
        try {
            const storedUser = localStorage.getItem("memoryes_user");
            const user = storedUser ? JSON.parse(storedUser) : null;
            await apiClient.post("/api/spaces/join/", { inviteCode: inputValue, userId: user?.id || user?._id });
            router.push("/dashboard");
        } catch (err) { toast.error("Invalid code. Please check with your family."); }
        finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-memoryes-background p-8 flex flex-col justify-center">
            <AnimatePresence mode="wait">

                {/* STEP 1: INITIAL CHOICE */}
                {step === 'choice' && (
                    <motion.div key="choice" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                        <div className="text-center">
                            <h1 className="text-4xl font-serif italic text-memoryes-clay text-center">Welcome home.</h1>
                            <p className="text-slate-400 mt-2">Every story needs a place to live.</p>
                        </div>
                        <div className="grid gap-4">
                            <ChoiceCard
                                icon={<Plus size={28} />}
                                title="Start a new Vault"
                                desc="Create a fresh space."
                                color="bg-memoryes-primary"
                                onClick={() => setStep('type-selection')}
                            />
                            <ChoiceCard
                                icon={<Users size={28} />}
                                title="Join a Vault"
                                desc="Enter a 6-digit code."
                                color="bg-memoryes-soft"
                                textColor="text-memoryes-clay"
                                onClick={() => setStep('join')}
                            />
                        </div>
                    </motion.div>
                )}

                {/* STEP 2: TYPE SELECTION */}
                {step === 'type-selection' && (
                    <motion.div key="type" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6">
                        <button onClick={() => setStep('choice')} className="flex items-center gap-2 text-slate-300 font-bold text-[10px] uppercase tracking-widest mb-4">
                            <ChevronLeft size={16} /> Back
                        </button>
                        <h2 className="text-3xl font-serif italic text-memoryes-clay">What kind of vault?</h2>
                        <div className="grid gap-3">
                            <TypeOption
                                active={vaultType === 'personal'}
                                onClick={() => { setVaultType('personal'); setStep('naming'); }}
                                icon={<User size={20} />} title="Personal" desc="Private memories just for you."
                            />
                            <TypeOption
                                active={vaultType === 'couple'}
                                onClick={() => { setVaultType('couple'); setStep('naming'); }}
                                icon={<Heart size={20} />} title="Couple" desc="Shared space for two."
                            />
                            <TypeOption
                                active={vaultType === 'family'}
                                onClick={() => { setVaultType('family'); setStep('naming'); }}
                                icon={<Users size={20} />} title="Family" desc="For the whole inner circle."
                            />
                        </div>
                    </motion.div>
                )}

                {/* STEP 3: NAMING OR JOINING */}
                {(step === 'naming' || step === 'join') && (
                    <motion.div key="input" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <button onClick={() => setStep(step === 'naming' ? 'type-selection' : 'choice')} className="flex items-center gap-2 text-slate-300 font-bold text-[10px] uppercase tracking-widest mb-4">
                            <ChevronLeft size={16} /> Back
                        </button>

                        <div>
                            <h2 className="text-3xl font-serif italic text-memoryes-clay">
                                {step === 'naming' ? "Name your space" : "Enter Invite Code"}
                            </h2>
                            <p className="text-slate-400 mt-1">
                                {step === 'naming' ? `Setting up your ${vaultType} vault.` : "The 6-digit code from your family."}
                            </p>
                        </div>

                        <input
                            autoFocus
                            className="w-full bg-white border-b-2 border-slate-100 py-6 text-2xl font-serif italic outline-none focus:border-memoryes-primary transition-colors text-memoryes-clay"
                            placeholder={step === 'naming' ? "e.g. Summer 2024" : "e.g. AB1234"}
                            value={inputValue}
                            onChange={(e) => setInputValue(step === 'join' ? e.target.value.toUpperCase() : e.target.value)}
                        />

                        <button
                            onClick={step === 'naming' ? handleCreate : handleJoin}
                            disabled={loading || !inputValue}
                            className="w-full bg-memoryes-clay text-white py-5 rounded-[2rem] font-bold shadow-xl flex items-center justify-center gap-3 disabled:opacity-30 transition-all"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />}
                            {step === 'naming' ? "Initialize Vault" : "Join the Vault"}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function ChoiceCard({ icon, title, desc, color, textColor = "text-white", onClick }: any) {
    return (
        <button onClick={onClick} className={`${color} ${textColor} p-8 rounded-[3rem] text-left shadow-lg active:scale-95 transition-all flex items-center gap-6`}>
            <div className="bg-white/20 p-4 rounded-[1.5rem]">{icon}</div>
            <div>
                <h3 className="font-bold text-xl">{title}</h3>
                <p className="text-xs opacity-70">{desc}</p>
            </div>
        </button>
    );
}

function TypeOption({ active, onClick, icon, title, desc }: any) {
    return (
        <button onClick={onClick} className={`flex items-center gap-5 p-5 rounded-[2rem] border-2 transition-all ${active ? 'bg-white border-memoryes-primary shadow-md' : 'bg-white border-slate-50 opacity-60'}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${active ? 'bg-memoryes-soft text-memoryes-primary' : 'bg-slate-50 text-slate-400'}`}>{icon}</div>
            <div className="text-left">
                <p className="text-md font-bold text-memoryes-clay">{title}</p>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{desc}</p>
            </div>
        </button>
    );
}