// src/components/CommunitySafety.tsx
import React, { useState } from "react";

interface SafetyZone {
  id: string | number;
  area: string;
  patrolStatus: string;
  riskLevel: "Low" | "Medium" | "High";
}

export const CommunitySafety: React.FC = () => {
  const [safetyZones, setSafetyZones] = useState<SafetyZone[]>([
    {
      id: 1,
      area: "Kapan Park Open Area",
      patrolStatus: "Active",
      riskLevel: "Low",
    },
    {
      id: 2,
      area: "Balkhu Community Center",
      patrolStatus: "Standby",
      riskLevel: "Medium",
    },
  ]);

  const [newZoneArea, setNewZoneArea] = useState("");
  const [newZonePatrol, setNewZonePatrol] = useState("");
  const [newZoneRisk, setNewZoneRisk] = useState<"Low" | "Medium" | "High">(
    "Low",
  );

  const handleAddSafetyZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneArea) return;
    const newZone: SafetyZone = {
      id: Date.now(),
      area: newZoneArea,
      patrolStatus: newZonePatrol || "Inactive",
      riskLevel: newZoneRisk,
    };
    setSafetyZones([newZone, ...safetyZones]);
    setNewZoneArea("");
    setNewZonePatrol("");
  };

  const handleDeleteZone = (id: string | number) => {
    setSafetyZones(safetyZones.filter((z) => z.id !== id));
  };

  return (
    <div className="bg-[#111c40] rounded-xl p-6 border border-slate-800 space-y-6">
      <div>
        <h2 className="font-black text-white text-lg mb-4">Community Safety</h2>

        {/* थप्ने फर्म */}
        <form
          onSubmit={handleAddSafetyZone}
          className="bg-[#0b132b] p-4 rounded-xl border border-slate-800 mb-4 space-y-3"
        >
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Add New Safe Zone
          </h4>
          <input
            type="text"
            placeholder="Area Name (e.g. Lalitpur Ground)"
            value={newZoneArea}
            onChange={(e) => setNewZoneArea(e.target.value)}
            className="w-full bg-[#111c40] border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Patrol (e.g. Active)"
              value={newZonePatrol}
              onChange={(e) => setNewZonePatrol(e.target.value)}
              className="w-full bg-[#111c40] border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            <select
              value={newZoneRisk}
              onChange={(e) => setNewZoneRisk(e.target.value as any)}
              className="w-full bg-[#111c40] border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded-lg text-sm transition"
          >
            + Add Zone
          </button>
        </form>

        {/* सूची */}
        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
          {safetyZones.map((zone) => (
            <div
              key={zone.id}
              className="bg-[#0b132b] p-4 rounded-xl border border-slate-800/50 flex justify-between items-start"
            >
              <div>
                <h3 className="font-bold text-white">{zone.area}</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Patrol: {zone.patrolStatus}
                </p>
                <div className="flex gap-2 items-center mt-1">
                  <span className="text-xs text-slate-500">Risk:</span>
                  <span
                    className={`text-xs font-bold px-1.5 py-0.5 rounded ${zone.riskLevel === "High" ? "bg-red-950/50 text-red-400" : zone.riskLevel === "Medium" ? "bg-amber-950/50 text-amber-400" : "bg-emerald-950/50 text-emerald-400"}`}
                  >
                    {zone.riskLevel}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleDeleteZone(zone.id)}
                className="text-slate-500 hover:text-red-400 text-xs p-1"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
