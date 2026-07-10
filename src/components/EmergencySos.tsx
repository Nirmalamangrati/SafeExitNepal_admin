import { useState, useEffect } from "react";
interface HotlineItem {
  _id: string;
  name: string;
  number: string;
  category: "National" | "Disaster" | "Medical" | "Security";
  icon: string;
  description: string;
}
// 1.advance fuzzy search algorithm
const getLevenDistance = (a: string, b: string): number => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        //main part of this algorithm
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const fuzzySearch = (query: string, text: string): boolean => {
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase().trim();
  if (!q) return true;
  if (t.includes(q)) return true;
  const queryWords = q.split(/\s+/);
  const textWords = t.split(/\s+/);
  return queryWords.every((qWord) =>
    textWords.some((tWord) => {
      const distance = getLevenDistance(qWord, tWord);
      const maxAllowedErrors = 4; //4 ota letter ko galti maag garidinxa
      return distance <= maxAllowedErrors;
    }),
  );
};
// 2. main component
export const EmergencySosAdminWeb = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hotlines, setHotlines] = useState<HotlineItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States for Admin Input
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Security");
  const [icon, setIcon] = useState("🚨");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Your Node.js Server URL
  const BACKEND_URL = "http://192.168.43.132:8000";

  // Fetch live database records when page loads
  const fetchHotlines = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/hotlines`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setHotlines(data);
      }
    } catch (error) {
      console.error("Failed to load records :", error);
    } finally {
      setLoading(false);
    }
  };

  // React 19 safe async data fetching
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (isMounted) {
        await fetchHotlines();
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Create (Add) or Update (Edit) Action
  const handleSaveHotline = async (
    e: React.FormEvent | React.SyntheticEvent,
  ) => {
    e.preventDefault();
    if (!name || !number || !description) {
      alert("Please fill all input fields.");
      return;
    }
    const payload = { name, number, description, category, icon };
    try {
      if (editingId) {
        const response = await fetch(
          `${BACKEND_URL}/api/hotlines/${editingId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        if (response.ok) {
          alert("Emergency hotline updated!");
        }
      } else {
        const response = await fetch(`${BACKEND_URL}/api/hotlines`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          alert("New emergency hotline added");
        }
      }
      fetchHotlines();
      setName("");
      setNumber("");
      setDescription("");
      setIcon("🚨");
      setEditingId(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Database sync runtime error details:", error);
      alert("Server connection failed. Could not save.");
    }
  };

  // Trigger Edit Mode
  const handleEditTrigger = (item: HotlineItem) => {
    setEditingId(item._id);
    setName(item.name);
    setNumber(item.number);
    setDescription(item.description);
    setCategory(item.category);
    setIcon(item.icon);
    setIsModalOpen(true);
  };
  // DELETE Request to remove record from MongoDB
  const handleDelete = async (id: string) => {
    if (
      window.confirm(
        "Are you sure you want to permanently delete this hotline?",
      )
    ) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/hotlines/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchHotlines();
        }
      } catch (error) {
        console.error("Failed to load records from MongoDB:", error);
        alert("Delete operation failed.");
      }
    }
  };
  // 3. fuzzy search logic

  const filteredHotlines = hotlines.filter(
    (item) =>
      fuzzySearch(searchQuery, item.name) ||
      fuzzySearch(searchQuery, item.number),
  );
  return (
    <div className="bg-[#111c40] rounded-xl p-6 border border-slate-800 space-y-6 max-w-2xl mx-auto">
      <div className="max-w-5xl mx-auto">
        {/* Top Header Section with Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-6 mb-8 gap-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              SOS Admin Dashboard
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Central configuration management system for Nepal emergency
              hotlines database.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="bg-slate-900  px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 shadow-sm text-center">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Total:
              </span>
              <span className="text-cyan-400 font-black text-base">
                {hotlines.length}
              </span>
            </div>
            <button
              onClick={() => {
                setEditingId(null);
                setIsModalOpen(true);
              }}
              className="flex-1 sm:flex-none bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition duration-150 shadow-md cursor-pointer whitespace-nowrap"
            >
              + Add New Helpline
            </button>
          </div>
        </div>
        {/* Dynamic Pop-up Modal Form Box */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition duration-300">
            <div className="bg-[#111c38]  p-6 rounded-2xl shadow-2xl w-full max-w-2xl transform scale-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center mb-5  pb-3">
                <h2 className="text-sm font-black tracking-widest text-slate-200 uppercase">
                  {editingId
                    ? "⚙️ UPDATE REGISTRATION DETAILS"
                    : "➕ REGISTER NEW EMERGENCY SERVICE"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white font-bold text-lg p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSaveHotline} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">
                      Service Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Nepal Police, Traffic"
                      className="w-full bg-[#1b2647] border border-slate-700 text-white placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition shadow-inner"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">
                      Hotline Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 100, 102"
                      className="w-full bg-[#1b2647] border border-slate-700 text-white placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition shadow-inner"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">
                      Classification
                    </label>
                    <select
                      className="w-full bg-[#1b2647] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Security">Security</option>
                      <option value="Medical">Medical</option>
                      <option value="Disaster">Disaster</option>
                      <option value="National">National</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">
                      Emoji Icon
                    </label>
                    <select
                      className="w-full bg-[#1b2647] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                    >
                      {/* Set the actual emoji symbol inside the value attribute */}
                      <option value="👮">Nepal Police 👮</option>
                      <option value="🚑">Ambulance 🚑</option>
                      <option value="🚒">Fire Brigade 🚒</option>
                      <option value="🪖">APF Support 🪖</option>
                      <option value="➕">Red Cross ➕</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">
                    Short Description
                  </label>
                  <input
                    type="text"
                    placeholder="Provide brief details about this emergency service..."
                    className="w-full bg-[#1b2647] border border-slate-700 text-white placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition shadow-inner"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                {/* Submit & Cancel Buttons Panel */}
                <div className="flex gap-3 pt-3 border-t border-slate-800/60">
                  <button
                    type="submit"
                    className={`flex-1 py-3 rounded-xl font-bold text-sm text-white shadow-md transition duration-200 cursor-pointer ${
                      editingId
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    {editingId ? "Save Changes" : "Register Hotline"}
                  </button>
                  <button
                    type="button"
                    className="bg-slate-700 hover:bg-slate-600 px-5 rounded-xl font-bold text-xs cursor-pointer"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingId(null);
                      setName("");
                      setNumber("");
                      setDescription("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Live Filter Search Input */}
        <div className="bg-[#111c38]/40 border border-slate-800 px-2 py-0 rounded-xl -mt-12 mb-3 flex items-center shadow-inner w-full">
          <span className="text-slate-400 mr-1.5 text-[25px]">🔍</span>
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-white placeholder-slate-500 text-[11px] w-full focus:outline-none py-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {/* System Records Grid Panels */}
        <h3 className="text-[15px] font-black tracking-widest text-slate-400 mb-1.5 uppercase">
          Live Database
        </h3>
        {loading ? (
          <div className="max-w-[240px] w-full text-[10px] text-slate-400">
            Loading...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 w-full">
            {filteredHotlines.length === 0 ? (
              <div className="text-slate-500 italic text-[10px] text-center py-4 bg-slate-900/10 border border-dashed border-slate-800 rounded-lg w-full">
                No entries.
              </div>
            ) : (
              filteredHotlines.map((item) => (
                <div
                  key={item._id}
                  className="bg-[#111c38] border border-slate-800 p-2 rounded-lg flex flex-col justify-between hover:border-slate-700 transition duration-200 shadow-sm"
                >
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-base">{item.icon}</span>
                      <span
                        className={`text-[7px] uppercase font-black px-1 py-0.1 rounded border-0.5 ${
                          item.category === "Security"
                            ? "bg-blue-950/50 border-blue-800 text-blue-400"
                            : item.category === "Medical"
                              ? "bg-red-950/50 border-red-800 text-red-400"
                              : item.category === "Disaster"
                                ? "bg-amber-950/50 border-amber-800 text-amber-400"
                                : "bg-slate-800/80 border-slate-700 text-slate-400"
                        }`}
                      >
                        {item.category}
                      </span>
                    </div>

                    <h4 className="text-white font-bold text-[11px] mb-0.5 truncate">
                      {item.name}
                    </h4>
                    <div className="mb-1">
                      <a
                        href={`tel:${item.number}`}
                        className="inline-flex items-center text-red-400 text-[9px] font-black hover:text-red-300 transition gap-1 group"
                      >
                        {item.number}
                        <span className="text-[7px] bg-red-950/40 border border-red-900 px-0.5 py-0.1 rounded text-red-400 group-hover:bg-red-900 group-hover:text-white transition">
                          📞
                        </span>
                      </a>
                    </div>
                    <p className="text-slate-400 text-[9px] leading-tight mb-1 truncate">
                      {item.description}
                    </p>
                  </div>

                  {/* Management Operations Control Panel */}
                  <div className="flex gap-1 border-t border-slate-800/40 pt-1 mt-1">
                    <button
                      onClick={() => handleEditTrigger(item)}
                      className="flex-1 bg-[#1b2647] hover:bg-slate-700 text-amber-400 border border-slate-700/50 text-[9px] font-bold py-0.5 rounded transition duration-150 cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="flex-1 bg-red-950/30 hover:bg-red-950/50 text-red-400 border border-red-900/40 text-[9px] font-bold py-0.5 rounded transition duration-150 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
