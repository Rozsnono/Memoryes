"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

interface LightboxProps {
    image: any;
    onClose: () => void;
}

export const ImageLightbox = ({ image, onClose }: LightboxProps) => {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        if (!image?.url) return;
        setIsDownloading(true);
        const toastId = toast.loading("Downloading high-res image...");

        try {
            const response = await fetch(image.url);
            const blob = await response.blob();

            if (Capacitor.isNativePlatform()) {
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = async () => {
                    const base64Data = reader.result as string;
                    await Filesystem.writeFile({
                        path: `memoryes_gal_${Date.now()}.jpg`,
                        data: base64Data,
                        directory: Directory.Documents,
                    });
                    toast.success("Saved to gallery", { id: toastId });
                };
            } else {
                const blobUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = `memoryes_download.jpg`;
                link.click();
                window.URL.revokeObjectURL(blobUrl);
                toast.success("Downloaded", { id: toastId });
            }
        } catch (err) {
            toast.error("Download failed");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-4"
        >
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-6 pt-12 flex justify-between items-center z-[210]">
                <button
                    onClick={onClose}
                    className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white active:scale-90 transition-transform"
                >
                    <X size={24} />
                </button>

                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white active:scale-90 transition-transform flex items-center gap-2"
                >
                    {isDownloading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                </button>
            </div>

            {/* Image Canvas */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full h-full flex items-center justify-center"
                onClick={onClose}
            >
                <img
                    src={image.url}
                    className="max-w-full max-h-[80vh] object-contain shadow-2xl rounded-lg"
                    alt="Full screen"
                    onClick={(e) => e.stopPropagation()} // Prevent close when clicking image
                />
            </motion.div>

            {/* Bottom Info */}
            <div className="absolute bottom-10 text-center pointer-events-none">
                <p className="text-white/40 text-[10px] font-black uppercase tracking-[4px]">
                    memoryes Vault HD
                </p>
            </div>
        </motion.div>
    );
};