"use client";

import { useState, useEffect } from "react";
import { X, Image as ImageIcon, Loader2, CheckCircle2, MapPin, Camera, ChevronLeft, Sparkles, Navigation } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";
import dynamic from "next/dynamic";

// Dynamically import LocationPicker to prevent "window is not defined" error in Next.js
const LocationPicker = dynamic(
    () => import("@/components/LocationPicker").then((mod) => mod.LocationPicker),
    { ssr: false }
);

export default function UploadPage() {
    const router = useRouter();

    // Data State
    const [user, setUser] = useState<any>(null);
    const [coords, setCoords] = useState<[number, number]>([19.0402, 47.4979]); // Default Budapest
    const [isLocationManual, setIsLocationManual] = useState(false);

    // UI Logic State
    const [step, setStep] = useState<'select' | 'details' | 'success'>('select');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    // 1. Authenticate context and try auto-detect location
    useEffect(() => {
        apiClient.get('/api/auth/me/').then(res => {
            setUser(res.data);
            // Auto-detect current GPS on page load
            navigator.geolocation.getCurrentPosition(
                p => setCoords([p.coords.longitude, p.coords.latitude]),
                () => console.warn("GPS access denied, using default")
            );
        }).catch(() => router.push('/login'));
    }, [router]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
            setStep('details');
        }
    };

    const handleFinalUpload = async () => {
        if (!file || !title || !user?.activeSpace) return;
        setIsUploading(true);
        const toastId = toast.loading("Preserving your memory...");

        try {
            // A. Get Cloudinary Signature
            const { data: signData } = await apiClient.post('/api/media/sign/');

            // B. Cloudinary Upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('api_key', signData.apiKey);
            formData.append('timestamp', signData.timestamp);
            formData.append('signature', signData.signature);
            formData.append('folder', 'memoryes_vault');

            const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`, {
                method: 'POST', body: formData
            });
            const cloudData = await cloudRes.json();

            // C. Save to MongoDB
            await apiClient.post('/api/memories/', {
                title,
                spaceId: user.activeSpace,
                creatorId: user._id,
                media: [{ url: cloudData.secure_url, publicId: cloudData.public_id, mediaType: 'image' }],
                location: {
                    name: isLocationManual ? "Manual Pinned Spot" : "Detected Location",
                    coordinates: coords
                },
                capturedAt: new Date()
            });

            toast.success("Memory saved to vault", { id: toastId });
            setStep('success');
            setTimeout(() => router.push('/dashboard'), 1500);
        } catch (err) {
            toast.error("Upload failed", { id: toastId });
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-memoryes-clay text-white p-6 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="flex justify-between items-center h-20 z-50">
                <button
                    onClick={() => step === 'details' ? setStep('select') : router.back()}
                    className="p-2 bg-white/10 rounded-full active:scale-90 transition-transform"
                >
                    <ChevronLeft size={24} />
                </button>
                <span className="text-[10px] font-black uppercase tracking-[3px] opacity-40 italic">New Fragment</span>
                <div className="w-10" />
            </header>

            <AnimatePresence mode="wait">
                {/* STEP 1: SELECT */}
                {step === 'select' && (
                    <motion.div key="select" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col justify-center space-y-12">
                        <div className="text-center">
                            <h1 className="text-4xl font-serif italic mb-2">What happened?</h1>
                            <p className="text-slate-400">Select a memory to keep forever.</p>
                        </div>
                        <label className="bg-white/5 p-10 rounded-[4rem] border-2 border-dashed border-white/10 flex flex-col items-center gap-4 cursor-pointer active:scale-95 transition-all">
                            <div className="w-20 h-20 bg-white text-memoryes-clay rounded-[2.5rem] flex items-center justify-center shadow-2xl">
                                <ImageIcon size={40} />
                            </div>
                            <span className="font-bold tracking-widest text-xs uppercase opacity-60">Open Library</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                    </motion.div>
                )}

                {/* STEP 2: DETAILS */}
                {step === 'details' && (
                    <motion.div key="details" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 flex-1 overflow-y-auto no-scrollbar pb-10">
                        <div className="relative aspect-square w-full rounded-[4rem] overflow-hidden border-4 border-white/10 shadow-2xl">
                            <img src={preview!} className="w-full h-full object-cover" alt="" />

                            {/* Manual Location Overlay */}
                            <button
                                onClick={() => setIsPickerOpen(true)}
                                className="absolute bottom-6 right-6 bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/30 text-white flex items-center gap-2 active:scale-95 transition-all shadow-lg"
                            >
                                <Navigation size={14} className={isLocationManual ? "text-memoryes-accent" : "text-white"} />
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    {isLocationManual ? "Spot Adjusted" : "Edit Location"}
                                </span>
                            </button>

                            <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                                <MapPin size={14} className="text-memoryes-accent" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">
                                    {isLocationManual ? "Pinned" : "GPS Detected"}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-[3px] text-white/30 ml-4">Memory Title</label>
                                <input
                                    autoFocus
                                    placeholder="Enter title..."
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full bg-transparent border-b-2 border-white/10 py-4 text-3xl font-serif italic outline-none focus:border-white transition-all text-white placeholder:text-white/20"
                                />
                            </div>

                            <button
                                onClick={handleFinalUpload}
                                disabled={isUploading || !title}
                                className="w-full bg-white text-memoryes-clay py-6 rounded-[2.5rem] font-black uppercase tracking-[3px] shadow-2xl flex items-center justify-center gap-3 disabled:opacity-30 active:scale-95 transition-transform mt-4"
                            >
                                {isUploading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24} />}
                                {isUploading ? "Syncing..." : "Save to Vault"}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 3: SUCCESS */}
                {step === 'success' && (
                    <motion.div key="success" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                        <div className="w-28 h-28 bg-emerald-500 rounded-[3rem] flex items-center justify-center shadow-lg shadow-emerald-500/40 relative">
                            <Sparkles className="text-white" size={48} />
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute -inset-4 border-2 border-dashed border-emerald-500/30 rounded-full" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-4xl font-serif italic">Preserved.</h2>
                            <p className="text-slate-400 font-medium">Your memory is safe in the vault.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* THE LOCATION PICKER MODAL */}
            <LocationPicker
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                initialCoords={coords}
                onSelect={(newCoords) => {
                    setCoords(newCoords);
                    setIsLocationManual(true);
                    toast.success("Location manually adjusted");
                }}
            />
        </div>
    );
}