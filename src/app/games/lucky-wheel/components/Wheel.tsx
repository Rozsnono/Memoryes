'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export interface WheelSegment {
    value: number | 'LOST' | 'SKIP';
    color: string;
}

const WHEEL_SEGMENTS: WheelSegment[] = [
    { value: 900, color: '#9B86BD' }, // Lavender
    { value: 550, color: '#FFD1DC' }, // Rose
    { value: 800, color: '#E0F2F1' }, // Mint
    { value: 350, color: '#FFF1EB' }, // Peach
    { value: 450, color: '#9B86BD' },
    { value: 'SKIP', color: '#4A4E69' }, // Clay
    { value: 700, color: '#FFD1DC' },
    { value: 300, color: '#E0F2F1' },
    { value: 400, color: '#9B86BD' },
    { value: 500, color: '#FFF1EB' },
    { value: 250, color: '#FFD1DC' },
    { value: 600, color: '#E0F2F1' },
    { value: 300, color: '#9B86BD' },
    { value: 500, color: '#4A4E69' },
    { value: 250, color: '#E0F2F1' },
    { value: 600, color: '#FFD1DC' },
    { value: 'LOST', color: '#111827' }, // Deep Slate
    { value: 300, color: '#9B86BD' },
    { value: 600, color: '#FFF1EB' },
    { value: 250, color: '#E0F2F1' },
    { value: 500, color: '#FFD1DC' },
    { value: 400, color: '#9B86BD' },
    { value: 1000, color: '#E0F2F1' },
    { value: 250, color: '#FFF1EB' },
    { value: 300, color: '#FFD1DC' }
];

interface WheelProps {
    onSpinComplete: (segment: WheelSegment) => void;
    isSpinning: boolean;
    setIsSpinning: (state: boolean) => void;
}

export default function Wheel({ onSpinComplete, isSpinning, setIsSpinning }: WheelProps) {
    const [rotation, setRotation] = useState<number>(0);
    const wheelRef = useRef<SVGSVGElement | null>(null);
    const segmentAngle = 360 / WHEEL_SEGMENTS.length;

    const onSpinCompleteRef = useRef(onSpinComplete);
    const setIsSpinningRef = useRef(setIsSpinning);

    onSpinCompleteRef.current = onSpinComplete;
    setIsSpinningRef.current = setIsSpinning;

    useEffect(() => {
        if (isSpinning) {
            const additionalRotation = Math.floor(Math.random() * 360);
            let finalRotation = 0;

            setRotation((prevRotation) => {
                finalRotation = prevRotation + 2160 + additionalRotation;
                return finalRotation;
            });

            const timer = setTimeout(() => {
                setIsSpinningRef.current(false);
                const degreesNormalized = (360 - (finalRotation % 360)) % 360;
                const targetSegmentIndex = Math.floor(degreesNormalized / segmentAngle) % WHEEL_SEGMENTS.length;
                onSpinCompleteRef.current(WHEEL_SEGMENTS[targetSegmentIndex]);
            }, 4500);

            return () => clearTimeout(timer);
        }
    }, [isSpinning, segmentAngle]);

    const drawSegmentPath = (index: number) => {
        const startAngle = index * segmentAngle;
        const endAngle = (index + 1) * segmentAngle;
        const radStart = ((startAngle - 90) * Math.PI) / 180;
        const radEnd = ((endAngle - 90) * Math.PI) / 180;
        const r = 140, cx = 150, cy = 150;
        const x1 = cx + r * Math.cos(radStart), y1 = cy + r * Math.sin(radStart);
        const x2 = cx + r * Math.cos(radEnd), y2 = cy + r * Math.sin(radEnd);
        return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center w-full select-none"
        >
            <div className="w-full max-w-sm h-[240px] overflow-hidden relative flex justify-center items-start pt-4">
                {/* Refined Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
                    <motion.div
                        animate={isSpinning ? { rotate: [0, -15, 15, -10, 10, 0] } : {}}
                        transition={{ repeat: isSpinning ? Infinity : 0, duration: 0.2 }}
                        className="w-8 h-10 bg-white rounded-b-full flex items-center justify-center border-2 border-memoryes-soft"
                    >
                        <div className="w-2 h-2 bg-rose-400 rounded-full" />
                    </motion.div>
                </div>

                <svg
                    ref={wheelRef}
                    viewBox="0 0 300 300"
                    className="w-[450px] h-[450px] min-w-[450px] rounded-full border-8 border-white transition-all duration-300 absolute top-4 left-1/2 -translate-x-1/2"
                    style={{
                        transform: `rotate(${rotation}deg)`,
                        transition: 'transform 4.5s cubic-bezier(0.15, 0.85, 0.15, 1)',
                        transformOrigin: 'center center'
                    }}
                >
                    {WHEEL_SEGMENTS.map((seg, idx) => {
                        const midAngle = idx * segmentAngle + segmentAngle / 2;
                        return (
                            <g key={idx}>
                                <path d={drawSegmentPath(idx)} fill={seg.color} stroke="#ffffff" strokeWidth="1" />
                                <g transform={`rotate(${midAngle}, 150, 150)`}>
                                    <text
                                        x={130} y={70}
                                        transform={`rotate(90, 150, 65)`}
                                        fill={seg.value === 'LOST' || seg.value === 'SKIP' ? '#ffffff' : '#4A4E69'}
                                        fontSize="12" fontWeight="900" textAnchor="middle"
                                        className="font-sans tracking-tighter uppercase"
                                    >
                                        {seg.value}
                                    </text>
                                </g>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </motion.div>
    );
}