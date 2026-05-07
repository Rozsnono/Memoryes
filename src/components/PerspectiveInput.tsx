"use client";
import { useState } from "react";
import { Mic, Send, Smile } from "lucide-react";
import { motion } from "framer-motion";

export const PerspectiveInput = () => {
    const [text, setText] = useState("");

    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-slate-100 pb-10">
            <div className="max-w-md mx-auto flex items-end gap-2">
                <div className="flex-1 bg-slate-50 rounded-[2rem] p-2 flex items-end border border-slate-200">
                    <button className="p-2 text-slate-400 hover:text-memoria-primary">
                        <Smile size={24} />
                    </button>

                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="How did you experience this?"
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-2 max-h-32 resize-none"
                        rows={1}
                    />

                    <button className="p-2 text-slate-400 hover:text-memoria-primary">
                        <Mic size={24} />
                    </button>
                </div>

                <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="w-12 h-12 bg-memoria-clay rounded-full flex items-center justify-center text-white shadow-lg disabled:opacity-50"
                    disabled={!text}
                >
                    <Send size={20} />
                </motion.button>
            </div>
        </div>
    );
};