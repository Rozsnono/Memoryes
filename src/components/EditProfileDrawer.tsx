"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, User } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";

export const EditProfileDrawer = ({ isOpen, onClose, initialName, onUpdate }: any) => {
    const [name, setName] = useState(initialName);
    const [loading, setLoading] = useState(false);

    const saveName = async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.patch('/api/profile/', { name });
            onUpdate(data);
            onClose();
        } catch (err) {
            toast.error("Failed to update name");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150]"
                    />
                    <motion.div
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[3rem] p-8 pb-12 z-[160] max-w-md mx-auto"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-serif italic text-memoryes-clay">Account Details</h3>
                            <button onClick={onClose} className="p-2 bg-slate-100 rounded-full"><X size={20} /></button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Display Name</label>
                                <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
                                    <User size={18} className="text-slate-300 mr-3" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="bg-transparent outline-none text-sm w-full text-memoryes-clay font-bold"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={saveName}
                                disabled={loading || !name}
                                className="w-full bg-memoryes-clay text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                            >
                                {loading ? "Saving..." : "Save Changes"}
                                {!loading && <Check size={18} />}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};