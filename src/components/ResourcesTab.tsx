// src/components/ResourcesTab.tsx
import React from "react";
import { CommunitySafety } from "./CommunitySafety";
import { OfflineResources } from "./OfflineResources";

interface Shelter {
  id: string | number;
  name: string;
  amenities: string;
  capacity: string;
  status: string;
}

interface RescueTeam {
  id: string | number;
  name: string;
  contact: string;
  members: number | string;
  status: string;
}

interface ResourcesTabProps {
  shelters: Shelter[];
  teams: RescueTeam[];
}

export const ResourcesTab: React.FC<ResourcesTabProps> = ({
  shelters,
  teams,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* १. SHELTERS */}
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
              <h3 className="font-bold text-white">{s.name}</h3>
              <p className="text-sm text-slate-400 mt-1">
                Amenities: {s.amenities}
              </p>
              <p className="text-sm text-slate-300">Capacity: {s.capacity}</p>
              <span
                className={`inline-block mt-2 text-xs font-bold px-2 py-0.5 rounded ${
                  s.status === "Full"
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

      {/* २. TEAMS */}
      <div className="bg-[#111c40] rounded-xl p-6 border border-slate-800">
        <h2 className="font-black mb-5 text-white text-lg">Rescue Teams</h2>
        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
          {teams.map((t) => (
            <div
              key={t.id}
              className="bg-[#0b132b] p-4 rounded-xl border border-slate-800/50"
            >
              <h3 className="font-bold text-white">{t.name}</h3>
              <p className="text-sm text-slate-400 mt-1">
                Contact: {t.contact}
              </p>
              <p className="text-sm text-slate-300">
                Crew Members: {t.members}
              </p>
              <span className="inline-block mt-2 text-xs font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded">
                {t.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ३. COMMUNITY SAFETY COMPONENT */}
      <CommunitySafety />

      {/* ४. OFFLINE RESOURCES COMPONENT */}
      <OfflineResources />
    </div>
  );
};
