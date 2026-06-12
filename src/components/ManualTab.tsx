import React, { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
interface ManualTabProps {
  manualType: string;
  setManualType: (value: string) => void;
  manualCategory: string;
  setManualCategory: (value: string) => void;
  locationName: string;
  setLocationName: (value: string) => void;
  handleManualAlertSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  manualLat: string;
  setManualLat: (value: string) => void;
  manualLng: string;
  setManualLng: (value: string) => void;
}
const SHELTERS = [
  { name: "Kapan Emergency Safe Camp", lat: 27.7342, lng: 85.3624 },
  { name: "Balkhu Relief Center", lat: 27.6841, lng: 85.3022 },
  { name: "Sankhamul Shelter Home", lat: 27.6897, lng: 85.3341 },
];

const customIcon = L.divIcon({
  html: `
    <svg xmlns="http://w3.org" viewBox="0 0 24 24" fill="#ef4444" width="32px" height="32px">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `,
  className: "custom-pin",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});
function MapClickHandler({
  setManualLat,
  setManualLng,
  setLocationName,
  setIsReverseGeocoding,
}: {
  setManualLat: (v: string) => void;
  setManualLng: (v: string) => void;
  setLocationName: (v: string) => void;
  setIsReverseGeocoding: (v: boolean) => void;
}) {
  useMapEvents({
    click: async (e) => {
      const clickedLat = e.latlng.lat;
      const clickedLng = e.latlng.lng;
      setManualLat(clickedLat.toFixed(4));
      setManualLng(clickedLng.toFixed(4));

      setIsReverseGeocoding(true);

      try {
        const res = await fetch(
          `https://openstreetmap.org{clickedLat}&lon=${clickedLng}`,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              "Accept-Language": "ne,en",
            },
          },
        );
        const data = await res.json();

        if (data && data.address) {
          const addr = data.address;

          // nepalko jilla ,sahar, gaupalika or toleko name filter \
          const localPlace =
            addr.suburb ||
            addr.neighbourhood ||
            addr.village ||
            addr.road ||
            addr.municipality ||
            "";
          const cityPlace =
            addr.city ||
            addr.town ||
            addr.state_district ||
            addr.county ||
            "Nepal";

          if (localPlace) {
            setLocationName(`${localPlace}, ${cityPlace}`);
          } else {
            setLocationName(cityPlace);
          }
        } else if (data && data.display_name) {
          // if address lamo vaye duita matrae dekhaune
          const parts = data.display_name.split(",");
          const shortName =
            parts.length > 1
              ? `${parts[0].trim()}, ${parts[1].trim()}`
              : parts[0].trim();
          setLocationName(shortName);
        } else {
          setLocationName(
            `Location: ${clickedLat.toFixed(4)}, ${clickedLng.toFixed(4)}`,
          );
        }
      } catch (err) {
        console.error(
          "Reverse geocoding failed, trying robust backup lookup:",
          err,
        );

        // internet wa server fail huda chalne nepalko main coordinate backup
        if (
          clickedLat >= 27.64 &&
          clickedLat <= 27.68 &&
          clickedLng >= 85.3 &&
          clickedLng <= 85.35
        ) {
          setLocationName("Lalitpur, Nepal");
        } else if (
          clickedLat >= 27.6801 &&
          clickedLat <= 27.75 &&
          clickedLng >= 85.28 &&
          clickedLng <= 85.36
        ) {
          setLocationName("Kathmandu, Nepal");
        } else if (
          clickedLat >= 27.65 &&
          clickedLat <= 27.7 &&
          clickedLng >= 85.3601 &&
          clickedLng <= 85.45
        ) {
          setLocationName("Bhaktapur, Nepal");
        } else {
          setLocationName(
            `Location: ${clickedLat.toFixed(2)}, ${clickedLng.toFixed(2)}`,
          );
        }
      } finally {
        setIsReverseGeocoding(false);
      }
    },
  });
  return null;
}

