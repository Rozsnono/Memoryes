"use client";

import { MapContainer, TileLayer, Marker, useMapEvents, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

// Fix for default Leaflet icons
const guessIcon = new L.Icon({
    iconUrl: "https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png",
    iconSize: [30, 30],
    iconAnchor: [15, 30],
});

const actualIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/5693/5693931.png",
    iconSize: [30, 30],
    iconAnchor: [15, 30],
});

function ClickHandler({ onMapClick, disabled }: any) {
    useMapEvents({
        click(e) {
            if (!disabled) onMapClick([e.latlng.lng, e.latlng.lat]);
        },
    });
    return null;
}

// FIXED: MapRecenter now uses correct array indices [0] and [1]
function MapRecenter({ actual, guess }: { actual: [number, number], guess: [number, number] }) {
    const map = useMap();

    useEffect(() => {
        if (actual && guess && actual[0] !== undefined && guess[0] !== undefined) {
            try {
                // Leaflet expects [lat, lng]
                // Our state is [lng, lat]
                const bounds = L.latLngBounds([
                    [actual[1], actual[0]],
                    [guess[1], guess[0]]
                ]);
                map.fitBounds(bounds, { padding: [70, 70], animate: true });
            } catch (e) {
                console.error("Bounds calculation error", e);
            }
        }
    }, [actual, guess, map]);

    return null;
}

export default function GeoguessrMap({ onGuess, currentGuess, actualLocation, showResult }: any) {
    return (
        <MapContainer
            center={[20, 0]}
            zoom={2}
            zoomControl={false}
            className="h-full w-full"
            style={{ background: '#1a1c2c' }}
        >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

            <ClickHandler onMapClick={onGuess} disabled={showResult} />

            {/* User's Guess Marker */}
            {currentGuess && currentGuess[1] !== undefined && (
                <Marker position={[currentGuess[1], currentGuess[0]]} icon={guessIcon} />
            )}

            {/* Results Layer */}
            {showResult && actualLocation && currentGuess && (
                <>
                    <Marker position={[actualLocation[1], actualLocation[0]]} icon={actualIcon} />
                    <Polyline
                        positions={[
                            [currentGuess[1], currentGuess[0]],
                            [actualLocation[1], actualLocation[0]]
                        ]}
                        color="#9B86BD"
                        dashArray="10, 10"
                        weight={3}
                        opacity={0.8}
                    />
                    <MapRecenter actual={actualLocation} guess={currentGuess} />
                </>
            )}
        </MapContainer>
    );
}