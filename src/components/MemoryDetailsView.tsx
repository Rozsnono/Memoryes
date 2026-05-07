"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, MapPin, Calendar, Plus, ImageIcon, Loader2 } from "lucide-react";
import { AddPerspective } from "./AddPerspective";
import { MediaCarousel } from "./MediaCarousel";
import { useState, useEffect } from "react";
import apiClient from "@/lib/apiClient";

interface MemoryDetailsProps {
    memory: any;
    isOpen: boolean;
    onClose: () => void;
}

export const MemoryDetailsView = ({ memory: initialMemory, isOpen, onClose }: MemoryDetailsProps) => {
    // Local state so we can update the UI immediately when new data arrives
    const [memory, setMemory] = useState(initialMemory);
    const [isUploadingMedia, setIsUploadingMedia] = useState(false);

    // Keep local state in sync with the memory passed from the dashboard
    useEffect(() => {
        setMemory(initialMemory);
    }, [initialMemory]);

    // Handler: Toggle Favorite Status
    const toggleFavorite = async () => {
        if (!memory) return;
        const newState = !memory.isPinned;

        // Optimistic Update
        setMemory({ ...memory, isFavorite: newState });

        try {
            await apiClient.patch('/api/memories/favorite/', {
                memoryId: memory._id,
                isFavorite: newState
            });
        } catch (err) {
            setMemory({ ...memory, isFavorite: !newState }); // Revert on fail
        }
    };

    // Handler: Add Media (Collaborative)
    const handleAddMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !memory) return;

        setIsUploadingMedia(true);
        try {
            const { data: signData } = await apiClient.post('/api/media/sign/');

            const formData = new FormData();
            formData.append('file', file);
            formData.append('api_key', signData.apiKey);
            formData.append('timestamp', signData.timestamp);
            formData.append('signature', signData.signature);
            formData.append('folder', 'memoria_vault');

            const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`, {
                method: 'POST', body: formData
            });
            const cloudData = await cloudRes.json();

            const { data: updatedMemory } = await apiClient.post('/api/memories/media/', {
                memoryId: memory._id,
                url: cloudData.secure_url,
                publicId: cloudData.public_id,
                mediaType: 'image'
            });

            setMemory(updatedMemory); // Refresh carousel with new photo
            window.location.reload(); // Temporary: Force reload to sync with other users' views
        } catch (err) {
            alert("Failed to add media");
        } finally {
            setIsUploadingMedia(false);
        }
    };

    if (!memory) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-[100] bg-white overflow-y-auto no-scrollbar pb-40"
                >
                    {/* 1. HERO MEDIA SECTION */}
                    <div className="relative h-[65vh] w-full bg-slate-900">
                        <MediaCarousel media={memory.media || []} />

                        {/* Visual Overlays */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-white pointer-events-none z-10" />

                        {/* Top Navigation & Action Buttons */}
                        <div className="absolute top-14 left-6 right-6 flex justify-between items-center z-30">
                            <button
                                onClick={onClose}
                                className="p-3 bg-white/20 backdrop-blur-lg rounded-full text-white border border-white/30 active:scale-90 transition-transform"
                            >
                                <X size={24} />
                            </button>

                            <div className="flex gap-2">
                                {/* Add Photo Button */}
                                <label className="p-3 bg-white/20 backdrop-blur-lg rounded-full text-white border border-white/30 cursor-pointer active:scale-90 transition-transform">
                                    {isUploadingMedia ? <Loader2 size={24} className="animate-spin" /> : <Plus size={24} />}
                                    <input type="file" className="hidden" onChange={handleAddMedia} disabled={isUploadingMedia} />
                                </label>

                                {/* Favorite Heart Button */}
                                <motion.button
                                    whileTap={{ scale: 0.8 }}
                                    onClick={toggleFavorite}
                                    className={`p-3 rounded-full shadow-lg transition-colors border ${memory.isPinned
                                            ? "bg-rose-500 text-white border-rose-500"
                                            : "bg-white/20 backdrop-blur-lg text-white border-white/30"
                                        }`}
                                >
                                    <Heart size={24} fill={memory.isPinned ? "currentColor" : "none"} />
                                </motion.button>
                            </div>
                        </div>

                        {/* Media Stats & Location Badge */}
                        <div className="absolute bottom-16 left-8 z-20 flex flex-col gap-2">
                            <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm flex items-center gap-2 border border-white w-fit">
                                <MapPin size={14} className="text-memoria-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-memoria-clay">
                                    {memory.location?.name || "Discovery Point"}
                                </span>
                            </div>
                            <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-bold text-white flex items-center gap-2 w-fit">
                                <ImageIcon size={12} />
                                {memory.media?.length || 1} Media Items
                            </div>
                        </div>
                    </div>

                    {/* 2. TEXT CONTENT SECTION */}
                    <div className="px-8 -mt-8 relative z-10">
                        <header className="mb-10">
                            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[3px] mb-3">
                                <Calendar size={14} />
                                <span>{new Date(memory.capturedAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                            </div>
                            <h2 className="text-4xl font-serif italic text-memoria-clay leading-tight">
                                {memory.title}
                            </h2>
                        </header>

                        {/* 3. MULTI-PERSPECTIVE SECTION */}
                        <section className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black uppercase tracking-[4px] text-slate-300">Perspectives</h4>
                                <div className="h-[1px] flex-1 bg-slate-100 ml-6" />
                            </div>

                            {memory.perspectives?.map((p: any, i: number) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={i}
                                    className="flex gap-4"
                                >
                                    <div className="w-10 h-10 rounded-2xl bg-memoria-soft flex-shrink-0 flex items-center justify-center font-black text-memoria-primary text-xs">
                                        {p.userName?.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">
                                            {p.userName}
                                        </p>
                                        <div className="bg-slate-50 p-5 rounded-3xl rounded-tl-none border border-slate-100 shadow-sm shadow-slate-200/50">
                                            <p className="text-sm leading-relaxed text-slate-600 italic">"{p.content}"</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {(!memory.perspectives || memory.perspectives.length === 0) && (
                                <div className="py-6 text-center border-2 border-dashed border-slate-50 rounded-[2.5rem]">
                                    <p className="text-slate-300 text-sm italic font-medium">No perspectives shared yet.</p>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* 4. FIXED PERSPECTIVE INPUT */}
                    <AddPerspective
                        memoryId={memory._id}
                        onUpdate={(updated) => setMemory(updated)}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};