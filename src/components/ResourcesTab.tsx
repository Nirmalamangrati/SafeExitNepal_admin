import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { CommunitySafety } from "./CommunitySafety";
import { OfflineResources } from "./OfflineResources";
import Rescueteam from "./Rescueteam";

// Earth Radius in Kilometers
const EARTH_RADIUS_KM = 6371;

/**
 *  HAVERSINE ALGORITHM
 * Calculates the shortest distance between two sets of GPS coordinates.
 * Geo-coordinates bata exact distance kilometer ma nikalxa.
 */
function getHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

interface Shelter {
  id: string | number;
  name: string;
  amenities: string;
  capacity: string;
  status: string;
  lat: number; // Target destination latitude
  lng: number; // Target destination longitude
  distanceFromUser?: number; // Calculated field runtime context holder
}

interface ResourcesTabProps {
  initialShelters: Shelter[]; // Tracks data state modifications smoothly
}

// Global initialization of live communication web sockets link
// Connected to your backend system port 8000
const socket = io("http://192.168.43.132:8000");

export const ResourcesTab: React.FC<ResourcesTabProps> = ({
  initialShelters,
}) => {
  const [shelters, setShelters] = useState<Shelter[]>(initialShelters);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Hook 1: Fetch user's active native browser GPS location on mounting sequence
  // Expo package hatayera native web standard browser coordinates fetch gareko
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Browser location permission denied:", error);
        },
        { enableHighAccuracy: true }, // Forces precise hardware GPS pins if available
      );
    } else {
      console.error("Geolocation is not supported by this web browser.");
    }
  }, []);

  // Hook 2: Listen to web sockets server broadcasts for real-time safety matrix updates
  // Backend changes run through the Haversine equation and instantly sort the UI array layout
  useEffect(() => {
    socket.on("SHELTER_LIST_UPDATED", (backendShelters: Shelter[]) => {
      // If User browser GPS data is active, calculate distance and sort list immediately
      if (userLocation) {
        const sorted = backendShelters
          .map((s) => {
            const dist = getHaversineDistance(
              userLocation.lat,
              userLocation.lng,
              s.lat,
              s.lng,
            );
            return { ...s, distanceFromUser: parseFloat(dist.toFixed(2)) };
          })
          .sort(
            (a, b) => (a.distanceFromUser || 0) - (b.distanceFromUser || 0),
          ); // Nearest shelter first

        setShelters(sorted);
      } else {
        // Fallback trace mapping sequence if tracking permissions are off
        setShelters(backendShelters);
      }
    });

    // Cleanup active listener loop pipeline when component unmounts
    return () => {
      socket.off("SHELTER_LIST_UPDATED");
    };
  }, [userLocation]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/*  SHELTERS */}
      <div className="bg-[#111c40] rounded-xl p-6 border border-slate-800">
        <h2 className="font-black mb-5 text-white text-lg">
          Shelter Management
        </h2>
        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
          {shelters.map((s) => (
            <div
              key={s.id}
              className="bg-[#0b132b] p-4 rounded-xl border border-slate-800/50"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-white">{s.name}</h3>

                {/* Visual Proximity Marker Badge: Displays calculation distance layout logs */}
                {s.distanceFromUser !== undefined && (
                  <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    {s.distanceFromUser} km away
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-400 mt-1">
                Amenities: {s.amenities}
              </p>
              <p className="text-sm text-slate-300">Capacity: {s.capacity}</p>

              {/* Updated Status Badge: Red for Full, Unsafe, or Closed statuses */}
              <span
                className={`inline-block mt-2 text-xs font-bold px-2 py-0.5 rounded ${
                  s.status === "Full" ||
                  s.status === "Unsafe" ||
                  s.status === "Closed"
                    ? "bg-red-950/50 text-red-400"
                    : "bg-emerald-950/50 text-emerald-400"
                }`}
              >
                {s.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/*  TEAMS */}
      <Rescueteam teams={[]} />

      {/* COMMUNITY SAFETY COMPONENT */}
      <CommunitySafety />

      {/* OFFLINE RESOURCES COMPONENT */}
      <OfflineResources />
    </div>
  );
};
