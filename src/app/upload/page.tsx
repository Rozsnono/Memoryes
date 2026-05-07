"use client";

import { useState, useEffect } from "react";
import { X, Image as ImageIcon, Loader2, CheckCircle2, MapPin, Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "@/lib/apiClient";

export default function UploadPage() {
    const router = useRouter();

    // Data State
    const [user, setUser] = useState<any>(null);

    // UI State Management
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [step, setStep] = useState<'select' | 'details'>('select');

    // 1. Fetch User and Active Space on Mount
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data } = await apiClient.get('/api/auth/me');
                setUser(data);
            } catch (err) {
                console.error("Failed to fetch user context for upload");
                // If not logged in, redirect to login
                router.push('/login');
            }
        };
        fetchUser();
    }, [router]);

    // 2. Handle File Selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
            setStep('details');
        }
    };

    // 3. The Upload Engine
    const handleFinalUpload = async () => {
        if (!file || !title) return alert("Please provide a title and image");
        if (!user || !user.activeSpace) return alert("No active space found. Please create or join a space first.");

        setIsUploading(true);
        try {
            // A. Get Geolocation
            const getCoords = (): Promise<number[]> => {
                return new Promise((resolve) => {
                    navigator.geolocation.getCurrentPosition(
                        (p) => resolve([p.coords.longitude, p.coords.latitude]),
                        () => resolve([0, 0]),
                        { timeout: 5000 }
                    );
                });
            };
            const coords = await getCoords();

            // B. Get Secure Signature from our API
            // Note: Trailing slash depends on your specific backend config, 
            // usually better without if using App Router.
            const { data: signData } = await apiClient.post('/api/media/sign');

            // C. Direct Upload to Cloudinary
            const formData = new FormData();
            formData.append('file', file);
            formData.append('api_key', signData.apiKey);
            formData.append('timestamp', signData.timestamp);
            formData.append('signature', signData.signature);
            formData.append('folder', 'memoria_vault');

            const cloudRes = await fetch(
                `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
                { method: 'POST', body: formData }
            );
            const cloudData = await cloudRes.json();

            if (cloudData.error) throw new Error(cloudData.error.message);

            // D. Save Metadata to MongoDB using dynamic User & Space data
            await apiClient.post('/api/memories', {
                title,
                spaceId: user.activeSpace, // Dynamically uses the active vault
                creatorId: user._id,       // Dynamically uses current user ID
                media: [{
                    url: cloudData.secure_url,
                    publicId: cloudData.public_id,
                    mediaType: 'image'
                }],
                location: {
                    name: "Captured Location",
                    coordinates: coords
                },
                capturedAt: new Date(),
                isPinned: false // Default to not pinned
            });

            // E. Success & Redirect
            router.push('/dashboard');
        } catch (err: any) {
            console.error(err);
            alert("Upload failed: " + (err.response?.data?.error || err.message));
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-memoria-clay text-white p-6 pb-20">
            {/* Header */}
            <header className="flex justify-between items-center mb-10 pt-6">
                <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X size={28} />
                </button>
                {step === 'details' && (
                    <button
                        onClick={handleFinalUpload}
                        disabled={isUploading || !title || !user}
                        className="bg-white text-memoria-clay px-6 py-2 rounded-full font-bold text-sm disabled:opacity-50 flex items-center gap-2"
                    >
                        {isUploading ? <Loader2 className="animate-spin size={16}" /> : "Share"}
                    </button>
                )}
            </header>

            <AnimatePresence mode="wait">
                {step === 'select' ? (
                    <motion.div
                        key="select"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                    >
                        <div>
                            <h1 className="text-4xl font-serif italic mb-2">Capture a moment</h1>
                            <p className="text-slate-400">Add a new chapter to your story.</p>
                        </div>

                        <div className="grid gap-4">
                            <label className="bg-white/10 backdrop-blur-md p-8 rounded-[2.5rem] flex flex-col items-center gap-4 border border-white/10 cursor-pointer active:scale-95 transition-all">
                                <div className="w-16 h-16 bg-white text-memoria-clay rounded-2xl flex items-center justify-center shadow-lg">
                                    <ImageIcon size={32} />
                                </div>
                                <div className="text-center">
                                    <h3 className="font-bold text-lg">Photo Library</h3>
                                    <p className="text-xs text-slate-400">Choose from your camera roll</p>
                                </div>
                                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            </label>

                            <div className="bg-white/5 p-6 rounded-[2rem] flex items-center gap-6 opacity-50 grayscale cursor-not-allowed">
                                <div className="bg-white/10 p-3 rounded-2xl"><Camera size={24} /></div>
                                <div>
                                    <h3 className="font-bold">Live Camera</h3>
                                    <p className="text-xs text-slate-400">SNAP Feature coming soon</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="details"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        {/* Preview Image */}
                        <div className="relative aspect-[4/5] w-full rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/10">
                            <img src={preview!} className="w-full h-full object-cover" alt="Preview" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute bottom-6 left-6 right-6 flex items-center gap-2">
                                <MapPin size={16} className="text-memoria-accent" />
                                <span className="text-xs font-bold uppercase tracking-widest text-white/80">
                                    {user?.activeSpace ? `Saving to your Active Vault` : 'Tagging Location...'}
                                </span>
                            </div>
                        </div>

                        {/* Input fields */}
                        <div className="space-y-4">
                            <input
                                autoFocus
                                placeholder="Write a title for this memory..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-transparent border-b border-white/20 py-4 text-xl font-serif italic outline-none focus:border-white transition-colors"
                            />

                            <div className="bg-white/10 p-4 rounded-2xl flex items-center gap-3 border border-white/5">
                                <div className="w-8 h-8 rounded-full bg-memoria-accent flex items-center justify-center text-memoria-clay shadow-sm">
                                    <CheckCircle2 size={16} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-slate-100 font-bold">Collaborative Memory</p>
                                    <p className="text-[10px] text-slate-300">This will be visible to everyone in your current space.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}