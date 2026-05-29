// src/components/ManualTab.tsx
import React from "react";

// Props को संरचना (Interface) तोक्ने
interface ManualTabProps {
  manualType: string;
  setManualType: (value: string) => void;
  manualLat: string;
  setManualLat: (value: string) => void;
  manualLng: string;
  setManualLng: (value: string) => void;
  handleManualAlertSubmit: (e: React.FormEvent) => void;
}

export const ManualTab: React.FC<ManualTabProps> = ({
  manualType,
  setManualType,
  manualLat,
  setManualLat,
  manualLng,
  setManualLng,
  handleManualAlertSubmit,
}) => {
  return (
    <form
      onSubmit={handleManualAlertSubmit}
      className="bg-[#111c40] rounded-xl border border-slate-800 p-6 max-w-xl mx-auto space-y-5"
    >
      <h2 className="text-xl font-black">Manual Incident Override</h2>
      <div>
        <label className="text-sm font-bold">Incident Type</label>
        <select
          value={manualType}
          onChange={(e) => setManualType(e.target.value)}
          className="w-full bg-[#0b132b] border border-slate-700 rounded-xl p-3 mt-2"
        >
          <option value="FLOOD">FLOOD</option>
          <option value="LANDSLIDE">LANDSLIDE</option>
          <option value="EARTHQUAKE">EARTHQUAKE</option>
          <option value="FIRE">FIRE</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-bold">Latitude</label>
        <input
          type="text"
          value={manualLat}
          onChange={(e) => setManualLat(e.target.value)}
          className="w-full bg-[#0b132b] border border-slate-700 rounded-xl p-3 mt-2"
        />
      </div>
      <div>
        <label className="text-sm font-bold">Longitude</label>
        <input
          type="text"
          value={manualLng}
          onChange={(e) => setManualLng(e.target.value)}
          className="w-full bg-[#0b132b] border border-slate-700 rounded-xl p-3 mt-2"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-xl font-black"
      >
        Inject & Broadcast Alert
      </button>
    </form>
  );
};
