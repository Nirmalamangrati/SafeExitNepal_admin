import React, { useState, useEffect } from "react";

interface RescueTeam {
  id?: string | number;
  _id?: string;
  name: string;
  contact: string;
  members: number | string;
  email: string;
  website: string;
  status: string;
  location: string;
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
  const [teamEmail, setTeamEmail] = useState("");
  const [teamWebsite, setTeamWebsite] = useState("");
  const [teamLocation, setTeamLocation] = useState("");
  const [status, setStatus] = useState("Available");
  const baseUrl = "http://192.168.43.132:8000/api/teams";
  // INITIAL DATA FETCH
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch(baseUrl);
        if (!response.ok) throw new Error("Failed to fetch teams");
        const data = await response.json();
        setTeams(data);
      } catch (error) {
        console.error("Error loading teams from database:", error);
      }
    };
    fetchTeams();
  }, []);

  const openAddModal = () => {
    setEditingTeamId(null);
    setName("");
    setContact("");
    setMembers("");
    setTeamEmail("");
    setTeamWebsite("");
    setTeamLocation("");
    setStatus("Available");
    setIsModalOpen(true);
  };

  const openEditModal = (team: RescueTeam) => {
    const currentId = team._id || team.id || null;
    setEditingTeamId(currentId);
    setName(team.name);
    setContact(team.contact);
    setMembers(String(team.members));
    setStatus(team.status);
    setTeamEmail(team.email);
    setTeamWebsite(team.website);
    setTeamLocation(team.location);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };
  //  FORM SUBMIT FUNCTION (ADD / EDIT)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contact || !members || !teamLocation) {
      alert("Please fill in all required fields.");
      return;
    }
    const teamPayload = {
      name,
      contact,
      members: Number(members),
      email: teamEmail || "",
      website: teamWebsite || "",
      status,
      location: teamLocation,
    };
    try {
      if (editingTeamId !== null) {
        // EDIT MODE (PUT REQUEST)
        const response = await fetch(`${baseUrl}/${editingTeamId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(teamPayload),
        });

        if (!response.ok) throw new Error("Failed to update team");
        const data = await response.json();

        setTeams((prev) =>
          prev.map((t) =>
            t.id === editingTeamId || t._id === editingTeamId ? data : t,
          ),
        );
      } else {
        // ADD MODE (POST REQUEST)
        const response = await fetch(baseUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(teamPayload),
        });

        if (!response.ok) throw new Error("Failed to add team");
        const savedTeam = await response.json();
        setTeams((prev) => [savedTeam, ...prev]);
      }
      // reset form and close modal
      setName("");
      setContact("");
      setMembers("");
      setTeamEmail("");
      setTeamWebsite("");
      setTeamLocation("");
      setIsModalOpen(false);
      setEditingTeamId(null);
    } catch (error) {
      console.error("Error saving team:", error);
      alert("Data can not be saved. Please try again.");
    }
  };
  //  REMOVE TEAM FUNCTION (DELETE)
  const handleDeleteTeam = async (id: string | number) => {
    if (!window.confirm("Are you sure you want to delete this team?")) return;

    try {
      const response = await fetch(`${baseUrl}/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error("Failed to delete the team from the server.");
      }
      setTeams((prevTeams) =>
        prevTeams.filter((t) => t.id !== id && t._id !== id),
      );
      setActiveMenuId(null);
    } catch (error) {
      console.error("Error deleting team:", error);
      alert("Could not delete team. Please try again.");
    }
  };
  //  STATUS CHANGE FUNCTION (PATCH)
  const handleStatusChange = async (id: string | number, newStatus: string) => {
    try {
      const response = await fetch(`${baseUrl}/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        throw new Error("Failed to update team status on the server.");
      }
      setTeams((prevTeams) =>
        prevTeams.map((t) =>
          t.id === id || t._id === id ? { ...t, status: newStatus } : t,
        ),
      );
      setActiveMenuId(null);
    } catch (error) {
      console.error("Error updating team status:", error);
      alert("Could not update status. Please try again.");
    }
  };

  // Performance optimized search filtering
  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(search.trim().toLowerCase()),
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
    <div className="bg-[#111c40] rounded-2xl p-6 border border-slate-800 shadow-2xl max-w-4xl mx-auto text-slate-100 font-sans antialiased relative max-h-[105vh] overflow-y-auto">
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
            <span>+</span> Register Team
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
            className="w-full bg-[#0a1128] border border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-700 transition-all text-white placeholder-slate-400"
          />
        </div>
        {/* Content Listing Element */}
        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredTeams.length > 0 ? (
            filteredTeams.map((t) => (
              <div
                key={t.id}
                className="bg-[#0b132b]  p-5 rounded-2xl border border-slate-800/80 flex justify-between items-start relative transition-all duration-200 group hover:shadow-md"
              >
                <div className="space-y-2">
                  <h3 className="font-bold text-white text-base group-hover:text-cyan-400 transition-colors">
                    {t.name}
                  </h3>
                  <div className="flex flex-col gap-3 text-xs text-slate-400 mt-2">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex flex-col gap-1.5 min-w-[200px]">
                        <span className="flex items-center gap-1.5">
                          <span className="text-slate-500">📞</span> {t.contact}
                        </span>
                        {t.email && (
                          <span className="flex items-center gap-1.5">
                            <span className="text-slate-500">✉️</span> {t.email}
                          </span>
                        )}
                        {t.website && (
                          <a
                            href={
                              t.website.startsWith("http")
                                ? t.website
                                : `https://${t.website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-blue-400 hover:underline hover:text-blue-300 transition-colors"
                          >
                            <span className="text-slate-500">🌐</span> Website
                          </a>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5 sm:items-end">
                        <span className="flex items-center gap-1.5">
                          <span className="text-slate-500 font-medium">
                            Address:
                          </span>{" "}
                          <strong className="text-cyan-400/90">
                            {t.location}
                          </strong>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="text-slate-500">👥</span> Crew:{" "}
                          <strong className="text-slate-200">
                            {t.members}
                          </strong>
                        </span>
                      </div>
                    </div>
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
                  {(() => {
                    const teamId = t._id || t.id || "";

                    return (
                      <>
                        <button
                          onClick={() =>
                            setActiveMenuId(
                              activeMenuId === teamId ? null : teamId,
                            )
                          }
                          className="text-slate-500 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-all text-lg font-bold"
                        >
                          ⋮
                        </button>

                        {activeMenuId === teamId && (
                          <div className="absolute right-0 mt-2 w-44 bg-[#0f172a] border border-slate-700/80 rounded-xl shadow-2xl z-30 overflow-hidden text-xs divide-y divide-slate-800/60">
                            {/* Quick Status Modifiers */}
                            <div className="py-1">
                              <button
                                onClick={() =>
                                  handleStatusChange(teamId, "Available")
                                }
                                className="w-full text-left px-4 py-2 text-emerald-400 hover:bg-emerald-500/5 transition-colors font-medium flex items-center gap-2"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>{" "}
                                Set Available
                              </button>
                              <button
                                onClick={() =>
                                  handleStatusChange(teamId, "Unavailable")
                                }
                                className="w-full text-left px-4 py-2 text-rose-400 hover:bg-rose-500/5 transition-colors font-medium flex items-center gap-2"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>{" "}
                                Set Unavailable
                              </button>
                              <button
                                onClick={() =>
                                  handleStatusChange(teamId, "On the Way")
                                }
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
                                className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors flex items-center gap-2 font-medium"
                              >
                                ✏️ Edit Team
                              </button>
                              <button
                                onClick={() => handleDeleteTeam(teamId)}
                                className="w-full text-left px-4 py-2 text-rose-500 hover:bg-rose-950/20 transition-colors flex items-center gap-2 font-medium"
                              >
                                ❌ Delete Team
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
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

            <form
              onSubmit={handleFormSubmit}
              className="space-y-2 max-h-[420px] overflow-y-auto pr-2"
            >
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
                  Team Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kathmandu, Nepal"
                  value={teamLocation}
                  onChange={(e) => setTeamLocation(e.target.value)}
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-white"
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
                  value={teamEmail}
                  onChange={(e) => setTeamEmail(e.target.value)}
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
                  value={teamWebsite}
                  onChange={(e) => setTeamWebsite(e.target.value)}
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
