"use client";

import { useState } from 'react';
import { Camera, X, Loader2, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';

export const UploadMemory = ({ isOpen, onClose, onRefresh, user }: any) => {
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
    if (!file || !title) return toast.error("Please add a photo and a title");
    if (!user?.activeSpace) return toast.error("No active space found");

    setIsUploading(true);
    try {
      // 1. Get Signature
      const { data: signData } = await apiClient.post('/api/media/sign');

      // 2. Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signData.apiKey);
      formData.append('timestamp', signData.timestamp);
      formData.append('signature', signData.signature);
      formData.append('folder', 'memoryes_vault');

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );
      const cloudData = await cloudRes.json();

      // 3. Save to MongoDB with real user/space IDs
      await apiClient.post('/api/memories', {
        title,
        spaceId: user.activeSpace,
        creatorId: user._id,
        media: [{
          url: cloudData.secure_url,
          publicId: cloudData.public_id,
          mediaType: 'image'
        }],
        location: { name: "Current Spot", coordinates: [0, 0] },
        capturedAt: new Date(),
      });

      onRefresh(); // Refresh Dashboard grid
      onClose();   // Close modal
      setFile(null);
      setPreview(null);
      setTitle("");
    } catch (error) {
      console.error(error);
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            className="fixed bottom-0 left-0 right-0 z-[210] bg-white rounded-t-[3rem] p-8 pb-12 max-w-md mx-auto shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-serif italic text-memoryes-clay">Capture Moment</h2>
              <button onClick={onClose} className="p-2 bg-slate-100 rounded-full"><X size={20} /></button>
            </div>

            {!preview ? (
              <label className="w-full h-64 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="w-16 h-16 bg-memoryes-soft rounded-2xl flex items-center justify-center text-memoryes-primary shadow-sm">
                  <Camera size={32} />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select from Library</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            ) : (
              <div className="space-y-4">
                <div className="relative w-full h-64 rounded-[2.5rem] overflow-hidden shadow-lg border-4 border-white">
                  <img src={preview} className="w-full h-full object-cover" alt="preview" />
                  <button onClick={() => setPreview(null)} className="absolute top-4 right-4 p-2 bg-white/80 rounded-full shadow-md"><X size={16} /></button>
                </div>
                <input
                  placeholder="What is this memory called?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-5 bg-slate-50 rounded-2xl outline-none border border-transparent focus:border-memoryes-primary transition-all text-sm font-bold"
                />
                <button
                  onClick={handleUpload}
                  disabled={isUploading || !title}
                  className="w-full py-5 bg-memoryes-clay text-white rounded-[1.5rem] font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />}
                  {isUploading ? "Preserving..." : "Save to Vault"}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};