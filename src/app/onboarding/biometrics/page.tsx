"use client";

import { motion } from "framer-motion";
import { Fingerprint, ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { useRouter } from "next/navigation";

export default function BiometricSetup() {
    const router = useRouter();
    const { setBiometrics } = useOnboardingStore();

    const handleEnable = () => {
        // In the real app, this will trigger:
        // await NativeBiometric.verifyIdentity(...)
        setBiometrics(true);
        router.push("/dashboard");
    };

    return (
        <div className="min-h-screen p-8 flex flex-col items-center justify-between py-20 text-center">
            <div className="space-y-6">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="w-32 h-32 bg-memoria-soft rounded-[3rem] flex items-center justify-center mx-auto shadow-inner"
                >
                    <Fingerprint size={64} className="text-memoria-primary" />
                </motion.div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-serif text-memoria-clay">Keep it private</h1>
                    <p className="text-slate-500 text-sm max-w-[240px] mx-auto">
                        Enable biometrics to ensure your memories are only accessible by you.
                    </p>
                </div>

                <div className="flex flex-col gap-3 pt-6">
                    <div className="flex items-center gap-3 text-left bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <ShieldCheck className="text-emerald-500" size={20} />
                        <span className="text-xs font-medium text-slate-600">Your data is encrypted and never leaves this device.</span>
                    </div>
                    <div className="flex items-center gap-3 text-left bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <Lock className="text-memoria-primary" size={20} />
                        <span className="text-xs font-medium text-slate-600">Locked memories require FaceID or Fingerprint.</span>
                    </div>
                </div>
            </div>

            <div className="w-full space-y-4">
                <Button onClick={handleEnable}>
                    Enable Biometrics
                </Button>
                <button
                    onClick={() => router.push("/dashboard")}
                    className="text-slate-400 text-sm font-medium hover:text-memoria-clay transition-colors"
                >
                    Maybe later
                </button>
            </div>
        </div>
    );
}