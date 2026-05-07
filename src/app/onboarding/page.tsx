"use client";

import { motion } from "framer-motion";
import { User, Heart, Users, CheckCircle2 } from "lucide-react";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

const modes = [
    {
        id: 'personal',
        title: 'Personal',
        desc: 'A private sanctuary for your thoughts and growth.',
        icon: User,
        color: 'bg-blue-50',
        iconColor: 'text-blue-500'
    },
    {
        id: 'couple',
        title: 'Couple',
        desc: 'Shared moments and milestones for two.',
        icon: Heart,
        color: 'bg-rose-50',
        iconColor: 'text-rose-500'
    },
    {
        id: 'family',
        title: 'Family',
        desc: 'A legacy space for generations to contribute.',
        icon: Users,
        color: 'bg-emerald-50',
        iconColor: 'text-emerald-500'
    }
];

export default function ModeSelection() {
    const { mode, setMode } = useOnboardingStore();

    return (
        <div className="min-h-screen p-8 flex flex-col">
            <header className="mt-12 mb-10">
                <h1 className="text-3xl font-serif text-memoria-clay">Choose your space</h1>
                <p className="text-slate-500 mt-2">How would you like to start your journey?</p>
            </header>

            <div className="flex-1 space-y-4">
                {modes.map((item) => {
                    const isSelected = mode === item.id;
                    const Icon = item.icon;

                    return (
                        <motion.div
                            key={item.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setMode(item.id as any)}
                            className={`relative p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer flex items-center gap-5 ${isSelected
                                    ? 'border-memoria-primary bg-white shadow-md'
                                    : 'border-transparent bg-slate-50'
                                }`}
                        >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.color}`}>
                                <Icon className={item.iconColor} size={28} />
                            </div>

                            <div className="flex-1">
                                <h3 className="font-bold text-memoria-clay">{item.title}</h3>
                                <p className="text-xs text-slate-400 leading-tight">{item.desc}</p>
                            </div>

                            {isSelected && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                    <CheckCircle2 className="text-memoria-primary" size={24} />
                                </motion.div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            <footer className="mt-8">
                <Link href={mode ? "/onboarding/biometrics" : "#"}>
                    <Button disabled={!mode} className={!mode ? "opacity-50" : ""}>
                        Continue
                    </Button>
                </Link>
            </footer>
        </div>
    );
}