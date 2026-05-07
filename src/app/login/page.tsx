"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [creds, setCreds] = useState({ email: "", password: "" });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await apiClient.post("/api/auth/login/", creds);
            localStorage.setItem("memoria_token", data.token);
            localStorage.setItem("memoria_user", JSON.stringify(data.user));
            router.push("/dashboard");
        } catch (err: any) {
            alert("Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-memoria-background p-8 flex flex-col justify-center">
            <div className="mb-12">
                <h1 className="text-4xl font-serif italic text-memoria-clay">Welcome back</h1>
                <p className="text-slate-400 text-sm mt-2">Your memories are waiting.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Email Address</label>
                    <div className="flex items-center bg-white border border-slate-100 rounded-[1.5rem] px-5 py-4 shadow-sm">
                        <Mail size={18} className="text-slate-300 mr-3" />
                        <input type="email" placeholder="name@example.com" className="bg-transparent outline-none text-sm w-full" value={creds.email} onChange={e => setCreds({ ...creds, email: e.target.value })} />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Password</label>
                    <div className="flex items-center bg-white border border-slate-100 rounded-[1.5rem] px-5 py-4 shadow-sm">
                        <Lock size={18} className="text-slate-300 mr-3" />
                        <input type="password" placeholder="••••••••" className="bg-transparent outline-none text-sm w-full" value={creds.password} onChange={e => setCreds({ ...creds, password: e.target.value })} />
                    </div>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-memoria-clay text-white py-4 rounded-[1.5rem] font-bold shadow-lg flex items-center justify-center gap-2 mt-6">
                    {loading ? <Loader2 className="animate-spin" /> : <LogIn size={18} />}
                    {loading ? "Verifying..." : "Unlock Vault"}
                </button>
            </form>

            <p className="text-center mt-12 text-sm text-slate-400">
                New to Memoria? <Link href="/register" className="text-memoria-primary font-bold">Create a Vault</Link>
            </p>
        </div>
    );
}