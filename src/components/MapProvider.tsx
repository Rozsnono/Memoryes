// components/MapProvider.tsx
"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';

// Fix for default Leaflet icons in Next.js
const customIcon = new L.Icon({
    iconUrl: 'https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
});

export default function MapProvider({ memories }: { memories: any[] }) {
    // Create an array of coordinates for the path line [lat, lng]
    const pathPositions = memories.map(m => [m.location.coordinates[1], m.location.coordinates[0]]);

    // Default center (uses first memory or middle of world)
    const center = pathPositions.length > 0 ? pathPositions[0] : [51.505, -0.09];

    return (
        <div className="h-full w-full rounded-[2.5rem] overflow-hidden shadow-inner border-4 border-white">
            <MapContainer
                center={center as any}
                zoom={13}
                scrollWheelZoom={false}
                className="h-full w-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" // Pastel-style map tiles
                />

                {/* Draw the journey line */}
                <Polyline
                    positions={pathPositions as any}
                    pathOptions={{ color: '#9B86BD', weight: 4, dashArray: '10, 10', opacity: 0.6 }}
                />

                {memories.map((memory) => (
                    <Marker
                        key={memory._id}
                        position={[memory.location.coordinates[1], memory.location.coordinates[0]] as any}
                        icon={customIcon}
                    >
                        <Popup className="custom-popup">
                            <div className="p-1">
                                <img
                                    src={memory.media[0]?.url}
                                    className="w-24 h-16 object-cover rounded-lg mb-2"
                                />
                                <p className="text-[10px] font-bold text-memoryes-clay uppercase tracking-widest">{memory.title}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}