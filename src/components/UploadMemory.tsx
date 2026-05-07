"use client";

import { useState } from 'react';
import { Camera, X, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '@/lib/apiClient';

export const UploadMemory = ({ isOpen, onClose, onRefresh }: any) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
        }
    };

    const handleUpload = async () => {
        if (!file || !title) return alert("Please add a photo and a title");

        const getLocation = () => {
            return new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    (pos) => resolve([pos.coords.longitude, pos.coords.latitude]),
                    () => resolve([0, 0]) // Fallback
                );
            });
        };

        const coords = await getLocation();

        setIsUploading(true);
        try {
            // 1. Get Signature from our API
            const { data: signData } = await apiClient.post('/api/media/sign');

            // 2. Upload directly to Cloudinary
            const formData = new FormData();
            formData.append('file', file);
            formData.append('api_key', signData.apiKey);
            formData.append('timestamp', signData.timestamp);
            formData.append('signature', signData.signature);
            formData.append('folder', 'memoria_vault');

            const cloudinaryRes = await fetch(
                `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
                { method: 'POST', body: formData }
            );
            const cloudinaryData = await cloudinaryRes.json();

            // 3. Save to MongoDB
            await apiClient.post('/api/memories', {
                title,
                spaceId: "family_vault_1",
                creatorId: "user_123",
                media: [{
                    url: cloudinaryData.secure_url,
                    publicId: cloudinaryData.public_id,
                    mediaType: 'image'
                }],
                location: {
                    name: "New Discovery",
                    coordinates: coords // Use the real coordinates here!
                },
                capturedAt: new Date(),
            });

            onRefresh();
            onClose();
            setFile(null);
            setPreview(null);
            setTitle("");
        } catch (error) {
            console.error(error);
            alert("Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end justify-center"
                >
                    <motion.div
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                        className="w-full max-w-md bg-white rounded-t-[3rem] p-8 pb-12"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-serif italic text-memoria-clay">New Memory</h2>
                            <button onClick={onClose} className="p-2 bg-slate-100 rounded-full"><X size={20} /></button>
                        </div>

                        {!preview ? (
                            <label className="w-full h-64 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-3 cursor-pointer active:bg-slate-50 transition-colors">
                                <div className="w-16 h-16 bg-memoria-soft rounded-full flex items-center justify-center text-memoria-primary">
                                    <Camera size={32} />
                                </div>
                                <span className="text-sm font-medium text-slate-400">Tap to select a photo</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            </label>
                        ) : (
                            <div className="space-y-4">
                                <div className="relative w-full h-64 rounded-[2rem] overflow-hidden shadow-lg">
                                    <img src={preview} className="w-full h-full object-cover" />
                                    <button onClick={() => setPreview(null)} className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md"><X size={16} /></button>
                                </div>
                                <input
                                    placeholder="Give this moment a title..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-transparent focus:border-memoria-primary transition-all"
                                />
                                <button
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                    className="w-full py-4 bg-memoria-clay text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                                >
                                    {isUploading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />}
                                    {isUploading ? "Uploading to Vault..." : "Save Memory"}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};