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
  shelterType?: string;
  lat: number;
  lng: number;
  fulladdress?: string;
  supervisorName?: string;
  contactPhone?: string;
  alternativePhone?: string;
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
  const [activeDropdownId, setActiveDropdownId] = useState<
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
  const [shelterType, setShelterType] = useState<string>("Buildings");
  // 1. Get Live User Location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(loc);
          socket.emit("GET_ALL_SHELTERS");
        },
        (error) => {
          console.error("Browser location permission denied:", error);
          socket.emit("GET_ALL_SHELTERS");
        },
        { enableHighAccuracy: true },
      );
    } else {
      socket.emit("GET_ALL_SHELTERS");
    }
    socket.emit("GET_ALL_SHELTERS");
  }, []);

  // 2. Real-time Sync Event Hook
  useEffect(() => {
    const handleShelterUpdate = (backendShelters: Shelter[]) => {
      const safeShelters = Array.isArray(backendShelters)
        ? backendShelters
        : [];

      if (userLocation) {
        const sorted = safeShelters
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
        setShelters(safeShelters);
      }
    };

    socket.on("SHELTER_LIST_UPDATED", handleShelterUpdate);
    socket.on("connect", () => {
      console.log("Connected to backend socket server!");
    });
    socket.on("connect_error", (error) => {
      console.error("Socket Connection Error:", error);
    });
    return () => {
      socket.off("SHELTER_LIST_UPDATED", handleShelterUpdate);
      socket.off("connect");
      socket.off("connect_error");
    };
  }, [userLocation]);

  // 3. Handle Form Submit
  const handleSaveShelter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !lat || !lng)
      return alert("Name and coordinates are required fields.");

    const shelterData = {
      name,
      amenities,
      capacity,
      status,
      shelterType,
      fulladdress,
      supervisorName,
      contactPhone,
      alternativePhone,
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
    setShelterType(shelter.shelterType || "Buildings");
    setFulladdress(shelter.fulladdress || "");
    setSupervisorName(shelter.supervisorName || "");
    setContactPhone(shelter.contactPhone || "");
    setAlternativePhone(shelter.alternativePhone || "");
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

  // 6. clean all input boxes
  const clearForm = () => {
    setIsEditing(false);
    setCurrentShelterId(null);
    setName("");
    setAmenities("");
    setCapacity("");
    setStatus("Open");
    setFulladdress("");
    setSupervisorName("");
    setContactPhone("");
    setAlternativePhone("");
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
                  <h3 className="font-bold text-white text-base group-hover:text-cyan-400 transition-colors">
                    {s.name}
                  </h3>
                  <div className="relative inline-block">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdownId(
                          activeDropdownId === s.id ? null : s.id,
                        );
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors focus:outline-none"
                    >
                      <svg
                        xmlns="http://w3.org"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5"
                        />
                      </svg>
                    </button>

                    {activeDropdownId === s.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setActiveDropdownId(null)}
                        />
                        <div className="absolute right-0 mt-1 w-32 bg-[#0b132b] border border-slate-700 rounded-xl shadow-2xl z-30 py-1.5 overflow-hidden animate-fade-in">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(s);
                              setShowRegisterModal(true);
                              setActiveDropdownId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-xs text-cyan-400 hover:bg-slate-800 hover:text-white transition-colors font-semibold"
                          >
                            Edit
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(s.id);
                              setActiveDropdownId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-600/20 hover:bg-red-600 hover:text-white transition-colors font-semibold border-t border-slate-800/60"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {s.distanceFromUser !== undefined && (
                    <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      {s.distanceFromUser} km away
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-900/30">
                  {(() => {
                    const typeValue = s.shelterType || "Buildings";
                    if (typeValue === "Buildings")
                      return "Government / Public Buildings";
                    if (typeValue === "Educational_Buildings")
                      return "Educational Buildings";
                    if (typeValue === "Tents") return "Open Field / Tent Camp";
                    if (typeValue === "complex")
                      return "Commercial / Large Complex";
                    if (typeValue === "Pre-fabricated_Disaster_Shelters")
                      return "Pre-fabricated Disaster Shelters";
                    if (typeValue === "Religiouscomplex")
                      return "Religious Complex";
                    return typeValue;
                  })()}
                </span>
                <p className="text-sm text-slate-400">
                  <span className="text-slate-500 font-medium">Address:</span>{" "}
                  {s.fulladdress || "N/A"}
                </p>

                <p className="text-sm text-slate-400 mt-1">
                  Amenities: {s.amenities}
                </p>
                <p className="text-sm text-slate-300">Capacity: {s.capacity}</p>
                <div className="bg-[#111c40]/40 p-2.5 rounded-lg border border-slate-800/30 text-xs space-y-1 text-slate-400">
                  <p>
                    <span className="text-slate-500 font-medium">Manager:</span>{" "}
                    {s.supervisorName || "N/A"}
                  </p>
                  <div className="flex gap-4">
                    <p>
                      <span className="text-slate-500 font-medium">
                        Primary Phone:
                      </span>{" "}
                      {s.contactPhone || "N/A"}
                    </p>
                    {s.alternativePhone && (
                      <p>
                        <span className="text-slate-500 font-medium">
                          Backup:
                        </span>{" "}
                        {s.alternativePhone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-900">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded border ${
                      s.status === "Full" ||
                      s.status === "Unsafe" ||
                      s.status === "Closed"
                        ? "bg-red-950/50 text-red-400 border-red-900/30"
                        : "bg-emerald-950/50 text-emerald-400 border-emerald-900/30"
                    }`}
                  >
                    {s.status === "Open" ||
                    s.status === "Full" ||
                    s.status === "Closed" ||
                    s.status === "Unsafe"
                      ? s.status
                      : "Open"}
                  </span>
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
