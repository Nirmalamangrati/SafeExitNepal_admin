import React, { useState } from "react";

import { Socket } from "socket.io-client";

interface ShelterFormInput {
  name: string;
  address: string;
  contactPerson: string;
  phone: string;
  lat: number;
  lng: number;
  totalCapacity: number;
  currentOccupancy: number;
  status: "Open" | "Full" | "Closed";
  shelterType: "Government" | "Open Ground" | "Medical Center" | "Private Camp";
  amenities: string[];
}

interface RegisterFormProps {
  socket: Socket | null;
  onClose?: () => void;
}

export default function RegisterShelterForm({
  socket,
  onClose,
}: RegisterFormProps) {
  const [formData, setFormData] = useState<ShelterFormInput>({
    name: "",
    address: "",
    contactPerson: "",
    phone: "",
    lat: 27.662,
    lng: 85.3325,
    totalCapacity: 150,
    currentOccupancy: 0,
    status: "Open",
    shelterType: "Government",
    amenities: [],
  });

  const availableAmenities = [
    { id: "Water", label: "Clean Water", icon: "🚰" },
    { id: "Food", label: "Food Rations", icon: "🍱" },
    { id: "Medical", label: "First-Aid Kit", icon: "💊" },
    { id: "Electricity", label: "Power Backup", icon: "⚡" },
    { id: "Restrooms", label: "Restrooms", icon: "🚻" },
    { id: "Security", label: "Security Guard", icon: "🚨" },
    { id: "Wifi", label: "Internet / Wifi", icon: "📶" },
    { id: "Kids", label: "Child Care Zone", icon: "👶" },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "totalCapacity" ||
        name === "currentOccupancy" ||
        name === "lat" ||
        name === "lng"
          ? Number(value)
          : value,
    }));
  };

  const handleAmenityToggle = (id: string) => {
    setFormData((prev) => {
      const isSelected = prev.amenities.includes(id);
      return {
        ...prev,
        amenities: isSelected
          ? prev.amenities.filter((item) => item !== id)
          : [...prev.amenities, id],
      };
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (socket) {
      socket.emit("ADD_SHELTER", formData);
      alert("Safe Shelter Data Published Successfully!");
      if (onClose) onClose();
    } else {
      console.error("Socket cluster network interface offline!");
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 text-slate-100 p-8 rounded-2xl shadow-2xl backdrop-blur-md">
      <div className="mb-6 pb-4 border-b border-slate-800">
        <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <span className="text-blue-500">🛡️</span> REGISTER NEW EMERGENCY SAFE
          SHELTER
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Add a verified safe zone database point to the live sync cluster
          dashboard.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              🏠 Shelter Identification Name
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g. Central Community Gym"
              className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-white placeholder-slate-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              📍 Street Address / Area
            </label>
            <input
              type="text"
              name="address"
              required
              value={formData.address}
              onChange={handleInputChange}
              placeholder="e.g. Ward 32, Koteshwor, Kathmandu"
              className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-white placeholder-slate-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              👤 Contact Person Name
            </label>
            <input
              type="text"
              name="contactPerson"
              required
              value={formData.contactPerson}
              onChange={handleInputChange}
              placeholder="Name of Person In-Charge"
              className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-white placeholder-slate-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              📞 Emergency Phone Number
            </label>
            <input
              type="text"
              name="phone"
              required
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="e.g. +977-98XXXXXXXX"
              className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-white placeholder-slate-500 transition"
            />
          </div>
        </div>

        {/* Section 2: Location */}
        <div className="p-5 bg-slate-950/40 border border-slate-800 rounded-xl space-y-4">
          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">
            📍 Location Tracking Engine
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                GPS Latitude
              </label>
              <input
                type="number"
                step="any"
                name="lat"
                required
                value={formData.lat}
                onChange={handleInputChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                GPS Longitude
              </label>
              <input
                type="number"
                step="any"
                name="lng"
                required
                value={formData.lng}
                onChange={handleInputChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <button
            type="button"
            className="w-full bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
          >
            🗺️ Open Interactive Map Picker
          </button>
        </div>

        {/* Section 3: Capacity & Status */}
        <div className="p-5 bg-slate-950/40 border border-slate-800 rounded-xl">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4">
            📊 Capacity & Status Management
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                👥 Total Capacity Limit
              </label>
              <input
                type="number"
                name="totalCapacity"
                required
                value={formData.totalCapacity}
                onChange={handleInputChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                🔴 Currently Occupied
              </label>
              <input
                type="number"
                name="currentOccupancy"
                required
                value={formData.currentOccupancy}
                onChange={handleInputChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                ⚙️ Operational State
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-white"
              >
                <option value="Open">🟢 Open & Active</option>
                <option value="Full">🔴 Full / At Capacity</option>
                <option value="Closed">⚪ Closed / Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              🏥 Shelter Type Designation
            </label>
            <select
              name="shelterType"
              value={formData.shelterType}
              onChange={handleInputChange}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-white"
            >
              <option value="Government">Government Building / School</option>
              <option value="Open Ground">Open Ground / Tent Camp Zone</option>
              <option value="Medical Center">
                Hospital / First-Aid Station
              </option>
              <option value="Private Camp">Community Private Safe Space</option>
            </select>
          </div>
        </div>

        {/* Section 4: Amenities */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            🛠️ Provided Amenities & Life Support Services
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {availableAmenities.map((amenity) => {
              const isSelected = formData.amenities.includes(amenity.id);
              return (
                <div
                  key={amenity.id}
                  onClick={() => handleAmenityToggle(amenity.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition select-none text-center ${
                    isSelected
                      ? "bg-blue-600/20 border-blue-500 text-blue-300 shadow-lg shadow-blue-500/10 scale-[1.02]"
                      : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                  }`}
                >
                  <div className="text-2xl mb-2">{amenity.icon}</div>
                  <span className="text-sm">{amenity.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
          >
            ✖ Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
          >
            🚀 Publish to Map Cluster
          </button>
        </div>
      </form>
    </div>
  );
}
