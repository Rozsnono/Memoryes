"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, MapPin, Calendar, Plus, ImageIcon, Loader2 } from "lucide-react";
import { AddPerspective } from "./AddPerspective";
import { MediaCarousel } from "./MediaCarousel";
import { useState, useEffect } from "react";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";

interface MemoryDetailsProps {
    memory: any;
    isOpen: boolean;
    onClose: () => void;
}

export const MemoryDetailsView = ({ memory: initialMemory, isOpen, onClose }: MemoryDetailsProps) => {
    const [memory, setMemory] = useState(initialMemory);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [isUploadingMedia, setIsUploadingMedia] = useState(false);

    useEffect(() => {
        setMemory(initialMemory);
    }, [initialMemory]);

    const toggleFavorite = async () => {
        if (!memory) return;
        const newState = !memory.isFavorite; // Fixed: Use isFavorite consistently

        setMemory({ ...memory, isFavorite: newState });

        try {
            await apiClient.patch('/api/memories/favorite/', {
                memoryId: memory._id,
                isFavorite: newState
            });
            toast.success("Memory " + (newState ? "added to" : "removed from") + " favorites");
        } catch (err) {
            setMemory({ ...memory, isFavorite: !newState });
        }
    };

    // --- MULTIPLE MEDIA UPLOAD LOGIC ---
    const handleAddMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !memory) return;

        const fileArray = Array.from(files);
        setUploadProgress({ current: 0, total: fileArray.length });
        setIsUploadingMedia(true);

        try {
            // 1. Get Secure Signature from your API
            const { data: signData } = await apiClient.post('/api/media/sign/');

            // 2. Loop through every selected file
            for (let i = 0; i < fileArray.length; i++) {
                const file = fileArray[i];
                const isVideo = file.type.startsWith('video');
                const resourceType = isVideo ? 'video' : 'image';

                setUploadProgress(prev => ({ ...prev, current: i + 1 }));

                const formData = new FormData();
                formData.append('file', file);
                formData.append('api_key', signData.apiKey);
                formData.append('timestamp', signData.timestamp);
                formData.append('signature', signData.signature);
                formData.append('folder', 'memoryes_vault');

                // Cloudinary handles videos at a different endpoint suffix
                const cloudRes = await fetch(
                    `https://api.cloudinary.com/v1_1/${signData.cloudName}/${resourceType}/upload`,
                    { method: 'POST', body: formData }
                );
                const cloudData = await cloudRes.json();

                if (cloudData.secure_url) {
                    // 3. Update MongoDB for each successful upload
                    const { data: updatedMemory } = await apiClient.post('/api/memories/media/', {
                        memoryId: memory._id,
                        url: cloudData.secure_url,
                        publicId: cloudData.public_id,
                        mediaType: resourceType
                    });

                    // Update local state so the carousel grows in real-time
                    setMemory(updatedMemory);
                }
            }
        } catch (err) {
            console.error("Upload error:", err);
            toast.error("Some files failed to upload.");
        } finally {
            setIsUploadingMedia(false);
            toast.success("Memory preserved in vault");
            setUploadProgress({ current: 0, total: 0 });
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

                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-white pointer-events-none z-10" />

                        <div className="absolute top-14 left-6 right-6 flex justify-between items-center z-30">
                            <button
                                onClick={onClose}
                                className="p-3 bg-white/20 backdrop-blur-lg rounded-full text-white border border-white/30 active:scale-90 transition-transform"
                            >
                                <X size={24} />
                            </button>

                            <div className="flex gap-2">
                                {/* MULTI-SELECT Add Media Button */}
                                <label className="relative p-3 bg-white/20 backdrop-blur-lg rounded-full text-white border border-white/30 cursor-pointer active:scale-90 transition-transform flex items-center justify-center">
                                    {isUploadingMedia ? (
                                        <div className="relative flex items-center justify-center">
                                            <Loader2 size={24} className="animate-spin" />
                                            <span className="absolute text-[8px] font-bold">
                                                {uploadProgress.current}/{uploadProgress.total}
                                            </span>
                                        </div>
                                    ) : (
                                        <Plus size={24} />
                                    )}
                                    <input
                                        type="file"
                                        className="hidden"
                                        multiple
                                        accept="image/*,video/*"
                                        onChange={handleAddMedia}
                                        disabled={isUploadingMedia}
                                    />
                                </label>

                                <motion.button
                                    whileTap={{ scale: 0.8 }}
                                    onClick={toggleFavorite}
                                    className={`p-3 rounded-full shadow-lg transition-colors border ${memory.isFavorite
                                        ? "bg-rose-500 text-white border-rose-500"
                                        : "bg-white/20 backdrop-blur-lg text-white border-white/30"
                                        }`}
                                >
                                    <Heart size={24} fill={memory.isFavorite ? "currentColor" : "none"} />
                                </motion.button>
                            </div>
                        </div>

                        <div className="absolute bottom-16 left-8 z-20 flex flex-col gap-2">
                            <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm flex items-center gap-2 border border-white w-fit">
                                <MapPin size={14} className="text-memoryes-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-memoryes-clay">
                                    {memory.location?.name || "Discovery Point"}
                                </span>
                            </div>
                            <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-bold text-white flex items-center gap-2 w-fit">
                                <ImageIcon size={12} />
                                {memory.media?.length || 0} Items
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
                            <h2 className="text-4xl font-serif italic text-memoryes-clay leading-tight">
                                {memory.title}
                            </h2>
                        </header>

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
                                    <div className="w-10 h-10 rounded-2xl bg-memoryes-soft flex-shrink-0 flex items-center justify-center font-black text-memoryes-primary text-xs">
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

                    <AddPerspective
                        memoryId={memory._id}
                        onUpdate={(updated) => setMemory(updated)}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};