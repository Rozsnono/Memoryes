// components/AddPerspective.tsx
"use client";

import { useEffect, useState } from "react";
import { Send, Mic, Smile, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";

export const AddPerspective = ({ memoryId, onUpdate }: { memoryId: string, onUpdate: (updated: any) => void }) => {
    const [text, setText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: userData } = await apiClient.get('/api/auth/me/');
            setUser(userData);
        };
        fetchUserData();
    }, []);

    const handleSubmit = async () => {
        if (!text.trim()) return;
        setIsSubmitting(true);

        try {
            const { data } = await apiClient.post('/api/memories/perspective/', {
                memoryId,
                userId: user?.id, // Use the fetched user ID
                userName: user?.name,    // Use the fetched user name
                content: text
            });

            setText("");
            onUpdate(data); // Refresh the detail view with new data
        } catch (err) {
            toast.error("Failed to save perspective");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-xl border-t border-slate-100 pb-10 z-[110]">
            <div className="max-w-md mx-auto flex items-end gap-3">
                <div className="flex-1 bg-slate-50 rounded-[2rem] p-2 flex items-end border border-slate-200">
                    <button className="p-2 text-slate-300">
                        <Smile size={24} />
                    </button>

                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Your perspective..."
                        rows={1}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-2 max-h-32 resize-none outline-none text-memoryes-clay"
                    />

                    <button className="p-2 text-slate-300">
                        <Mic size={24} />
                    </button>
                </div>

                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleSubmit}
                    disabled={!text || isSubmitting}
                    className="w-12 h-12 bg-memoryes-clay rounded-full flex items-center justify-center text-white shadow-lg disabled:opacity-30"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                </motion.button>
            </div>
        </div>
    );
};