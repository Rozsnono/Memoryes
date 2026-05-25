"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, MapPin } from "lucide-react";

// Fix for Leaflet default marker icons in Next.js
const customIcon = new L.Icon({
    iconUrl: "https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png",
    iconSize: [35, 35],
    iconAnchor: [17, 35],
});

// Helper component to handle map clicks
function MapEvents({ onClick }: { onClick: (coords: [number, number]) => void }) {
    useMapEvents({
        click(e) {
            onClick([e.latlng.lng, e.latlng.lat]);
        },
    });
    return null;
}

interface LocationPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (coords: [number, number]) => void;
    initialCoords: [number, number];
}

export const LocationPicker = ({ isOpen, onClose, onSelect, initialCoords }: LocationPickerProps) => {
    const [selected, setSelected] = useState<[number, number]>(initialCoords);

    // Update internal state if initialCoords change (e.g. after auto-detection)
    useEffect(() => {
        if (initialCoords[0] !== 0) setSelected(initialCoords);
    }, [initialCoords]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-end justify-center"
            >
                <motion.div
                    initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                    className="w-full max-w-md h-[85vh] bg-white rounded-t-[3rem] overflow-hidden flex flex-col shadow-2xl"
                >
                    {/* Header */}
                    <div className="p-6 flex justify-between items-center bg-white border-b border-slate-100">
                        <div>
                            <h3 className="text-xl font-serif italic text-memoryes-clay">Pin the Memory</h3>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Tap the map to set location</p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90 transition-transform">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Map Interface */}
                    <div className="flex-1 relative bg-slate-50">
                        <MapContainer
                            center={[selected[1], selected[0]] as any}
                            zoom={13}
                            zoomControl={false}
                            className="h-full w-full"
                        >
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                            <MapEvents onClick={(coords) => setSelected(coords)} />
                            <Marker position={[selected[1], selected[0]] as any} icon={customIcon} />
                        </MapContainer>

                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] bg-memoryes-clay text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 pointer-events-none border border-white/10">
                            <MapPin size={14} className="text-memoryes-accent" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">Location Selected</span>
                        </div>
                    </div>

                    {/* Action Footer */}
                    <div className="p-8 bg-white border-t border-slate-50">
                        <button
                            onClick={() => { onSelect(selected); onClose(); }}
                            className="w-full py-5 bg-memoryes-clay text-white rounded-[2rem] font-bold shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <Check size={20} /> Use this spot
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};