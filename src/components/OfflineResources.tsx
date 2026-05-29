// src/components/OfflineResources.tsx
import React, { useState } from "react";

interface OfflineResource {
  id: string | number;
  title: string;
  version: string;
  size: string;
  status: "Synced" | "Update Available" | "Downloaded";
}

export const OfflineResources: React.FC = () => {
  const [offlineResources, setOfflineResources] = useState<OfflineResource[]>([
    {
      id: 1,
      title: "Kathmandu Valley Offline Map",
      version: "v1.4.2",
      size: "45MB",
      status: "Synced",
    },
    {
      id: 2,
      title: "First Aid & CPR Guide (PDF)",
      version: "v2.0.0",
      size: "12MB",
      status: "Downloaded",
    },
  ]);

  const [newResTitle, setNewResTitle] = useState("");
  const [newResVersion, setNewResVersion] = useState("");
  const [newResSize, setNewResSize] = useState("");
  const [newResStatus, setNewResStatus] = useState<
    "Synced" | "Update Available" | "Downloaded"
  >("Synced");

  const handleAddOfflineResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResTitle) return;
    const newRes: OfflineResource = {
      id: Date.now(),
      title: newResTitle,
      version: newResVersion || "v1.0.0",
      size: newResSize || "0MB",
      status: newResStatus,
    };
    setOfflineResources([newRes, ...offlineResources]);
    setNewResTitle("");
    setNewResVersion("");
    setNewResSize("");
  };

  const handleDeleteRes = (id: string | number) => {
    setOfflineResources(offlineResources.filter((r) => r.id !== id));
  };

  return (
    <div className="bg-[#111c40] rounded-xl p-6 border border-slate-800 space-y-6">
      <div>
        <h2 className="font-black text-white text-lg mb-4">
          Offline Resources
        </h2>

        {/* थप्ने फर्म */}
        <form
          onSubmit={handleAddOfflineResource}
          className="bg-[#0b132b] p-4 rounded-xl border border-slate-800 mb-4 space-y-3"
        >
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Add New Resource File
          </h4>
          <input
            type="text"
            placeholder="Resource Title (e.g. Emergency Map)"
            value={newResTitle}
            onChange={(e) => setNewResTitle(e.target.value)}
            className="w-full bg-[#111c40] border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Version"
              value={newResVersion}
              onChange={(e) => setNewResVersion(e.target.value)}
              className="w-full bg-[#111c40] border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              placeholder="Size"
              value={newResSize}
              onChange={(e) => setNewResSize(e.target.value)}
              className="w-full bg-[#111c40] border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            <select
              value={newResStatus}
              onChange={(e) => setNewResStatus(e.target.value as any)}
              className="w-full bg-[#111c40] border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="Synced">Synced</option>
              <option value="Downloaded">Downloaded</option>
              <option value="Update Available">Update</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 rounded-lg text-sm transition"
          >
            + Add File
          </button>
        </form>

        {/* सूची */}
        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
          {offlineResources.map((res) => (
            <div
              key={res.id}
              className="bg-[#0b132b] p-4 rounded-xl border border-slate-800/50 flex justify-between items-start"
            >
              <div className="max-w-[80%]">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-white text-sm">{res.title}</h3>
                  <span className="text-xs text-slate-500 font-mono">
                    {res.version}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  File Size: {res.size}
                </p>
                <span
                  className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${res.status === "Synced" || res.status === "Downloaded" ? "bg-emerald-950/50 text-emerald-400" : "bg-amber-950/50 text-amber-400"}`}
                >
                  {res.status}
                </span>
              </div>
              <button
                onClick={() => handleDeleteRes(res.id)}
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
