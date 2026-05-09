"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { Capacitor } from '@capacitor/core';
import { useNativePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [creds, setCreds] = useState({ email: "", password: "" });

    const { requestAllPermissions } = useNativePermissions();

    useEffect(() => {
        // Only trigger on real devices to avoid browser errors
        if (Capacitor.isNativePlatform()) {
            const askPermissions = async () => {
                console.log("Requesting system permissions...");
                const results = await requestAllPermissions();
                console.log("Permissions status:", results);
            };

            askPermissions();
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await apiClient.post("/api/auth/login/", creds);
            localStorage.setItem("memoryes_token", data.token);
            localStorage.setItem("memoryes_user", JSON.stringify(data.user));
            router.push("/dashboard");
        } catch (err: any) {
            toast.error(JSON.stringify(err.response?.status) || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-memoryes-background p-8 flex flex-col justify-center">
            <div className="mb-12">
                <h1 className="text-4xl font-serif italic text-memoryes-clay">Welcome back</h1>
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
                <button type="submit" disabled={loading} className="w-full bg-memoryes-clay text-white py-4 rounded-[1.5rem] font-bold shadow-lg flex items-center justify-center gap-2 mt-6">
                    {loading ? <Loader2 className="animate-spin" /> : <LogIn size={18} />}
                    {loading ? "Verifying..." : "Unlock Vault"}
                </button>
            </form>

            <p className="text-center mt-12 text-sm text-slate-400">
                New to memoryes? <Link href="/register" className="text-memoryes-primary font-bold">Create a Vault</Link>
            </p>
        </div>
    );
}