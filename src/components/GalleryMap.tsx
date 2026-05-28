"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function GalleryMap({ memories, onImageSelect }: { memories: any[], onImageSelect: (img: any) => void }) {
    // Filter memories that have valid coordinates
    const geoMemories = memories.filter(m => m.location?.coordinates && m.location.coordinates[0] !== 0);

    const createCustomIcon = (url: string) => {
        return new L.DivIcon({
            html: `
                <div style="
                    width: 40px; 
                    height: 40px; 
                    border-radius: 12px; 
                    border: 3px solid white; 
                    box-shadow: 0 4px 10px rgba(0,0,0,0.3); 
                    overflow: hidden;
                    background-color: #f1f1f1;
                ">
                    <img src="${url}" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>
            `,
            className: "custom-photo-pin",
            iconSize: [40, 40],
            iconAnchor: [20, 40],
        });
    };

    return (
        <MapContainer
            center={[20, 0]}
            zoom={2}
            className="h-full w-full"
            zoomControl={false}
        >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

            {geoMemories.map((memory) => (
                <Marker
                    key={memory._id}
                    position={[memory.location.coordinates[1], memory.location.coordinates[0]] as any}
                    icon={createCustomIcon(memory.media[0]?.url)}
                    eventHandlers={{
                        click: () => onImageSelect(memory.media[0])
                    }}
                >
                    <Popup className="custom-popup">
                        <div className="text-center">
                            <p className="text-[10px] font-bold uppercase mb-1">{memory.title}</p>
                            <p className="text-[8px] text-slate-400">{memory.location.name}</p>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}