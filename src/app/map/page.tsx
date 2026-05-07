// app/map/page.tsx
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/ui/Navbar";
import { MapPin, Navigation as NavIcon, ChevronRight, Calendar } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { motion, AnimatePresence } from "framer-motion";

// Import MapProvider dynamically to disable SSR (Server Side Rendering)
const MapProvider = dynamic(() => import("@/components/MapProvider"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest">Loading Map...</div>
});

export default function MapPage() {
    const [memories, setMemories] = useState<any[]>([]);
    const [selectedMemory, setSelectedMemory] = useState<any>(null);

    useEffect(() => {
        const fetchMapData = async () => {
            try {
                const { data } = await apiClient.get('/api/memories/');
                setMemories(data);
                if (data.length > 0) setSelectedMemory(data[0]);
            } catch (err) {
                console.error("Map fetch failed");
            }
        };
        fetchMapData();
    }, []);

    return (
        <div className="h-screen bg-memoria-background relative overflow-hidden">
            {/* 1. Header Overlay */}
            <div className="absolute top-12 left-6 right-6 z-20">
                <div className="bg-white/80 backdrop-blur-xl p-5 rounded-[2rem] shadow-xl border border-white/50 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-serif italic text-memoria-clay">Our Journey</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px]">
                            {memories.length} Stops Tracked
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-memoria-soft rounded-2xl flex items-center justify-center text-memoria-primary">
                        <NavIcon size={24} />
                    </div>
                </div>
            </div>

            {/* 2. The Map Engine */}
            <div className="absolute inset-0 z-10">
                <MapProvider memories={memories} />
            </div>

            {/* 3. Selected Memory Card (Bottom Slider) */}
            <AnimatePresence>
                {selectedMemory && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="absolute bottom-32 left-6 right-6 z-20 bg-white rounded-[2.5rem] p-4 flex gap-4 shadow-2xl border border-slate-100"
                    >
                        <div className="w-24 h-24 rounded-3xl overflow-hidden flex-shrink-0 shadow-sm">
                            <img
                                src={selectedMemory.media[0]?.url}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="flex items-center gap-1 text-memoria-primary mb-1">
                                <Calendar size={12} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                    {new Date(selectedMemory.capturedAt).toLocaleDateString()}
                                </span>
                            </div>
                            <h3 className="text-md font-bold text-memoria-clay leading-tight truncate">
                                {selectedMemory.title}
                            </h3>
                            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                <MapPin size={10} /> {selectedMemory.location.name}
                            </p>
                        </div>
                        <button className="self-center p-2 text-slate-300">
                            <ChevronRight size={24} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <Navbar />
        </div>
    );
}