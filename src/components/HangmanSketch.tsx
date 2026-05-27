"use client";
import { motion } from "framer-motion";

export const HangmanSketch = ({ mistakes }: { mistakes: number }) => {
    const parts = [
        <circle key="head" cx="150" cy="60" r="20" stroke="#4A4E69" strokeWidth="4" fill="none" />,
        <line key="body" x1="150" y1="80" x2="150" y2="140" stroke="#4A4E69" strokeWidth="4" />,
        <line key="l-arm" x1="150" y1="90" x2="120" y2="120" stroke="#4A4E69" strokeWidth="4" />,
        <line key="r-arm" x1="150" y1="90" x2="180" y2="120" stroke="#4A4E69" strokeWidth="4" />,
        <line key="l-leg" x1="150" y1="140" x2="120" y2="180" stroke="#4A4E69" strokeWidth="4" />,
        <line key="r-leg" x1="150" y1="140" x2="180" y2="180" stroke="#4A4E69" strokeWidth="4" />,
    ];

    return (
        <svg width="200" height="220" viewBox="0 0 200 220" className="mx-auto">
            {/* The Stand (Always visible) */}
            <path d="M20 200 L180 200 M60 200 L60 20 L150 20 L150 40" stroke="#E6E6FA" strokeWidth="6" fill="none" strokeLinecap="round" />
            
            <AnimatePresence>
                {parts.slice(0, mistakes).map((part, i) => (
                    <motion.g 
                        key={i}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        {part}
                    </motion.g>
                ))}
            </AnimatePresence>
        </svg>
    );
};
import { AnimatePresence } from "framer-motion";