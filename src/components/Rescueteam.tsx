import React from "react";

interface RescueTeam {
  id: string | number;
  name: string;
  contact: string;
  members: number | string;
  status: string;
}

// Default backup data inside the component file
const defaultTeams: RescueTeam[] = [
  {
    id: 1,
    name: "Disaster Response Unit Alpha",
    members: 12,
    status: "Deployed",
    contact: "98510XXXXX",
  },
  {
    id: 2,
    name: "Nepal Red Cross Squad-2",
    members: 8,
    status: "Standby",
    contact: "98412XXXXX",
  },
  {
    id: 3,
    name: "APF Rescue Group Delta",
    members: 20,
    status: "On Route",
    contact: "98011XXXXX",
  },
];

// 🚨 FIX: Default assignment context (teams = defaultTeams)
// If the incoming props array is empty, it will automatically load our mock items
export default function Rescueteam({ teams }: { teams: RescueTeam[] }) {
  // If teams prop from parent has items, use it. Otherwise, use defaultTeams list.
  const displayTeams = teams && teams.length > 0 ? teams : defaultTeams;

  return (
    <div className="bg-[#111c40] rounded-xl p-6 border border-slate-800">
      <h2 className="font-black mb-5 text-white text-lg">Rescue Teams</h2>
      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
        {displayTeams.map((t) => (
          <div
            key={t.id}
            className="bg-[#0b132b] p-4 rounded-xl border border-slate-800/50"
          >
            <h3 className="font-bold text-white">{t.name}</h3>
            <p className="text-sm text-slate-400 mt-1">Contact: {t.contact}</p>
            <p className="text-sm text-slate-300">Crew Members: {t.members}</p>
            <span className="inline-block mt-2 text-xs font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded">
              {t.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
