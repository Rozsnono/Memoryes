"use client";

import { useState } from "react";
import { User, Mail, Lock, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: "", email: "", password: "" });

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await apiClient.post("/api/auth/register/", formData);
            localStorage.setItem("memoryes_token", data.token);
            localStorage.setItem("memoryes_user", JSON.stringify(data.user));

            // Navigate to the Setup Vault screen instead of Dashboard
            router.push("/setup-space");
        } catch (err: any) {
            alert(err.response?.data?.error || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-memoryes-background p-8 flex flex-col justify-center">
            <div className="mb-12 text-center">
                <div className="w-16 h-16 bg-memoryes-soft rounded-[2rem] flex items-center justify-center mx-auto mb-4 text-memoryes-primary shadow-sm">
                    <Sparkles size={32} />
                </div>
                <h1 className="text-3xl font-serif italic text-memoryes-clay">Create Account</h1>
                <p className="text-slate-400 text-sm mt-2">The first step to your digital legacy.</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Full Name</label>
                    <div className="flex items-center bg-white border border-slate-100 rounded-[1.5rem] px-4 py-3 shadow-sm">
                        <User size={18} className="text-slate-300 mr-3" />
                        <input required type="text" placeholder="Alex" className="bg-transparent outline-none text-sm w-full" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Email</label>
                    <div className="flex items-center bg-white border border-slate-100 rounded-[1.5rem] px-4 py-3 shadow-sm">
                        <Mail size={18} className="text-slate-300 mr-3" />
                        <input required type="email" placeholder="alex@memoryes.com" className="bg-transparent outline-none text-sm w-full" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Password</label>
                    <div className="flex items-center bg-white border border-slate-100 rounded-[1.5rem] px-4 py-3 shadow-sm">
                        <Lock size={18} className="text-slate-300 mr-3" />
                        <input required type="password" placeholder="••••••••" className="bg-transparent outline-none text-sm w-full" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                    </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-memoryes-clay text-white py-4 rounded-[1.5rem] font-bold mt-4 shadow-lg flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="animate-spin" /> : "Sign Up"} <ArrowRight size={18} />
                </button>
            </form>
        </div>
    );
}