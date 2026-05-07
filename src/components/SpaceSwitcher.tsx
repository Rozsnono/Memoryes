"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus, Check, LayoutGrid } from "lucide-react";
import { useState } from "react";
import apiClient from "@/lib/apiClient";

export const SpaceSwitcher = ({ user, onSwitch }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const activeSpace = user.spaces.find((s: any) => s._id === user.activeSpace);

    const handleSwitch = async (id: string) => {
        try {
            const { data } = await apiClient.post('/api/spaces/switch', { spaceId: id });
            onSwitch(data); // Update user state in Dashboard
            setIsOpen(false);
        } catch (err) {
            alert("Failed to switch space");
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-white/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white shadow-sm active:scale-95 transition-all"
            >
                <div
                    className="w-3 h-3 rounded-full shadow-inner"
                    style={{ backgroundColor: activeSpace?.themeColor || '#9B86BD' }}
                />
                <span className="text-sm font-serif italic text-memoria-clay">{activeSpace?.name || "Vault"}</span>
                <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full mt-2 left-0 w-64 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-3 z-50 overflow-hidden"
                        >
                            <div className="px-4 py-2 mb-2">
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Switch Vault</p>
                            </div>

                            <div className="space-y-1">
                                {user.spaces.map((space: any) => (
                                    <button
                                        key={space._id}
                                        onClick={() => handleSwitch(space._id)}
                                        className={`w-full flex items-center justify-between p-3 rounded-2xl transition-colors ${space._id === user.activeSpace ? 'bg-memoria-soft/30' : 'hover:bg-slate-50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: space.themeColor }}>
                                                <LayoutGrid size={14} />
                                            </div>
                                            <span className={`text-xs font-bold ${space._id === user.activeSpace ? 'text-memoria-primary' : 'text-slate-500'}`}>
                                                {space.name}
                                            </span>
                                        </div>
                                        {space._id === user.activeSpace && <Check size={14} className="text-memoria-primary" />}
                                    </button>
                                ))}
                            </div>

                            <button className="w-full mt-2 flex items-center gap-3 p-3 rounded-2xl text-slate-400 hover:bg-slate-50 transition-colors border-t border-slate-50 pt-4">
                                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                                    <Plus size={14} />
                                </div>
                                <span className="text-xs font-bold">New Space</span>
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};