"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Loader2, ImageIcon } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { Navbar } from "@/components/ui/Navbar";
import { ImageLightbox } from "@/components/ImageLightbox"; // Import new component

export default function GalleryPage() {
    const [memories, setMemories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<any>(null); // Track specific image

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
        <div className="min-h-screen bg-memoryes-background pb-32">
            <header className="p-6 pt-16 sticky top-0 bg-memoryes-background/90 backdrop-blur-md z-40">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-serif italic text-memoryes-clay">Gallery</h1>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[3px] mt-1">
                            {allMedia.length} Total Items
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-memoryes-soft rounded-2xl flex items-center justify-center text-memoryes-primary shadow-sm">
                        <LayoutGrid size={24} />
                    </div>
                </div>
            </header>

            <main className="p-0.5">
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-memoryes-primary" /></div>
                ) : (
                    <div className="grid grid-cols-3 gap-0.5">
                        {allMedia.map((item, idx) => (
                            <motion.div
                                key={`${item.publicId}-${idx}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={() => setSelectedImage(item)} // OPEN LIGHTBOX
                                className="relative aspect-square bg-slate-200 overflow-hidden active:opacity-70 transition-opacity"
                            >
                                <img src={item.url} className="w-full h-full object-cover" alt="" loading="lazy" />
                            </motion.div>
                        ))}
                    </div>
                )}
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