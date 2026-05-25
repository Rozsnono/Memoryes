"use client";

import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { 
    X, Heart, MapPin, Calendar, Plus, 
    ImageIcon, Loader2, Quote, Download, 
    MessageCircle, Edit2, Check, Navigation 
} from "lucide-react";
import { AddPerspective } from "./AddPerspective";
import { MediaCarousel } from "./MediaCarousel";
import { useState, useEffect, useRef } from "react";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import dynamic from "next/dynamic";

// Dynamically import LocationPicker to prevent SSR issues with Leaflet
const LocationPicker = dynamic(
    () => import("@/components/LocationPicker").then((mod) => mod.LocationPicker),
    { ssr: false }
);

interface MemoryDetailsProps {
    memory: any;
    isOpen: boolean;
    onClose: () => void;
}

/**
 * SUB-COMPONENT: Handles internal logic, scroll transforms, and Edit Mode.
 */
const MemoryDetailsContent = ({ memory, setMemory, onClose }: { memory: any, setMemory: any, onClose: () => void }) => {
    // Media & Upload States
    const [isUploadingMedia, setIsUploadingMedia] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

    // --- EDITING STATE ---
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(memory.title);
    const [editedCoords, setEditedCoords] = useState<[number, number]>(
        memory.location?.coordinates || [19.0402, 47.4979]
    );
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Scroll handling for Parallax
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        container: containerRef,
    });

    const mediaY = useTransform(scrollYProgress, [0, 0.4], ["0%", "-10%"]);
    const mediaScale = useTransform(scrollYProgress, [0, 0.4], [1, 1.05]);
    const overlayOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 0.6]);

    // Update internal edit state if props change
    useEffect(() => {
        setEditedTitle(memory.title);
        setEditedCoords(memory.location?.coordinates || [19.0402, 47.4979]);
    }, [memory]);

    const handleSaveChanges = async () => {
        setIsSaving(true);
        const toastId = toast.loading("Updating memory...");
        try {
            const { data } = await apiClient.patch('/api/memories/update/', {
                memoryId: memory._id,
                title: editedTitle,
                location: {
                    name: memory.location?.name || "Pinned Spot",
                    coordinates: editedCoords
                }
            });
            setMemory(data);
            setIsEditing(false);
            toast.success("Memory updated successfully", { id: toastId });
        } catch (err) {
            toast.error("Failed to update memory", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownload = async () => {
        const url = memory.media[activeIndex]?.url;
        if (!url) return;
        setIsDownloading(true);
        const toastId = toast.loading("Downloading...");

        try {
            const response = await fetch(url);
            const blob = await response.blob();
            if (Capacitor.isNativePlatform()) {
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = async () => {
                    const base64Data = reader.result as string;
                    await Filesystem.writeFile({
                        path: `memoryes_${Date.now()}.jpg`,
                        data: base64Data,
                        directory: Directory.Documents,
                    });
                    toast.success("Saved to Documents", { id: toastId });
                };
            } else {
                const blobUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = `memory_${memory._id}.jpg`;
                link.click();
                window.URL.revokeObjectURL(blobUrl);
                toast.success("Downloaded", { id: toastId });
            }
        } catch (err) { toast.error("Download failed", { id: toastId }); }
        finally { setIsDownloading(false); }
    };

    const toggleFavorite = async () => {
        const newState = !memory.isFavorite;
        setMemory({ ...memory, isFavorite: newState });
        try {
            await apiClient.patch('/api/memories/favorite/', { memoryId: memory._id, isFavorite: newState });
            toast.success(newState ? "Saved to favorites" : "Removed from favorites");
        } catch (err) { setMemory({ ...memory, isFavorite: !newState }); }
    };

    const handleAddMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const fileArray = Array.from(files);
        setUploadProgress({ current: 0, total: fileArray.length });
        setIsUploadingMedia(true);
        const toastId = toast.loading(`Uploading ${fileArray.length} items...`);

        try {
            const { data: signData } = await apiClient.post('/api/media/sign/');
            for (let i = 0; i < fileArray.length; i++) {
                const file = fileArray[i];
                const resourceType = file.type.startsWith('video') ? 'video' : 'image';
                setUploadProgress(prev => ({ ...prev, current: i + 1 }));
                const formData = new FormData();
                formData.append('file', file);
                formData.append('api_key', signData.apiKey);
                formData.append('timestamp', signData.timestamp);
                formData.append('signature', signData.signature);
                formData.append('folder', 'memoryes_vault');
                const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/${resourceType}/upload`, { method: 'POST', body: formData });
                const cloudData = await cloudRes.json();
                const { data: updated } = await apiClient.post('/api/memories/media/', {
                    memoryId: memory._id, url: cloudData.secure_url, publicId: cloudData.public_id, mediaType: resourceType
                });
                setMemory(updated);
            }
            toast.success("Gallery updated!", { id: toastId });
        } catch (err) { toast.error("Upload failed", { id: toastId }); }
        finally { setIsUploadingMedia(false); }
    };

    return (
        <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-white overflow-hidden"
        >
            <div ref={containerRef} className="h-full overflow-y-auto no-scrollbar">
                
                {/* 1. STICKY MEDIA CANVAS */}
                <div className="sticky top-0 h-[60vh] w-full overflow-hidden bg-slate-950 z-0">
                    <motion.div style={{ y: mediaY, scale: mediaScale }} className="h-full w-full">
                        <MediaCarousel 
                            media={memory.media || []} 
                            onIndexChange={(idx) => setActiveIndex(idx)} 
                        />
                    </motion.div>
                    <motion.div style={{ opacity: overlayOpacity }} className="absolute inset-0 bg-black z-10 pointer-events-none" />

                    {/* Top Action Bar */}
                    <div className="absolute top-12 left-0 right-0 px-6 flex justify-between items-center z-30">
                        <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl text-white">
                            <X size={22} />
                        </button>

                        <div className="flex gap-2 p-1.5 bg-black/20 backdrop-blur-xl border border-white/10 rounded-[1.5rem]">
                            {/* EDIT TOGGLE / SAVE BUTTON */}
                            {isEditing ? (
                                <button onClick={handleSaveChanges} disabled={isSaving} className="w-11 h-11 flex items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg active:scale-90 transition-transform">
                                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Check size={20} />}
                                </button>
                            ) : (
                                <button onClick={() => setIsEditing(true)} className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/10 text-white active:scale-90 transition-transform">
                                    <Edit2 size={18} />
                                </button>
                            )}

                            <label className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/10 text-white cursor-pointer active:scale-90 transition-transform">
                                {isUploadingMedia ? <Loader2 className="animate-spin" size={18} /> : <Plus size={20} />}
                                <input type="file" className="hidden" multiple accept="image/*,video/*" onChange={handleAddMedia} disabled={isUploadingMedia || isEditing} />
                            </label>
                            
                            <button onClick={handleDownload} disabled={isDownloading || isEditing} className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/10 text-white active:scale-90 transition-transform">
                                {isDownloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={20} />}
                            </button>
                            
                            <button onClick={toggleFavorite} className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all active:scale-90 ${memory.isFavorite ? 'bg-rose-500 text-white' : 'bg-white/10 text-white'}`}>
                                <Heart size={20} fill={memory.isFavorite ? "currentColor" : "none"} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. THE SCRAPBOOK SHEET */}
                <div className="relative z-20 min-h-[60vh] bg-white rounded-t-[3.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.15)] -mt-12">
                    <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto pt-4 mb-4 translate-y-4" />
                    
                    <div className="px-8 pt-10 pb-48">
                        <header className="mb-12">
                            <div className="flex items-center gap-2 mb-6">
                                {/* LOCATION BADGE / PICKER TRIGGER */}
                                <button 
                                    disabled={!isEditing}
                                    onClick={() => setIsPickerOpen(true)}
                                    className={`px-4 py-1.5 rounded-full flex items-center gap-2 border transition-all ${
                                        isEditing 
                                        ? 'bg-memoryes-primary text-white border-memoryes-primary shadow-lg animate-pulse' 
                                        : 'bg-memoryes-soft/50 text-memoryes-primary border-memoryes-primary/10'
                                    }`}
                                >
                                    {isEditing ? <Navigation size={12} /> : <MapPin size={12} />}
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                        {isEditing ? "Relocate Memory" : (memory.location?.name || "Discovery Point")}
                                    </span>
                                </button>
                            </div>

                            {/* TITLE INPUT / DISPLAY */}
                            {isEditing ? (
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-2">Edit Memory Title</label>
                                    <input 
                                        autoFocus
                                        className="w-full bg-slate-50 border-b-2 border-memoryes-primary p-3 text-3xl font-serif italic text-slate-800 outline-none rounded-t-2xl"
                                        value={editedTitle}
                                        onChange={(e) => setEditedTitle(e.target.value)}
                                    />
                                </div>
                            ) : (
                                <h2 className="text-4xl font-serif italic text-slate-800 leading-tight mb-2">
                                    {memory.title}
                                </h2>
                            )}

                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[4px] mt-4">
                                {new Date(memory.capturedAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                            </p>
                        </header>

                        {/* PERSPECTIVES LIST */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-4">
                                <MessageCircle size={16} className="text-slate-300" />
                                <span className="text-[11px] font-black uppercase tracking-[3px] text-slate-300">Perspectives</span>
                                <div className="h-[1px] flex-1 bg-slate-50" />
                            </div>
                            
                            {memory.perspectives?.length > 0 ? (
                                memory.perspectives.map((p: any, i: number) => (
                                    <motion.div 
                                        key={i} 
                                        initial={{ opacity: 0, y: 10 }} 
                                        whileInView={{ opacity: 1, y: 0 }} 
                                        viewport={{ once: true }}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-memoryes-soft flex-shrink-0 flex items-center justify-center font-black text-memoryes-primary text-xs uppercase border-2 border-white shadow-sm">
                                                {p.userName?.charAt(0)}
                                            </div>
                                            <div className="flex-1 bg-[#FBFBFF] border border-slate-50 p-5 rounded-[2.5rem] rounded-tl-none relative shadow-sm">
                                                <Quote className="absolute top-4 right-6 text-memoryes-primary/5" size={40} />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{p.userName}</p>
                                                <p className="text-md font-serif italic text-slate-600 leading-relaxed">"{p.content}"</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="py-10 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                                    <p className="text-sm font-serif italic text-slate-300">No perspectives shared yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* FIXED BOTTOM INPUT */}
            <div className="absolute bottom-0 left-0 right-0 z-50">
                <AddPerspective memoryId={memory._id} onUpdate={(updated) => setMemory(updated)} />
            </div>

            {/* MANUAL LOCATION PICKER OVERLAY */}
            <LocationPicker 
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                initialCoords={editedCoords}
                onSelect={(coords) => setEditedCoords(coords)}
            />
        </motion.div>
    );
};

/**
 * MAIN EXPORT: Shell component with AnimatePresence logic.
 */
export const MemoryDetailsView = ({ memory: initialMemory, isOpen, onClose }: MemoryDetailsProps) => {
    const [memory, setMemory] = useState(initialMemory);

    useEffect(() => {
        if (initialMemory) setMemory(initialMemory);
    }, [initialMemory]);

    return (
        <AnimatePresence>
            {isOpen && memory && (
                <MemoryDetailsContent 
                    memory={memory} 
                    setMemory={setMemory} 
                    onClose={onClose} 
                />
            )}
        </AnimatePresence>
    );
};