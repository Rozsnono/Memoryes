"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, animate } from "framer-motion";
import { Timer, Edit2, X, Check, Sparkles, Calendar as CalIcon } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";

// --- SUB-COMPONENT: ANIMATED NUMBER ---
// This handles the "Rolling up from 0" effect
const AnimatedNumber = ({ value }: { value: number }) => {
    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, {
        stiffness: 100,
        damping: 18,
    });
    const displayValue = useTransform(springValue, (latest) =>
        Math.floor(latest).toString().padStart(2, "0")
    );

    useEffect(() => {
        // Every time the 'value' changes (including mount), 
        // animate the motion value from its current state to the new value
        animate(motionValue, value, { duration: 1, ease: "easeOut" });
    }, [value, motionValue]);

    return <motion.span>{displayValue}</motion.span>;
};

export const DashboardCountdown = ({ space, onUpdate }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0 });

    // Form States
    const [title, setTitle] = useState(space?.countdown?.title || "Upcoming Event");
    const [date, setDate] = useState(
        space?.countdown?.targetDate
            ? new Date(space.countdown.targetDate).toISOString().slice(0, 16)
            : ""
    );

    // 1. Improved Countdown Logic
    useEffect(() => {
        if (!space?.countdown?.targetDate || !space?.countdown?.isActive) return;

        const calculateTime = () => {
            const target = new Date(space.countdown.targetDate).getTime();
            const now = new Date().getTime();
            const difference = target - now;

            if (difference < 0) {
                setTimeLeft({ days: 0, hours: 0, mins: 0 });
                return false;
            } else {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    mins: Math.floor((difference / 1000 / 60) % 60),
                });
                return true;
            }
        };

        // Initial call to prevent flash of 0
        calculateTime();
        const interval = setInterval(calculateTime, 1000 * 60); // Update every minute is enough for display

        return () => clearInterval(interval);
    }, [space]);

    const handleSave = async () => {
        const toastId = toast.loading("Syncing countdown...");
        try {
            const { data } = await apiClient.patch('/api/spaces/countdown/', {
                spaceId: space._id,
                title,
                targetDate: new Date(date),
                isActive: true
            });
            onUpdate(data);
            setIsEditing(false);
            toast.success("Timeline updated for the family", { id: toastId });
        } catch (err) {
            toast.error("Failed to update vault", { id: toastId });
        }
    };

    if (!space?.countdown?.isActive && !isEditing) {
        return (
            <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setIsEditing(true)}
                className="w-full p-8 border-2 border-dashed border-memoryes-soft/50 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 text-slate-300 hover:text-memoryes-primary hover:bg-memoryes-soft/5 transition-all group"
            >
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <PlusIcon size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[4px]">Initiate Countdown</span>
            </motion.button>
        );
    }

    return (
        <div className="relative overflow-hidden bg-white rounded-[2.5rem] p-7 shadow-sm border border-slate-50">
            {/* Ambient Background Decoration */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-memoryes-soft/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-memoryes-accent/10 rounded-full blur-2xl pointer-events-none" />

            <AnimatePresence mode="wait">
                {!isEditing ? (
                    <motion.div
                        key="view"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center justify-between relative z-10"
                    >
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-memoryes-soft rounded-lg">
                                    <Sparkles size={12} className="text-memoryes-primary" />
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">{space.countdown.title}</span>
                            </div>

                            <div className="flex items-center gap-4">
                                <TimeUnit value={timeLeft.days} label="Days" />
                                <Separator />
                                <TimeUnit value={timeLeft.hours} label="Hours" />
                                <Separator />
                                <TimeUnit value={timeLeft.mins} label="Mins" />
                            </div>
                        </div>

                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-4 bg-slate-50 rounded-2xl text-slate-300 hover:text-memoryes-primary active:scale-90 transition-all border border-transparent hover:border-memoryes-soft"
                        >
                            <Edit2 size={18} />
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="edit"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-5 relative z-10"
                    >
                        <div className="flex justify-between items-center">
                            <h3 className="text-[10px] font-black text-memoryes-primary uppercase tracking-[4px]">Vault Event Setup</h3>
                            <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                                <X size={18} className="text-slate-300" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Event Name (e.g. Wedding Day)"
                                className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-sm font-bold text-memoryes-clay border-2 border-transparent focus:border-memoryes-soft transition-all"
                            />
                            <div className="flex gap-2">
                                <div className="flex-1 bg-slate-50 rounded-2xl p-4 flex items-center gap-3 border-2 border-transparent focus-within:border-memoryes-soft transition-all">
                                    <CalIcon size={18} className="text-memoryes-primary" />
                                    <input
                                        type="datetime-local"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        className="bg-transparent outline-none text-xs font-bold text-memoryes-clay w-full"
                                    />
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={!date || !title}
                                    className="px-8 bg-memoryes-clay text-white rounded-2xl font-bold shadow-lg shadow-memoryes-clay/20 active:scale-95 transition-transform disabled:opacity-30"
                                >
                                    <Check size={24} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- STYLED COMPONENTS ---

const TimeUnit = ({ value, label }: { value: number, label: string }) => (
    <div className="flex flex-col">
        <div className="text-4xl font-serif italic text-memoryes-clay leading-none tracking-tighter">
            <AnimatedNumber value={value} />
        </div>
        <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest mt-1.5 ml-0.5">{label}</span>
    </div>
);

const Separator = () => (
    <div className="flex flex-col gap-1 mb-4 opacity-20">
        <div className="w-1 h-1 bg-memoryes-clay rounded-full" />
        <div className="w-1 h-1 bg-memoryes-clay rounded-full" />
    </div>
);

const PlusIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);