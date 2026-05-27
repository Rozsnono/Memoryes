"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Pin, Plus, X, SlidersHorizontal, Heart, Loader2 } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { Navbar } from "@/components/ui/Navbar";
import { MemoryDetailsView } from "@/components/MemoryDetailsView";
import { SpaceSwitcher } from "@/components/SpaceSwitcher";
import { DashboardCountdown } from "@/components/DashboardCount"; // Add this
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const router = useRouter();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  // Modal State (Keep for reference, though we use router navigation now)
  const [selectedMemory, setSelectedMemory] = useState<any | null>(null);

  const fetchData = async () => {
    try {
      // 1. Get current user & their spaces
      const { data: userData } = await apiClient.get('/api/auth/me/');
      setUser(userData);

      // 2. Fetch memories for the ACTIVE space only
      // Ensure we extract the ID string if it's a populated object
      const spaceId = typeof userData.activeSpace === 'object'
        ? userData.activeSpace._id
        : userData.activeSpace;

      if (spaceId) {
        const { data: memData } = await apiClient.get(`/api/memories/?spaceId=${spaceId}`);
        setMemories(memData);
      }

      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load vault data");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper to refresh memories when space is switched
  const handleSpaceSwitch = (updatedUser: any) => {
    setUser(updatedUser);
    setLoading(true);
    const spaceId = typeof updatedUser.activeSpace === 'object'
      ? updatedUser.activeSpace._id
      : updatedUser.activeSpace;

    apiClient.get(`/api/memories/?spaceId=${spaceId}`)
      .then(res => {
        setMemories(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        toast.error("Failed to sync new space");
      });
  };

  // Helper to update space data locally (for countdown edits)
  const handleUpdateSpaceLocally = (updatedSpace: any) => {
    setUser((prev: any) => ({
      ...prev,
      spaces: prev.spaces.map((s: any) => s._id === updatedSpace._id ? updatedSpace : s)
    }));
  };

  // --- FILTER LOGIC ---
  const filteredMemories = useMemo(() => {
    return memories.filter((memory) => {
      const searchStr = searchQuery.toLowerCase();
      const titleMatch = memory.title?.toLowerCase().includes(searchStr);
      const locationMatch = memory.location?.name?.toLowerCase().includes(searchStr);
      const matchesSearch = titleMatch || locationMatch;
      const matchesPinned = showPinnedOnly ? memory.isPinned : true;
      return matchesSearch && matchesPinned;
    });
  }, [memories, searchQuery, showPinnedOnly]);

  return (
    <div className="min-h-screen bg-memoryes-background pb-32">
      {/* HEADER SECTION */}
      <header className="p-6 pt-16 space-y-6 sticky top-0 bg-memoryes-background/90 backdrop-blur-md z-40">
        <div className="flex justify-between items-center">
          <div>
            {/* INTEGRATED SPACE SWITCHER */}
            <h1 className="text-4xl font-serif text-memoryes-clay italic leading-none">Vault</h1>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[3px] mt-2 ml-1">
              {filteredMemories.length} Memories Shown
            </p>
          </div>
          <Link href="/upload"
            className="w-14 h-14 bg-memoryes-clay text-white rounded-[1.5rem] flex items-center justify-center shadow-xl active:scale-90 transition-transform"
          >
            <Plus size={28} />
          </Link>
        </div>

        {/* Simplified Filters: All vs Pinned */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowPinnedOnly(false)}
            className={`px-6 py-2.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${!showPinnedOnly
              ? "bg-memoryes-clay text-white border-memoryes-clay shadow-md"
              : "bg-white text-slate-400 border-slate-100"
              }`}
          >
            All Moments
          </button>
          <button
            onClick={() => setShowPinnedOnly(true)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${showPinnedOnly
              ? "bg-memoryes-primary text-white border-memoryes-primary shadow-md"
              : "bg-white text-slate-400 border-slate-100"
              }`}
          >
            <Pin size={12} fill={showPinnedOnly ? "currentColor" : "none"} />
            Pinned
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="px-6 space-y-6">

        {/* SHARED FAMILY COUNTDOWN */}
        {!loading && user && (
          <DashboardCountdown
            space={user.spaces.find((s: any) => s._id === (typeof user.activeSpace === 'object' ? user.activeSpace._id : user.activeSpace))}
            onUpdate={handleUpdateSpaceLocally}
          />
        )}

        {/* MEMORY GRID */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-memoryes-primary" size={32} />
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
                  onClick={() => router.push(`/memory?id=${memory._id}`)}
                  className="relative rounded-[2rem] overflow-hidden shadow-sm border border-white cursor-pointer active:scale-95 transition-transform"
                >
                  <img
                    src={memory.media[0]?.url}
                    className="w-full h-auto object-cover"
                    alt={memory.title}
                  />

                  {/* Overlays */}
                  <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                    {memory.isPinned && (
                      <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-full text-memoryes-primary shadow-sm z-10">
                        <Pin size={10} fill="currentColor" />
                      </div>
                    )}
                    {memory.isFavorite && (
                      <div className="bg-rose-500/90 backdrop-blur-md p-1.5 rounded-full text-white shadow-sm z-10">
                        <Heart size={10} fill="currentColor" />
                      </div>
                    )}
                  </div>

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

      <Navbar />
    </div>
  );
}