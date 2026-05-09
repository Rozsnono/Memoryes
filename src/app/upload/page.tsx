"use client";

import { useState, useEffect } from "react";
import { X, Image as ImageIcon, Loader2, CheckCircle2, MapPin, Camera, ChevronLeft, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";

export default function UploadPage() {
    const router = useRouter();

    // Data State
    const [user, setUser] = useState<any>(null);
    
    // UI Logic State
    const [step, setStep] = useState<'select' | 'details' | 'success'>('select');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    // 1. Authenticate the action context
    useEffect(() => {
        apiClient.get('/api/auth/me/').then(res => setUser(res.data)).catch(() => router.push('/login'));
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

        try {
            // A. Geolocation
            const coords = await new Promise<number[]>((res) => {
                navigator.geolocation.getCurrentPosition(p => res([p.coords.longitude, p.coords.latitude]), () => res([0,0]), { timeout: 3000 });
            });

            // B. Cloudinary Signature
            const { data: signData } = await apiClient.post('/api/media/sign/');

            // C. Cloudinary Upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('api_key', signData.apiKey);
            formData.append('timestamp', signData.timestamp);
            formData.append('signature', signData.signature);
            formData.append('folder', 'memoryes_vault');

            const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`, { method: 'POST', body: formData });
            const cloudData = await cloudRes.json();

            // D. MongoDB Save
            await apiClient.post('/api/memories/', {
                title,
                spaceId: user.activeSpace,
                creatorId: user._id,
                media: [{ url: cloudData.secure_url, publicId: cloudData.public_id, mediaType: 'image' }],
                location: { name: "New Memory", coordinates: coords },
                capturedAt: new Date()
            });

            setStep('success');
            setTimeout(() => router.push('/dashboard'), 1500);
        } catch (err) {
            toast.error("Preservation failed. Please try again.");
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-memoryes-clay text-white p-6 flex flex-col">
            {/* Header */}
            <header className="flex justify-between items-center h-20">
                <button onClick={() => step === 'details' ? setStep('select') : router.back()} className="p-2 bg-white/10 rounded-full">
                    <ChevronLeft size={24} />
                </button>
                <span className="text-[10px] font-black uppercase tracking-[3px] opacity-40">Capture Moment</span>
                <div className="w-10" /> {/* Spacer */}
            </header>

            <AnimatePresence mode="wait">
                {step === 'select' && (
                    <motion.div key="select" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col justify-center space-y-12">
                        <div className="text-center">
                            <h1 className="text-4xl font-serif italic mb-2">What happened?</h1>
                            <p className="text-slate-400">Select a memory to keep forever.</p>
                        </div>
                        <label className="bg-white/10 p-10 rounded-[3rem] border border-dashed border-white/20 flex flex-col items-center gap-4 cursor-pointer active:scale-95 transition-all">
                            <div className="w-20 h-20 bg-white text-memoryes-clay rounded-[2rem] flex items-center justify-center shadow-2xl">
                                <ImageIcon size={40} />
                            </div>
                            <span className="font-bold tracking-wide">Photo Library</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                    </motion.div>
                )}

                {step === 'details' && (
                    <motion.div key="details" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                        <div className="relative aspect-square w-full rounded-[3rem] overflow-hidden border-4 border-white/10 shadow-2xl">
                            <img src={preview!} className="w-full h-full object-cover" alt="" />
                            <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                                <MapPin size={14} className="text-memoryes-accent" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white">Detecting Location...</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <input autoFocus placeholder="Title your memory..." value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-transparent border-b border-white/20 py-4 text-2xl font-serif italic outline-none focus:border-white transition-all" />
                            <button 
                                onClick={handleFinalUpload} 
                                disabled={isUploading || !title} 
                                className="w-full bg-white text-memoryes-clay py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 disabled:opacity-30"
                            >
                                {isUploading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />}
                                {isUploading ? "Uploading..." : "Save to Vault"}
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 'success' && (
                    <motion.div key="success" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center shadow-lg shadow-emerald-500/40">
                            <Sparkles className="text-white" size={48} />
                        </div>
                        <h2 className="text-3xl font-serif italic">Preserved.</h2>
                        <p className="text-slate-400">Your memory is safe in the vault.</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}