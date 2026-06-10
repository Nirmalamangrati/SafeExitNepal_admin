import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { CommunitySafety } from "./CommunitySafety";
import { OfflineResources } from "./OfflineResources";
import Rescueteam from "./Rescueteam";

const EARTH_RADIUS_KM = 6371;

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
  lat: number;
  lng: number;
  distanceFromUser?: number;
}

interface ResourcesTabProps {
  initialShelters: Shelter[];
}

const socket = io("http://192.168.43.132:8000");

export const ResourcesTab: React.FC<ResourcesTabProps> = () => {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // --- Admin Panel States ---
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentShelterId, setCurrentShelterId] = useState<
    string | number | null
  >(null);

  // Form Inputs
  const [name, setName] = useState<string>("");
  const [amenities, setAmenities] = useState<string>("");
  const [fulladdress, setFulladdress] = useState("");
  const [capacity, setCapacity] = useState<string>("");
  const [status, setStatus] = useState<string>("Open");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [supervisorName, setSupervisorName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [alternativePhone, setAlternativePhone] = useState("");

  // 1. Get Live User Location
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
        { enableHighAccuracy: true },
      );
    }

    // FETCH TRIGGER: Ask backend for initial data immediately on page load
    socket.emit("GET_ALL_SHELTERS");
  }, []);

  // 2. Real-time Sync Event Hook Fixed
  useEffect(() => {
    const handleShelterUpdate = (backendShelters: Shelter[]) => {
      if (userLocation) {
        const sorted = backendShelters
          .map((s) => {
            const dist = getHaversineDistance(
              userLocation.lat,
              userLocation.lng,
              Number(s.lat),
              Number(s.lng),
            );
            return { ...s, distanceFromUser: parseFloat(dist.toFixed(2)) };
          })
          .sort(
            (a, b) => (a.distanceFromUser || 0) - (b.distanceFromUser || 0),
          );
        setShelters(sorted);
      } else {
        setShelters(backendShelters);
      }
    };

    // Main Listeners
    socket.on("SHELTER_LIST_UPDATED", handleShelterUpdate);

    return () => {
      socket.off("SHELTER_LIST_UPDATED", handleShelterUpdate);
    };
  }, [userLocation]);

  // 3. Handle Form Submit (Add / Edit Action Fixed Inline Flow)
  const handleSaveShelter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !lat || !lng)
      return alert("Name and coordinates are required fields.");

    const shelterData = {
      name,
      amenities,
      capacity,
      status,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
    };

    if (isEditing && currentShelterId) {
      socket.emit("EDIT_SHELTER", { id: currentShelterId, ...shelterData });
    } else {
      socket.emit("ADD_SHELTER", shelterData);
    }

    clearForm();
    setShowRegisterModal(false);
  };

  // 4. Fill form inputs when Edit is clicked
  const handleEditClick = (shelter: Shelter) => {
    setIsEditing(true);
    setCurrentShelterId(shelter.id);
    setName(shelter.name);
    setAmenities(shelter.amenities);
    setCapacity(shelter.capacity);
    setStatus(shelter.status);
    setLat(shelter.lat.toString());
    setLng(shelter.lng.toString());
    setShowRegisterModal(true);
  };

  // 5. Trigger Delete event loop pipeline
  const handleDeleteClick = (id: string | number) => {
    if (
      confirm(
        "Are you sure you want to remove this shelter profile permanently?",
      )
    ) {
      socket.emit("DELETE_SHELTER", { id });
    }
  };

  const clearForm = () => {
    setIsEditing(false);
    setCurrentShelterId(null);
    setName("");
    setAmenities("");
    setCapacity("");
    setStatus("Open");
    setLat("");
    setLng("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
      {/* PART 1: SHELTERS ACTIVE LIST VIEWER */}
      <div className="bg-[#111c40] rounded-xl p-6 border border-slate-800">
        <div className="flex justify-between items-center mb-5 border-b border-slate-800 pb-3">
          <div>
            <h2 className="font-black text-white text-lg">
              Shelter Management
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Track live emergency safe zones
            </p>
          </div>

          {/* TRIGGER BUTTON TO OPEN POPUP MODAL */}
          <button
            onClick={() => {
              clearForm(); // Resets fields before opening fresh form
              setShowRegisterModal(true);
            }}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all transform active:scale-[0.98] shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 h-10"
          >
            + Register Shelter
          </button>
        </div>

        <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
          {shelters.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">
              No active shelters discovered.
            </p>
          ) : (
            shelters.map((s) => (
              <div
                key={s.id}
                className="bg-[#0b132b] p-4 rounded-xl border border-slate-800/50"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-white">{s.name}</h3>
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

                <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-900">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      s.status === "Full" ||
                      s.status === "Unsafe" ||
                      s.status === "Closed"
                        ? "bg-red-950/50 text-red-400"
                        : "bg-emerald-950/50 text-emerald-400"
                    }`}
                  >
                    {s.status}
                  </span>

                  {/* Inline Controls */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        handleEditClick(s);
                        setShowRegisterModal(true); // Open popup automatically for edit updates
                      }}
                      className="text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-md hover:bg-blue-600 hover:text-white transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(s.id)}
                      className="text-xs bg-red-600/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-md hover:bg-red-600 hover:text-white transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* PART 2: DYNAMIC ADMIN MANAGEMENT POPUP MODAL OVERLAY */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#111c40] rounded-xl p-6 border border-slate-800 w-full max-w-md shadow-2xl relative">
            <h2 className="font-black mb-5 text-white text-lg">
              {isEditing ? "Edit Shelter Profile" : "Register Safe Shelter"}
            </h2>
            <form onSubmit={handleSaveShelter} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Shelter Identification Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0b132b] border border-slate-800 rounded-lg p-2 text-white text-sm focus:border-blue-500 outline-none"
                  placeholder="e.g. Central Community Center"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Shelter type
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-[#0b132b] border border-slate-800 rounded-lg p-2 text-white text-sm focus:border-blue-500 outline-none"
                >
                  <option value="Educational_Buildings">
                    Educational Buildings{" "}
                  </option>
                  <option value="Tents"> Open Field / Tent Camp </option>
                  <option value="Buildings">
                    {" "}
                    Government / Public Buildings{" "}
                  </option>
                  <option value="complex">Commercial / Large Complex </option>
                  <option value="Pre-fabricated_Disaster_Shelters">
                    Pre-fabricated Disaster Shelters{" "}
                  </option>
                  <option value="Religiouscomplex">Religious Complex </option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Full address
                </label>
                <input
                  type="text"
                  value={fulladdress}
                  onChange={(e) => setFulladdress(e.target.value)}
                  className="w-full bg-[#0b132b] border border-slate-800 rounded-lg p-2 text-white text-sm focus:border-blue-500 outline-none"
                  placeholder="Enter full address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    GPS Latitude Coordinate
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full bg-[#0b132b] border border-slate-800 rounded-lg p-2 text-white text-sm focus:border-blue-500 outline-none"
                    placeholder="e.g. 27.6620"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    GPS Longitude Coordinate
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full bg-[#0b132b] border border-slate-800 rounded-lg p-2 text-white text-sm focus:border-blue-500 outline-none"
                    placeholder="e.g. 85.3325"
                  />
                </div>
              </div>
              {/* PLACE DIRECTLY BELOW PROVIDED AMENITIES FIELD */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Provided Amenities & Emergency Supplies
                </label>
                <input
                  type="text"
                  value={amenities}
                  onChange={(e) => setAmenities(e.target.value)}
                  className="w-full bg-[#0b132b] border border-slate-800 rounded-lg p-2 text-white text-sm focus:border-blue-500 outline-none"
                  placeholder="e.g. Rations, Clean Water, Medical Aid Kits"
                />
              </div>

              {/* NEW: DYNAMIC EMERGENCY CONTACT FIELDS INSERTION ZONE */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="sm:col-span-1">
                  <label className="block text-xs text-slate-400 mb-1">
                    In-Charge Manager Name
                  </label>
                  <input
                    type="text"
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                    className="w-full bg-[#0b132b] border border-slate-800 rounded-lg p-2 text-white text-sm focus:border-blue-500 outline-none"
                    placeholder="Ram Bahadur"
                    required
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs text-slate-400 mb-1">
                    Primary Phone
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full bg-[#0b132b] border border-slate-800 rounded-lg p-2 text-white text-sm focus:border-blue-500 outline-none"
                    placeholder="9841XXXXXX"
                    required
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs text-slate-400 mb-1">
                    Backup Contact
                  </label>
                  <input
                    type="tel"
                    value={alternativePhone}
                    onChange={(e) => setAlternativePhone(e.target.value)}
                    className="w-full bg-[#0b132b] border border-slate-800 rounded-lg p-2 text-white text-sm focus:border-blue-500 outline-none"
                    placeholder="01-XXXXXXX"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Occupancy Space Limit
                  </label>
                  <input
                    type="text"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full bg-[#0b132b] border border-slate-800 rounded-lg p-2 text-white text-sm focus:border-blue-500 outline-none"
                    placeholder="e.g. 150 Slots"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Operational State Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-[#0b132b] border border-slate-800 rounded-lg p-2 text-white text-sm focus:border-blue-500 outline-none"
                  >
                    <option value="Open">Open</option>
                    <option value="Full">Full</option>
                    <option value="Closed">Closed</option>
                    <option value="Unsafe">Unsafe</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
                >
                  {isEditing ? "Apply Parameters" : "Publish to Map Cluster"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    clearForm();
                    setShowRegisterModal(false);
                  }}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OTHER VIEWS */}
      <Rescueteam teams={[]} />
      <CommunitySafety />
      <OfflineResources />
    </div>
  );
};
