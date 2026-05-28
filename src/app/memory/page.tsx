"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import {
    ChevronLeft, Heart, MapPin, Calendar, Plus,
    ImageIcon, Loader2, Quote, Download, MessageCircle,
    Edit2, Check, Navigation, ThumbsUp, Laugh, Smile
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import dynamic from "next/dynamic";
import { MediaCarousel } from "@/components/MediaCarousel";
import { AddPerspective } from "@/components/AddPerspective";

// Dynamically import LocationPicker to prevent SSR issues
const LocationPicker = dynamic(
    () => import("@/components/LocationPicker").then((mod) => mod.LocationPicker),
    { ssr: false }
);

/**
 * SUB-COMPONENT: The actual UI logic.
 * This is separated to ensure useScroll/Refs only initialize when data is ready.
 */
function MemoryScrollUI({ memory, user, setMemory }: any) {
    const router = useRouter();

    // UI States
    const [isUploadingMedia, setIsUploadingMedia] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);

    // Editing States
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(memory.title);
    const [editedCoords, setEditedCoords] = useState<[number, number]>(memory.location?.coordinates || [19.0402, 47.4979]);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Scroll handling for Parallax
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ container: containerRef });
    const mediaScale = useTransform(scrollYProgress, [0, 0.3], [1, 1.1]);
    const mediaY = useTransform(scrollYProgress, [0, 0.3], ["0%", "-5%"]);
    const overlayOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 0.7]);

    const handleReaction = async (pId: string, type: string) => {
        if (!user) return;
        try {
            const { data } = await apiClient.patch('/api/memories/perspective/react/', {
                memoryId: memory._id,
                perspectiveId: pId,
                userId: user._id,
                type
            });
            setMemory(data);
        } catch (err) {
            toast.error("Reaction failed");
        }
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
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
            toast.success("Memory updated");
        } catch (err) {
            toast.error("Failed to update");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const fileArray = Array.from(files);
        setIsUploadingMedia(true);
        const toastId = toast.loading(`Uploading ${fileArray.length} items...`);

        try {
            const { data: signData } = await apiClient.post('/api/media/sign/');
            for (let i = 0; i < fileArray.length; i++) {
                const file = fileArray[i];
                const resourceType = file.type.startsWith('video') ? 'video' : 'image';
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
        } catch (err) { toast.error("Download failed"); }
        finally { setIsDownloading(false); }
    };

    return (
        <div ref={containerRef} className="h-screen w-full bg-white overflow-y-auto no-scrollbar relative">
            {/* 1. STICKY MEDIA */}
            <div className="sticky top-0 h-[60vh] w-full overflow-hidden bg-slate-950 z-0">
                <motion.div style={{ scale: mediaScale, y: mediaY }} className="h-full w-full">
                    <MediaCarousel media={memory.media || []} onIndexChange={(idx) => setActiveIndex(idx)} />
                </motion.div>
                <motion.div style={{ opacity: overlayOpacity }} className="absolute inset-0 bg-black z-10 pointer-events-none" />

                {/* Header Actions */}
                <div className="absolute top-12 left-0 right-0 px-6 flex justify-between items-center z-30">
                    <button onClick={() => router.back()} className="p-3 bg-white/10 backdrop-blur-xl rounded-2xl text-white border border-white/20">
                        <ChevronLeft size={24} />
                    </button>

                    <div className="flex gap-2 p-1.5 bg-black/20 backdrop-blur-xl border border-white/10 rounded-[1.5rem]">
                        {isEditing ? (
                            <button onClick={handleSaveChanges} disabled={isSaving} className="w-11 h-11 flex items-center justify-center rounded-xl bg-emerald-500 text-white">
                                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Check size={20} />}
                            </button>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/10 text-white">
                                <Edit2 size={18} />
                            </button>
                        )}
                        <label className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/10 text-white cursor-pointer active:scale-90 transition-transform">
                            {isUploadingMedia ? <Loader2 className="animate-spin" size={18} /> : <Plus size={20} />}
                            <input type="file" className="hidden" multiple accept="image/*,video/*" onChange={handleAddMedia} disabled={isUploadingMedia || isEditing} />
                        </label>
                        <button onClick={handleDownload} disabled={isDownloading} className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/10 text-white">
                            {isDownloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. SCRAPBOOK SHEET */}
            <div className="relative z-20 min-h-[60vh] bg-white rounded-t-[3.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] -mt-12 p-8 pb-48">
                <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-10" />

                <header className="mb-12">
                    <button
                        disabled={!isEditing}
                        onClick={() => setIsPickerOpen(true)}
                        className={`px-4 py-1.5 rounded-full flex items-center gap-2 border transition-all mb-4 ${isEditing ? 'bg-memoryes-primary text-white animate-pulse' : 'bg-memoryes-soft/50 text-memoryes-primary border-memoryes-primary/10'}`}
                    >
                        {isEditing ? <Navigation size={12} /> : <MapPin size={12} />}
                        <span className="text-[10px] font-black uppercase tracking-widest">{isEditing ? "Change Spot" : memory.location?.name}</span>
                    </button>

                    {isEditing ? (
                        <input autoFocus className="w-full bg-slate-50 border-b-2 border-memoryes-primary p-3 text-3xl font-serif italic" value={editedTitle} onChange={e => setEditedTitle(e.target.value)} />
                    ) : (
                        <h1 className="text-4xl font-serif italic text-slate-800 leading-tight">{memory.title}</h1>
                    )}
                </header>

                {/* PERSPECTIVES */}
                <div className="space-y-10">
                    {memory.perspectives?.map((p: any) => (
                        <div key={p._id} className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-memoryes-soft flex-shrink-0 flex items-center justify-center font-black text-memoryes-primary">{p.userName.charAt(0)}</div>
                            <div className="flex-1 bg-slate-50 p-6 rounded-[2.5rem] rounded-tl-none relative border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{p.userName}</p>
                                <p className="text-lg font-serif italic text-slate-600">"{p.content}"</p>
                                <div className="flex gap-2 mt-6">
                                    <ReactionBtn active={p.reactions?.some((r: any) => r.userId === user?._id && r.type === 'heart')} icon={<Heart size={14} />} count={p.reactions?.filter((r: any) => r.type === 'heart').length} onClick={() => handleReaction(p._id, 'heart')} color="bg-rose-500" />
                                    <ReactionBtn active={p.reactions?.some((r: any) => r.userId === user?._id && r.type === 'like')} icon={<ThumbsUp size={14} />} count={p.reactions?.filter((r: any) => r.type === 'like').length} onClick={() => handleReaction(p._id, 'like')} color="bg-blue-500" />
                                    <ReactionBtn active={p.reactions?.some((r: any) => r.userId === user?._id && r.type === 'laugh')} icon={<Smile size={14} />} count={p.reactions?.filter((r: any) => r.type === 'laugh').length} onClick={() => handleReaction(p._id, 'laugh')} color="bg-amber-500" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-white via-white to-transparent pt-10">
                <AddPerspective memoryId={memory._id} onUpdate={(updated: any) => setMemory(updated)} />
            </div>

            <LocationPicker isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} initialCoords={editedCoords} onSelect={(c) => setEditedCoords(c)} />
        </div>
    );
}

function ReactionBtn({ icon, count, onClick, active, color }: any) {
    return (
        <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all border ${active ? `${color} text-white border-transparent` : 'bg-white text-slate-400 border-slate-100'}`}>
            {icon} {count > 0 && <span className="text-[10px] font-black">{count}</span>}
        </button>
    );
}

/**
 * WRAPPER COMPONENT: Handles API fetching and Suspense.
 */
function MemoryPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get('id');

    const [memory, setMemory] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            try {
                const { data: userData } = await apiClient.get('/api/auth/me/');
                setUser(userData);
                const { data: memData } = await apiClient.get(`/api/memories/single/?id=${id}`);
                setMemory(memData);
            } catch (err) {
                router.push('/dashboard');
            } finally {
                setLoading(false);
            }
        };
        if (id) init();
    }, [id, router]);

    if (loading || !memory) return <div className="h-screen flex items-center justify-center bg-memoryes-background"><Loader2 className="animate-spin text-memoryes-primary" /></div>;

    return <MemoryScrollUI memory={memory} user={user} setMemory={setMemory} />;
}

/**
 * THE DEFAULT EXPORT: Every Next.js page must have this.
 */
export default function MemoryPage() {
    return (
        <Suspense fallback={null}>
            <MemoryPageContent />
        </Suspense>
    );
}