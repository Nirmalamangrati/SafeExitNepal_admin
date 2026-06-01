import React, { useState } from "react";

interface RescueTeam {
  id: string | number;
  name: string;
  contact: string;
  members: number | string;
  status: string;
}
export default function Rescueteam({
  teams: initialTeams,
}: {
  teams?: RescueTeam[];
}) {
  const [teams, setTeams] = useState<RescueTeam[]>(
    initialTeams && initialTeams.length > 0 ? initialTeams : [],
  );
  const [search, setSearch] = useState("");
  const [activeMenuId, setActiveMenuId] = useState<string | number | null>(
    null,
  );

  // MODAL STATES
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | number | null>(
    null,
  );
  // Form Field States
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [members, setMembers] = useState("");
  const [status, setStatus] = useState("Available");
  const openAddModal = () => {
    setEditingTeamId(null);
    setName("");
    setContact("");
    setMembers("");
    setStatus("Available");
    setIsModalOpen(true);
  };
  const openEditModal = (team: RescueTeam) => {
    setEditingTeamId(team.id);
    setName(team.name);
    setContact(team.contact);
    setMembers(String(team.members));
    setStatus(team.status);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contact || !members) return;

    if (editingTeamId !== null) {
      // edit mode
      setTeams(
        teams.map((t) =>
          t.id === editingTeamId
            ? { ...t, name, contact, members: Number(members), status }
            : t,
        ),
      );
    } else {
      // add mode
      const newTeam: RescueTeam = {
        id: Date.now(),
        name,
        contact,
        members: Number(members),
        status,
      };
      setTeams([newTeam, ...teams]);
    }
    // reset form and close modal
    setName("");
    setContact("");
    setMembers("");
    setIsModalOpen(false);
    setEditingTeamId(null);
  };
  // remove team from list
  const handleDeleteTeam = (id: string | number) => {
    if (window.confirm("Are you sure you want to delete this team?")) {
      setTeams(teams.filter((t) => t.id !== id));
      setActiveMenuId(null);
    }
  };
  // update team status directly from dropdown
  const handleStatusChange = (id: string | number, newStatus: string) => {
    setTeams(teams.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
    setActiveMenuId(null);
  };
  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Available":
        return "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20";
      case "Unavailable":
        return "text-rose-400 bg-rose-500/10 border border-rose-500/20";
      default:
        return "text-amber-400 bg-amber-500/10 border border-amber-500/20";
    }
  };
  return (
    <div className="bg-[#111c40] rounded-2xl p-6 border border-slate-800 shadow-2xl max-w-4xl mx-auto text-slate-100 font-sans antialiased relative">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-5 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Rescue Operation Teams
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage and track emergency deployments
          </p>
        </div>
        {/* Top Right Controls & Total Counter */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-700/60 flex items-center gap-2 shadow-inner h-10">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total:
            </span>
            <span className="text-cyan-400 font-black text-base">
              {teams.length}
            </span>
          </div>
          <button
            onClick={openAddModal}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all transform active:scale-[0.98] shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 h-10"
          >
            <span>+</span> Add Team
          </button>
        </div>
      </div>
      {/* Main Body Section */}
      <div className="flex flex-col gap-4">
        {/* Live Filter Search Input */}
        <div className="relative">
          <span className="absolute inset-y-0 left-4 flex items-center text-slate-500 pointer-events-none">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search rescue teams by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1e293b]/40 border border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-700 transition-all text-white placeholder-slate-400"
          />
        </div>
        {/* Content Listing Element */}
        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredTeams.length > 0 ? (
            filteredTeams.map((t) => (
              <div
                key={t.id}
                className="bg-[#1e293b]/30 hover:bg-[#1e293b]/50 p-5 rounded-2xl border border-slate-800/80 flex justify-between items-start relative transition-all duration-200 group hover:shadow-md"
              >
                <div className="space-y-2">
                  <h3 className="font-bold text-white text-base group-hover:text-cyan-400 transition-colors">
                    {t.name}
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="text-slate-500">📞</span> {t.contact}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-slate-500">👥</span> Crew:{" "}
                      <strong className="text-slate-200">{t.members}</strong>
                    </span>
                  </div>
                  <div className="pt-1">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg tracking-wide shadow-sm ${getStatusStyle(t.status)}`}
                    >
                      {t.status}
                    </span>
                  </div>
                </div>

                {/* Actions Context Button (3-Dot) */}
                <div className="relative">
                  <button
                    onClick={() =>
                      setActiveMenuId(activeMenuId === t.id ? null : t.id)
                    }
                    className="text-slate-500 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-all text-lg font-bold"
                  >
                    ⋮
                  </button>
                  {activeMenuId === t.id && (
                    <div className="absolute right-0 mt-2 w-44 bg-[#0f172a] border border-slate-700/80 rounded-xl shadow-2xl z-30 overflow-hidden text-xs divide-y divide-slate-800/60">
                      {/* Quick Status Modifiers */}
                      <div className="py-1">
                        <button
                          onClick={() => handleStatusChange(t.id, "Available")}
                          className="w-full text-left px-4 py-2 text-emerald-400 hover:bg-emerald-500/5 transition-colors font-medium flex items-center gap-2"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>{" "}
                          Set Available
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(t.id, "Unavailable")
                          }
                          className="w-full text-left px-4 py-2 text-rose-400 hover:bg-rose-500/5 transition-colors font-medium flex items-center gap-2"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>{" "}
                          Set Unavailable
                        </button>
                        <button
                          onClick={() => handleStatusChange(t.id, "On the Way")}
                          className="w-full text-left px-4 py-2 text-amber-400 hover:bg-amber-500/5 transition-colors font-medium flex items-center gap-2"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>{" "}
                          Set On the Way
                        </button>
                      </div>

                      {/* Hard Structural Modifiers (Edit & Delete) */}
                      <div className="py-1 bg-slate-900/40">
                        <button
                          onClick={() => openEditModal(t)}
                          className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors flex items-center gap-2"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(t.id)}
                          className="w-full text-left px-4 py-2 text-rose-500 hover:bg-rose-950/20 transition-colors flex items-center gap-2 font-medium"
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-500 py-10">
              <p className="text-sm">
                No rescue teams found. Try adjusting your search?
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-[#1e293b] w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">
                {editingTeamId !== null
                  ? " Edit Team Information"
                  : " Register New Rescue Team"}
              </h3>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Team Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kathmandu Rescue Unit"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Contact Number
                </label>
                <input
                  type="text"
                  placeholder="98XXXXXXXX"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Crew Members Count
                </label>
                <input
                  type="number"
                  placeholder="Total members"
                  value={members}
                  onChange={(e) => setMembers(e.target.value)}
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Website{" "}
                </label>
                <input
                  type="url"
                  placeholder="Enter website URL"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Deployment Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-white"
                >
                  <option value="Available">🟢 Available</option>
                  <option value="Unavailable">🔴 Unavailable</option>
                  <option value="On the Way">🟡 On the Way</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-700 text-white hover:bg-slate-600"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 text-white hover:bg-cyan-500"
                >
                  {editingTeamId !== null ? "Update Changes" : "Save Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
