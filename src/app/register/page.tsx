"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, Users, Heart, ArrowRight, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: "", email: "", password: "", mode: "personal", inviteCode: ""
    });

    const handleRegister = async () => {
        setLoading(true);
        try {
            // Clear any existing session first
            localStorage.removeItem("memoria_token");
            localStorage.removeItem("memoria_user");

            const { data } = await apiClient.post("/api/auth/register", formData);

            // Save new credentials
            localStorage.setItem("memoria_token", data.token);
            localStorage.setItem("memoria_user", JSON.stringify(data.user));

            // Force a small delay to ensure storage is committed in hybrid environments
            setTimeout(() => {
                router.push("/dashboard");
            }, 100);
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Registration failed. Try again.";
            alert(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-memoria-background p-8 flex flex-col justify-center">
            {/* ... (Previous Header UI remains the same) ... */}
            <div className="mb-12 text-center">
                <div className="w-16 h-16 bg-memoria-soft rounded-3xl flex items-center justify-center mx-auto mb-4 text-memoria-primary shadow-sm">
                    <Sparkles size={32} />
                </div>
                <h1 className="text-3xl font-serif italic text-memoria-clay">Begin your journey</h1>
                <p className="text-slate-400 text-sm mt-2">Create your digital memory vault.</p>
            </div>

            <AnimatePresence mode="wait">
                {step === 1 ? (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Full Name</label>
                            <div className="flex items-center bg-white border border-slate-100 rounded-[1.5rem] px-4 py-3 shadow-sm">
                                <User size={18} className="text-slate-300 mr-3" />
                                <input type="text" placeholder="Alex" className="bg-transparent outline-none text-sm w-full" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Email</label>
                            <div className="flex items-center bg-white border border-slate-100 rounded-[1.5rem] px-4 py-3 shadow-sm">
                                <Mail size={18} className="text-slate-300 mr-3" />
                                <input type="email" placeholder="alex@memoria.com" className="bg-transparent outline-none text-sm w-full" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Password</label>
                            <div className="flex items-center bg-white border border-slate-100 rounded-[1.5rem] px-4 py-3 shadow-sm">
                                <Lock size={18} className="text-slate-300 mr-3" />
                                <input type="password" placeholder="••••••••" className="bg-transparent outline-none text-sm w-full" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                        </div>
                        <button onClick={() => setStep(2)} className="w-full bg-memoria-clay text-white py-4 rounded-[1.5rem] font-bold mt-4 shadow-lg flex items-center justify-center gap-2">
                            Select Vault Type <ArrowRight size={18} />
                        </button>
                    </motion.div>
                ) : (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <div className="grid grid-cols-1 gap-3">
                            <ModeBtn active={formData.mode === 'personal'} onClick={() => setFormData({ ...formData, mode: 'personal', inviteCode: '' })} icon={<User size={18} />} title="Personal" desc="Just for me" />
                            <ModeBtn active={formData.mode === 'couple'} onClick={() => setFormData({ ...formData, mode: 'couple' })} icon={<Heart size={18} />} title="Couple" desc="Shared with partner" />
                            <ModeBtn active={formData.mode === 'family'} onClick={() => setFormData({ ...formData, mode: 'family' })} icon={<Users size={18} />} title="Family" desc="The whole family" />
                        </div>

                        {formData.mode !== 'personal' && (
                            <div className="pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Joining an existing vault?</label>
                                <input placeholder="Enter 6-digit code" className="w-full mt-2 bg-white border border-slate-100 rounded-2xl px-4 py-3 text-center font-mono font-bold tracking-[0.3em] outline-none" value={formData.inviteCode} onChange={e => setFormData({ ...formData, inviteCode: e.target.value.toUpperCase() })} />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button onClick={() => setStep(1)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-[1.5rem] font-bold">Back</button>
                            <button onClick={handleRegister} disabled={loading} className="flex-[2] bg-memoria-clay text-white py-4 rounded-[1.5rem] font-bold shadow-lg flex items-center justify-center gap-2">
                                {loading ? <Loader2 className="animate-spin" /> : "Complete Setup"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <p className="text-center mt-8 text-sm text-slate-400">
                Already have a vault? <Link href="/login" className="text-memoria-primary font-bold">Login</Link>
            </p>
        </div>
    );
}

function ModeBtn({ active, onClick, icon, title, desc }: any) {
    return (
        <button onClick={onClick} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${active ? 'bg-white border-memoria-primary shadow-md' : 'bg-white border-slate-50 opacity-60'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-memoria-soft text-memoria-primary' : 'bg-slate-50 text-slate-400'}`}>{icon}</div>
            <div className="text-left">
                <p className="text-sm font-bold text-memoria-clay">{title}</p>
                <p className="text-[10px] text-slate-400">{desc}</p>
            </div>
        </button>
    );
}