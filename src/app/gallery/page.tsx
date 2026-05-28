"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Loader2, Map as MapIcon, Image as ImageIcon, ChevronLeft } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { Navbar } from "@/components/ui/Navbar";
import { ImageLightbox } from "@/components/ImageLightbox";
import dynamic from "next/dynamic";

// Dynamically import Map to avoid SSR errors
const GalleryMap = dynamic(() => import("@/components/GalleryMap"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-50 flex items-center justify-center text-slate-300">Loading Map Engine...</div>
});

export default function GalleryPage() {
    const [memories, setMemories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: userData } = await apiClient.get('/api/auth/me/');
                if (userData.activeSpace) {
                    const { data: memData } = await apiClient.get(`/api/memories/?spaceId=${userData.activeSpace}`);
                    setMemories(memData);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const allMedia = useMemo(() => {
        const flattened: any[] = [];
        memories.forEach(memory => {
            memory.media?.forEach((item: any) => {
                flattened.push({ ...item, date: new Date(memory.capturedAt) });
            });
        });
        return flattened.sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [memories]);

    return (
        <div className="h-screen bg-memoryes-background flex flex-col overflow-hidden">
            {/* 1. HEADER */}
            <header className="p-6 pt-16 bg-white/90 backdrop-blur-md z-40 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-serif italic text-memoryes-clay">
                        {viewMode === 'grid' ? 'Gallery' : 'Photo Map'}
                    </h1>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[3px] mt-1">
                        {viewMode === 'grid' ? `${allMedia.length} Items Total` : 'Exploring by Place'}
                    </p>
                </div>

                {/* TOGGLE BUTTON */}
                <button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'map' : 'grid')}
                    className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-memoryes-primary shadow-sm border border-slate-50 active:scale-90 transition-transform"
                >
                    {viewMode === 'grid' ? <MapIcon size={24} /> : <LayoutGrid size={24} />}
                </button>
            </header>

            {/* 2. MAIN CONTENT AREA */}
            <main className="flex-1 relative overflow-hidden bg-slate-50">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loader"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="h-full w-full flex items-center justify-center"
                        >
                            <Loader2 className="animate-spin text-memoryes-primary" size={32} />
                        </motion.div>
                    ) : viewMode === 'grid' ? (
                        /* GRID VIEW */
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="h-full overflow-y-auto no-scrollbar p-0.5"
                        >
                            <div className="grid grid-cols-3 gap-0.5">
                                {allMedia.map((item, idx) => (
                                    <div
                                        key={`${item.publicId}-${idx}`}
                                        onClick={() => setSelectedImage(item)}
                                        className="relative aspect-square bg-slate-200 overflow-hidden active:opacity-70 transition-opacity"
                                    >
                                        <img src={item.url} className="w-full h-full object-cover" alt="" loading="lazy" />
                                    </div>
                                ))}
                            </div>
                            <div className="h-32" /> {/* Spacer for Navbar */}
                        </motion.div>
                    ) : (
                        /* MAP VIEW */
                        <motion.div
                            key="map"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full w-full"
                        >
                            <GalleryMap
                                memories={memories}
                                onImageSelect={(img) => setSelectedImage(img)}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* FULLSCREEN IMAGE LIGHTBOX */}
            <AnimatePresence>
                {selectedImage && (
                    <ImageLightbox
                        image={selectedImage}
                        onClose={() => setSelectedImage(null)}
                    />
                )}
            </AnimatePresence>

            <Navbar />
        </div>
    );
}