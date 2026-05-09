"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/ui/Navbar";
import { MapPin, Navigation as NavIcon, ChevronRight, Calendar, Loader2 } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

// Import MapProvider dynamically to disable SSR (Server Side Rendering)
const MapProvider = dynamic(() => import("@/components/MapProvider"), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-slate-50 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="animate-spin mb-2" size={32} />
            <span className="text-[10px] font-black uppercase tracking-widest">Initializing Map...</span>
        </div>
    )
});

export default function MapPage() {
    const router = useRouter();
    const [memories, setMemories] = useState<any[]>([]);
    const [selectedMemory, setSelectedMemory] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMapData = async () => {
            try {
                // 1. Get current user to find the activeSpace
                const { data: user } = await apiClient.get('/api/auth/me');
                
                if (!user.activeSpace) {
                    console.error("No active space found for user");
                    setLoading(false);
                    return;
                }

                // 2. Fetch memories only for the activeSpace
                const { data: mapMemories } = await apiClient.get(`/api/memories?spaceId=${user.activeSpace}`);
                
                // 3. Filter only memories that have valid coordinates to avoid Leaflet crashes
                const validMemories = mapMemories.filter((m: any) => 
                    m.location?.coordinates && 
                    m.location.coordinates.length === 2 &&
                    (m.location.coordinates[0] !== 0 || m.location.coordinates[1] !== 0)
                );

                setMemories(validMemories);
                
                if (validMemories.length > 0) {
                    setSelectedMemory(validMemories[0]);
                }
            } catch (err) {
                console.error("Map data sequence failed", err);
                // Redirect to login if unauthorized
                if ((err as any).response?.status === 401) {
                    router.push('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchMapData();
    }, [router]);

    return (
        <div className="h-screen bg-memoryes-background relative overflow-hidden">
            {/* 1. Header Overlay */}
            <div className="absolute top-12 left-6 right-6 z-20">
                <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white/80 backdrop-blur-xl p-5 rounded-[2rem] shadow-xl border border-white/50 flex justify-between items-center"
                >
                    <div>
                        <h2 className="text-xl font-serif italic text-memoryes-clay">Our Journey</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px]">
                            {loading ? "Locating..." : `${memories.length} Stops Tracked`}
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-memoryes-soft rounded-2xl flex items-center justify-center text-memoryes-primary shadow-inner">
                        <NavIcon size={24} />
                    </div>
                </motion.div>
            </div>

            {/* 2. The Map Engine */}
            <div className="absolute inset-0 z-10">
                {!loading && <MapProvider memories={memories} />}
            </div>

            {/* 3. Selected Memory Card (Bottom Slider) */}
            <AnimatePresence>
                {selectedMemory && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="absolute bottom-32 left-6 right-6 z-20 bg-white rounded-[2.5rem] p-4 flex gap-4 shadow-2xl border border-slate-100"
                    >
                        <div className="w-24 h-24 rounded-3xl overflow-hidden flex-shrink-0 shadow-sm border border-slate-50">
                            <img
                                src={selectedMemory.media[0]?.url}
                                className="w-full h-full object-cover"
                                alt={selectedMemory.title}
                            />
                        </div>
                        <div className="flex-1 flex flex-col justify-center overflow-hidden">
                            <div className="flex items-center gap-1 text-memoryes-primary mb-1">
                                <Calendar size={12} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                    {new Date(selectedMemory.capturedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                            <h3 className="text-md font-bold text-memoryes-clay leading-tight truncate">
                                {selectedMemory.title}
                            </h3>
                            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                <MapPin size={10} className="text-memoryes-primary" /> 
                                <span className="truncate">{selectedMemory.location?.name || "Discovery Point"}</span>
                            </p>
                        </div>
                        <button className="self-center p-2 text-slate-200 hover:text-memoryes-primary transition-colors">
                            <ChevronRight size={28} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty State Overlay */}
            {!loading && memories.length === 0 && (
                <div className="absolute inset-0 z-10 bg-slate-50/50 backdrop-blur-[2px] flex items-center justify-center p-12 text-center">
                    <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
                        <MapPin size={48} className="mx-auto text-slate-200 mb-4" />
                        <h3 className="font-serif italic text-lg text-memoryes-clay">No pins on your map yet</h3>
                        <p className="text-xs text-slate-400 mt-2">Start capturing memories with location enabled to see your journey here.</p>
                    </div>
                </div>
            )}

            <Navbar />
        </div>
    );
}