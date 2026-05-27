"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Edit2, X, Check, Sparkles, Calendar as CalIcon } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";

export const DashboardCountdown = ({ space, onUpdate }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0 });

    // Form States
    const [title, setTitle] = useState(space?.countdown?.title || "Upcoming Event");
    const [date, setDate] = useState(space?.countdown?.targetDate ? new Date(space.countdown.targetDate).toISOString().split('T')[0] : "");

    // 1. Countdown Logic
    useEffect(() => {
        if (!space?.countdown?.targetDate || !space?.countdown?.isActive) return;

        const interval = setInterval(() => {
            const target = new Date(space.countdown.targetDate).getTime();
            const now = new Date().getTime();
            const difference = target - now;

            if (difference < 0) {
                clearInterval(interval);
                setTimeLeft({ days: 0, hours: 0, mins: 0 });
            } else {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    mins: Math.floor((difference / 1000 / 60) % 60),
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [space]);

    const handleSave = async () => {
        try {
            const { data } = await apiClient.patch('/api/spaces/countdown', {
                spaceId: space._id,
                title,
                targetDate: new Date(date),
                isActive: true
            });
            onUpdate(data);
            setIsEditing(false);
            toast.success("Countdown updated for everyone!");
        } catch (err) {
            toast.error("Failed to update");
        }
    };

    if (!space?.countdown?.isActive && !isEditing) {
        return (
            <button
                onClick={() => setIsEditing(true)}
                className="w-full p-6 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex items-center justify-center gap-3 text-slate-300 hover:text-memoryes-primary hover:border-memoryes-soft transition-all"
            >
                <PlusIcon size={20} />
                <span className="text-[10px] font-black uppercase tracking-[3px]">Add Family Countdown</span>
            </button>
        );
    }

    return (
        <div className="relative overflow-hidden bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-50">
            {/* Background Decoration */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-memoryes-soft/30 rounded-full blur-3xl pointer-events-none" />

            <AnimatePresence mode="wait">
                {!isEditing ? (
                    <motion.div
                        key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center justify-between"
                    >
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Sparkles size={12} className="text-memoryes-primary" />
                                <span className="text-[9px] font-black text-memoryes-primary uppercase tracking-[3px]">{space.countdown.title}</span>
                            </div>
                            <div className="flex items-end gap-3">
                                <TimeUnit value={timeLeft.days} label="Days" />
                                <span className="text-slate-200 pb-2">:</span>
                                <TimeUnit value={timeLeft.hours} label="Hrs" />
                                <span className="text-slate-200 pb-2">:</span>
                                <TimeUnit value={timeLeft.mins} label="Min" />
                            </div>
                        </div>
                        <button onClick={() => setIsEditing(true)} className="p-3 bg-slate-50 rounded-2xl text-slate-300 active:scale-90 transition-transform">
                            <Edit2 size={18} />
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="edit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="space-y-4"
                    >
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-memoryes-primary uppercase tracking-[3px]">Edit Countdown</span>
                            <button onClick={() => setIsEditing(false)}><X size={16} className="text-slate-300" /></button>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            <input
                                value={title} onChange={e => setTitle(e.target.value)}
                                placeholder="Event Name (e.g. Summer Vacation)"
                                className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-sm font-bold text-memoryes-clay"
                            />
                            <div className="flex gap-2">
                                <div className="flex-1 bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
                                    <CalIcon size={16} className="text-slate-300" />
                                    <input
                                        type="datetime-local" value={date} onChange={e => setDate(e.target.value)}
                                        className="bg-transparent outline-none text-xs font-bold text-memoryes-clay w-full"
                                    />
                                </div>
                                <button
                                    onClick={handleSave}
                                    className="px-6 bg-memoryes-clay text-white rounded-2xl font-bold shadow-lg"
                                >
                                    <Check size={20} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const TimeUnit = ({ value, label }: { value: number, label: string }) => (
    <div className="flex flex-col">
        <span className="text-3xl font-serif italic text-memoryes-clay leading-none">{value.toString().padStart(2, '0')}</span>
        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">{label}</span>
    </div>
);

const PlusIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);