export const ManualTab: React.FC<ManualTabProps> = ({
  manualType,
  setManualType,
  manualCategory,
  setManualCategory,
  locationName,
  setLocationName,
  handleManualAlertSubmit,
  isSubmitting = false,
  setIsSubmitting,
  manualLat,
  setManualLat,
  manualLng,
  setManualLng,
}) => {
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [latitude, setLatitude] = useState<string | number>("");
  const [longitude, setLongitude] = useState<string | number>("");
  // Haversine Algorithm
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  // Nearest Shelter Calculator
  const nearestShelter = useMemo<{
    name: string;
    distance: number;
  } | null>(() => {
    const currentLat = parseFloat(manualLat);
    const currentLng = parseFloat(manualLng);
    if (isNaN(currentLat) || isNaN(currentLng)) return null;
    let closest: { name: string; distance: number } | null = null;
    let minDistance = Infinity;
    SHELTERS.forEach((shelter) => {
      const dist = calculateDistance(
        currentLat,
        currentLng,
        shelter.lat,
        shelter.lng,
      );
      if (dist < minDistance) {
        minDistance = dist;
        closest = { name: shelter.name, distance: dist };
      }
    });
    return closest;
  }, [manualLat, manualLng]);
  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    handleManualAlertSubmit(e);
  };
  const currentPosition: [number, number] | null =
    !isNaN(parseFloat(manualLat)) && !isNaN(parseFloat(manualLng))
      ? [parseFloat(manualLat), parseFloat(manualLng)]
      : null;
  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-start bg-[#111c40] rounded-xl border border-slate-800 p-6 shadow-2xl text-white">
      {/* LEFT SIDE: FORM */}
      <form onSubmit={onFormSubmit} className="space-y-4 w-full">
        <h2 className="text-xl font-black text-red-500">
          Manual Incident Override
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-300">
              Incident Type
            </label>
            <select
              value={manualType}
              onChange={(e) => setManualType(e.target.value)}
              className="w-full bg-[#0b132b] border border-slate-700 rounded-xl p-2.5 mt-1 focus:outline-none focus:border-red-500 text-xs text-white"
            >
              <option value="FLOOD">FLOOD</option>
              <option value="LANDSLIDE">LANDSLIDE</option>
              <option value="EARTHQUAKE">EARTHQUAKE</option>
              <option value="FIRE">FIRE</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300">Category</label>
            <select
              value={manualCategory}
              onChange={(e) => setManualCategory(e.target.value)}
              className="w-full bg-[#0b132b] border border-slate-700 rounded-xl p-2.5 mt-1 focus:outline-none focus:border-red-500 text-xs text-white"
            >
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300">
            Location Name
          </label>
          <input
            type="text"
            placeholder={
              isReverseGeocoding
                ? "Locating place..."
                : "Type location name manually..."
            }
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            className="w-full bg-[#0b132b] border border-slate-700 rounded-xl p-2.5 mt-1 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-300">
              Longitude
            </label>
            <input
              type="text"
              placeholder="Enter longitude..."
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="w-full bg-[#0b132b] border border-slate-700 rounded-xl p-2.5 mt-1 text-xs text-slate-300 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-300">Latitude</label>
            <input
              type="text"
              placeholder="Enter latitude..."
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="w-full bg-[#0b132b] border border-slate-700 rounded-xl p-2.5 mt-1 text-xs text-slate-300 focus:outline-none"
            />
          </div>
        </div>

        {nearestShelter && (
          <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-3.5">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Haversine Insights
            </p>
            <p className="text-xs mt-1 text-cyan-400">
              Nearest Shelter:{" "}
              <span className="font-bold text-white">
                {nearestShelter.name}
              </span>
            </p>
            <p className="text-[11px] text-slate-300">
              Distance:{" "}
              <span className="font-bold text-yellow-500">
                {nearestShelter.distance.toFixed(2)} km
              </span>{" "}
              away.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !manualLat}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-800 disabled:text-slate-500 py-3 rounded-xl font-black transition text-xs cursor-pointer"
        >
          {isSubmitting ? "Broadcasting..." : "Inject & Broadcast Alert"}
        </button>
      </form>

      {/* RIGHT SIDE: INTERACTIVE MAP PICKER */}
      <div className="w-full h-[380px] rounded-xl overflow-hidden border border-slate-700 z-0 shadow-lg">
        <MapContainer
          center={[27.7172, 85.324]}
          zoom={11}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler
            setManualLat={setManualLat}
            setManualLng={setManualLng}
            setLocationName={setLocationName}
            setIsReverseGeocoding={setIsReverseGeocoding}
          />
          {currentPosition && (
            <Marker position={currentPosition} icon={customIcon} />
          )}
        </MapContainer>
      </div>
    </div>
  );
};
