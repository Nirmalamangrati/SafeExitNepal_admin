import { useState, useEffect } from "react";
interface HotlineItem {
  _id: string;
  name: string;
  number: string;
  category: "National" | "Disaster" | "Medical" | "Security";
  icon: string;
  description: string;
}

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

  // 1. Fetch live database records when page loads
  const fetchHotlines = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/hotlines`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setHotlines(data);
      }
    } catch (error) {
      console.error("Failed to load records from MongoDB:", error);
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
      isMounted = false; // Prevents memory leaks and cascading renders
    };
  }, []);

  // 2. Create (Add) or Update (Edit) Action to MongoDB
  const handleSaveHotline = async (e: SubmitEvent | React.SyntheticEvent) => {
    e.preventDefault();

    if (!name || !number || !description) {
      alert("Please fill all input fields.");
      return;
    }

    const payload = { name, number, description, category, icon };

    try {
      if (editingId) {
        // PUT Request to Update existing record in MongoDB
        const response = await fetch(
          `${BACKEND_URL}/api/hotlines/${editingId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        if (response.ok) {
          alert("Emergency hotline updated in database!");
        }
      } else {
        // POST Request to Add new record to MongoDB
        const response = await fetch(`${BACKEND_URL}/api/hotlines`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          alert("New emergency hotline saved to MongoDB!");
        }
      }

      // Refresh data from server, reset fields and close modal
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

  // 3. DELETE Request to remove record from MongoDB
  const handleDelete = async (id: string) => {
    if (
      window.confirm(
        "Are you sure you want to permanently delete this hotline from MongoDB?",
      )
    ) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/hotlines/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          alert("Permanently removed from database.");
          fetchHotlines(); // Refresh list
        }
      } catch (error) {
        console.error("Failed to load records from MongoDB:", error);
        alert("Delete operation failed.");
      }
    }
  };

  const filteredHotlines = hotlines.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.number.includes(searchQuery),
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
            <div className="bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 shadow-sm text-center">
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
            <div className="bg-[#111c38] border border-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-2xl transform scale-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center mb-5 border-b border-slate-800 pb-3">
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
                    <input
                      type="text"
                      placeholder="🚨"
                      className="w-full bg-[#1b2647] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 text-center transition"
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                    />
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
        <div className="bg-[#111c38]/40 border border-slate-800 px-4 py-3.5 rounded-2xl mb-8 flex items-center shadow-inner">
          <span className="text-slate-400 mr-3 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search registered system entries by typing service name or contact number..."
            className="bg-transparent text-white placeholder-slate-500 text-sm w-full focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* System Records Grid Panels */}
        <h3 className="text-xs font-black tracking-widest text-slate-400 mb-5 uppercase">
          Live Control Database
        </h3>

        {loading ? (
          <div className="text-center text-gray-400 py-10 text-sm">
            Loading hotlines from database...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {filteredHotlines.length === 0 ? (
              <div className="text-slate-500 italic text-sm text-center col-span-full py-12 bg-slate-900/10 border border-dashed border-slate-800 rounded-2xl">
                No registered emergency entries found. Add your first hotline
                now!
              </div>
            ) : (
              filteredHotlines.map((item) => (
                <div
                  key={item._id}
                  className="bg-[#111c38] border border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition duration-200 shadow-md"
                >
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-3xl">{item.icon}</span>
                      <span
                        className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md border ${
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

                    <h4 className="text-white font-bold text-base mb-1">
                      {item.name}
                    </h4>

                    <a
                      href={`tel:${item.number}`}
                      className="inline-flex items-center text-red-400 text-sm font-black mb-2 hover:text-red-300 transition gap-1.5 group"
                    >
                      Call: {item.number}
                      <span className="text-xs bg-red-950/40 border border-red-900 px-1.5 py-0.5 rounded text-red-400 group-hover:bg-red-900 group-hover:text-white transition">
                        📞 Call Now
                      </span>
                    </a>

                    <p className="text-slate-400 text-xs leading-relaxed mb-6 line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Management Operations Control Panel */}
                  <div className="flex gap-3 border-t border-slate-800/60 pt-4 mt-auto">
                    <button
                      onClick={() => handleEditTrigger(item)}
                      className="flex-1 bg-[#1b2647] hover:bg-slate-700 text-amber-400 border border-slate-700/50 text-xs font-bold py-2.5 rounded-xl transition duration-150 cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="flex-1 bg-red-950/30 hover:bg-red-950/50 text-red-400 border border-red-900/40 text-xs font-bold py-2.5 rounded-xl transition duration-150 cursor-pointer"
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
