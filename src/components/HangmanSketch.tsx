"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Image as ImageIcon } from "lucide-react";

export const HangmanSketch = ({ mistakes }: { mistakes: number }) => {
    // 6 Lives = 6 Polaroids on the string
    const photos = [
        { id: 1, x: 40, color: "#9B86BD", rotate: -5 },
        { id: 2, x: 90, color: "#FFD1DC", rotate: 3 },
        { id: 3, x: 140, color: "#E0F2F1", rotate: -2 },
        { id: 4, x: 190, color: "#FFF1EB", rotate: 6 },
        { id: 5, x: 240, color: "#E6E6FA", rotate: -4 },
        { id: 6, x: 290, color: "#FFD1DC", rotate: 2 },
    ];

    return (
        <div className="relative flex flex-col items-center justify-center py-12 w-full overflow-hidden">
            {/* 1. The Clothesline / String */}
            <div className="absolute top-[45px] left-0 right-0 h-[2px] bg-slate-200 z-0 mx-8 opacity-50" />

            <svg
                width="340"
                height="200"
                viewBox="0 0 340 200"
                className="relative z-10 overflow-visible"
            >
                <AnimatePresence>
                    {photos.map((photo, index) => {
                        // Logic: Mistakes=0 shows 6, Mistakes=1 shows 5, etc.
                        const isVisible = index < (6 - mistakes);

                        return isVisible ? (
                            <motion.g
                                key={photo.id}
                                initial={{ opacity: 0, y: -20 }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                    rotate: photo.rotate,
                                    transition: { type: "spring", stiffness: 100 }
                                }}
                                exit={{
                                    y: 300,
                                    x: photo.x + (Math.random() * 40 - 20),
                                    rotate: photo.rotate + 45,
                                    opacity: 0,
                                    transition: { duration: 1, ease: "easeIn" }
                                }}
                                style={{ originX: `${photo.x}px`, originY: "40px" }}
                            >
                                {/* The Wooden Clip */}
                                <rect
                                    x={photo.x - 4} y="35" width="8" height="15"
                                    fill="#D2B48C" rx="2"
                                    stroke="#8B4513" strokeWidth="1"
                                />

                                {/* The Polaroid Frame */}
                                <rect
                                    x={photo.x - 20} y="50" width="40" height="50"
                                    fill="white" rx="2"
                                    className="shadow-md"
                                    stroke="#E2E8F0" strokeWidth="1"
                                />

                                {/* The "Photo" Area */}
                                <rect
                                    x={photo.x - 16} y="54" width="32" height="34"
                                    fill={photo.color} rx="1"
                                    opacity="0.8"
                                />

                                {/* Little decorative icon inside photo */}
                                <g opacity="0.2" transform={`translate(${photo.x - 6}, 65) scale(0.5)`}>
                                    <ImageIcon size={24} color="white" />
                                </g>
                            </motion.g>
                        ) : null;
                    })}
                </AnimatePresence>
            </svg>

            {/* 3. Status Information */}
            <div className="mt-10 flex flex-col items-center gap-3">
                <div className="flex gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <motion.div
                            key={i}
                            initial={false}
                            animate={{
                                scale: i < (6 - mistakes) ? 1 : 0.6,
                                backgroundColor: i < (6 - mistakes) ? "#9B86BD" : "#E2E8F0",
                            }}
                            className="w-2 h-2 rounded-full"
                        />
                    ))}
                </div>
                <div className="bg-white/80 backdrop-blur-md px-5 py-2 rounded-full shadow-sm border border-slate-50 flex items-center gap-2">
                    <Camera size={14} className="text-memoria-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[3px] text-memoria-clay">
                        {6 - mistakes} Moments Remaining
                    </span>
                </div>
            </div>
        </div>
    );
};