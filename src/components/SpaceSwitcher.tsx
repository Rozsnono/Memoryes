"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus, Check, LayoutGrid, X, Loader2 } from "lucide-react";
import { useState } from "react";
import apiClient from "@/lib/apiClient";

export const SpaceSwitcher = ({ user, onSwitch }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newSpaceName, setNewSpaceName] = useState("");
    const [loading, setLoading] = useState(false);

    const activeSpace = user.spaces.find((s: any) => s._id === user.activeSpace);

    const handleSwitch = async (id: string) => {
        try {
            const { data } = await apiClient.post('/api/spaces/switch/', { spaceId: id });
            onSwitch(data);
            setIsOpen(false);
        } catch (err) {
            alert("Failed to switch space");
        }
    };

    const handleCreateSpace = async () => {
        if (!newSpaceName.trim()) return;
        setLoading(true);
        try {
            const { data } = await apiClient.post('/api/spaces/create/', {
                name: newSpaceName,
                type: 'personal' // Defaulting to personal, can be expanded later
            });
            onSwitch(data);
            setNewSpaceName("");
            setIsCreating(false);
            setIsOpen(false);
        } catch (err) {
            alert("Creation failed");
        } finally {
            setLoading(false);
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
                <span className="text-sm font-serif italic text-memoryes-clay truncate max-w-[100px]">
                    {activeSpace?.name || "Vault"}
                </span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => { setIsOpen(false); setIsCreating(false); }} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full mt-2 left-0 w-72 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-3 z-50 overflow-hidden"
                        >
                            <AnimatePresence mode="wait">
                                {!isCreating ? (
                                    <motion.div
                                        key="list"
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: -20, opacity: 0 }}
                                    >
                                        <div className="px-4 py-2 mb-2">
                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Your Vaults</p>
                                        </div>

                                        <div className="space-y-1 max-h-60 overflow-y-auto no-scrollbar">
                                            {user.spaces.map((space: any) => (
                                                <button
                                                    key={space._id}
                                                    onClick={() => handleSwitch(space._id)}
                                                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-colors ${space._id === user.activeSpace ? 'bg-memoryes-soft/30' : 'hover:bg-slate-50'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: space.themeColor }}>
                                                            <LayoutGrid size={14} />
                                                        </div>
                                                        <span className={`text-xs font-bold ${space._id === user.activeSpace ? 'text-memoryes-primary' : 'text-slate-500'}`}>
                                                            {space.name}
                                                        </span>
                                                    </div>
                                                    {space._id === user.activeSpace && <Check size={14} className="text-memoryes-primary" />}
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => { setIsCreating(true) }}
                                            className="w-full mt-2 flex items-center gap-3 p-3 rounded-2xl text-slate-400 hover:bg-slate-50 transition-colors border-t border-slate-50 pt-4"
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                                                <Plus size={14} />
                                            </div>
                                            <span className="text-xs font-bold">New Space</span>
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="create"
                                        initial={{ x: 20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: 20, opacity: 0 }}
                                        className="p-2"
                                    >
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-[10px] font-black text-memoryes-clay uppercase tracking-widest">Name your vault</h3>
                                            <button onClick={() => setIsCreating(false)} className="text-slate-300"><X size={16} /></button>
                                        </div>

                                        <input
                                            autoFocus
                                            value={newSpaceName}
                                            onChange={(e) => setNewSpaceName(e.target.value)}
                                            placeholder="e.g. Paris Trip 2024"
                                            className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-transparent focus:border-memoryes-primary text-sm font-medium mb-3"
                                        />

                                        <button
                                            onClick={handleCreateSpace}
                                            disabled={loading || !newSpaceName}
                                            className="w-full bg-memoryes-clay text-white py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                                        >
                                            {loading ? <Loader2 className="animate-spin" size={14} /> : "Create Vault"}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};