"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Pin, Plus, X, SlidersHorizontal, Heart } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { Navbar } from "@/components/ui/Navbar";
import { UploadMemory } from "@/components/UploadMemory";
import { MemoryDetailsView } from "@/components/MemoryDetailsView";

export default function Dashboard() {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  // Modals State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<any | null>(null);

  const fetchMemories = async () => {
    try {
      const { data } = await apiClient.get('/api/memories/');
      setMemories(data);
    } catch (err) {
      console.error("Failed to fetch memories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  // --- FIXED SEARCH & FILTER LOGIC ---
  const filteredMemories = useMemo(() => {
    return memories.filter((memory) => {
      // 1. Robust Search (handling potential null/undefined values)
      const searchStr = searchQuery.toLowerCase();
      const titleMatch = memory.title?.toLowerCase().includes(searchStr);
      const locationMatch = memory.location?.name?.toLowerCase().includes(searchStr);
      const matchesSearch = titleMatch || locationMatch;

      // 2. Simple Pinned Toggle
      const matchesPinned = showPinnedOnly ? memory.isPinned : true;

      return matchesSearch && matchesPinned;
    });
  }, [memories, searchQuery, showPinnedOnly]);

  return (
    <div className="min-h-screen bg-memoria-background pb-32">
      {/* HEADER SECTION */}
      <header className="p-6 pt-16 space-y-6 sticky top-0 bg-memoria-background/90 backdrop-blur-md z-40">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-serif text-memoria-clay italic leading-none">Vault</h1>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[3px] mt-2">
              {filteredMemories.length} Memories Shown
            </p>
          </div>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="w-14 h-14 bg-memoria-clay rounded-[1.5rem] flex items-center justify-center text-white shadow-xl active:scale-90 transition-transform"
          >
            <Plus size={28} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white rounded-2xl flex items-center px-4 py-3 shadow-sm border border-slate-100 focus-within:border-memoria-primary transition-all">
            <Search className="text-slate-300 mr-2" size={18} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or place..."
              className="bg-transparent outline-none text-sm w-full text-memoria-clay placeholder:text-slate-300"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-slate-300">
                <X size={16} />
              </button>
            )}
          </div>
          <button className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 text-memoria-clay active:bg-slate-50">
            <SlidersHorizontal size={20} />
          </button>
        </div>

        {/* Simplified Filters: All vs Pinned */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowPinnedOnly(false)}
            className={`px-6 py-2.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${!showPinnedOnly
                ? "bg-memoria-clay text-white border-memoria-clay shadow-md"
                : "bg-white text-slate-400 border-slate-100"
              }`}
          >
            All Moments
          </button>
          <button
            onClick={() => setShowPinnedOnly(true)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${showPinnedOnly
                ? "bg-memoria-primary text-white border-memoria-primary shadow-md"
                : "bg-white text-slate-400 border-slate-100"
              }`}
          >
            <Pin size={12} fill={showPinnedOnly ? "currentColor" : "none"} />
            Pinned
          </button>
        </div>
      </header>

      {/* GRID SECTION */}
      <main className="px-6">
        {loading ? (
          <div className="flex justify-center py-20 opacity-20">
            <div className="w-10 h-10 border-4 border-memoria-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <motion.div layout className="columns-2 gap-4 space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredMemories.map((memory) => (
                <motion.div
                  key={memory._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => setSelectedMemory(memory)}
                  className="relative rounded-[2rem] overflow-hidden shadow-sm border border-white cursor-pointer active:scale-95 transition-transform"
                >
                  <img
                    src={memory.media[0]?.url}
                    className="w-full h-auto object-cover"
                    alt={memory.title}
                  />

                  {/* Pinned Icon Overlay */}
                  {memory.isPinned && (
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md p-1.5 rounded-full text-memoria-primary shadow-sm z-10">
                      <Pin size={10} fill="currentColor" />
                    </div>
                  )}

                  {/* Favorite Visual Indicator */}
                  {memory.isFavorite && (
                    <div className="absolute top-3 right-3 bg-rose-500/80 backdrop-blur-md p-1.5 rounded-full text-white shadow-sm z-10">
                      <Heart size={10} fill="currentColor" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <p className="text-[10px] font-bold truncate uppercase tracking-widest leading-tight">
                      {memory.title}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty Search State */}
        {!loading && filteredMemories.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <Search size={24} className="text-slate-200" />
            </div>
            <p className="text-sm font-serif italic text-slate-400">We couldn't find that memory...</p>
          </div>
        )}
      </main>

      {/* MODALS */}
      <UploadMemory isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} onRefresh={fetchMemories} />
      <MemoryDetailsView memory={selectedMemory} isOpen={!!selectedMemory} onClose={() => setSelectedMemory(null)} />
      <Navbar />
    </div>
  );
}