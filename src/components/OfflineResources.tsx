import React, { useState, useRef, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

interface OfflineResource {
  _id: string;
  title: string;
  version: string;
  type: string;
  size: string;
  resourceType: string;
  status: "Synced" | "Update Available" | "Downloaded";
  fileUrl: string;
}

//  1. Global App Configuration Placements (Declared above component scope)
const BACKEND_URL = "http://192.168.43.132:8000";

const firebaseConfig = {
  apiKey: "AIzaSyDhdIUq-0Gs26g4d_0uHTL2eAwFg0JmGow",
  authDomain: "://firebaseapp.com",
  projectId: "safeexit-nepal",
  storageBucket: "safeexit-nepal.firebasestorage.app",
  messagingSenderId: "570571904002",
  appId: "1:570571904002:web:93ddfbad19c173c385831b",
};

// Initialize Firebase Core and Messaging instances global scope
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const OfflineResources: React.FC = () => {
  const [offlineResources, setOfflineResources] = useState<OfflineResource[]>(
    [],
  );
  const [newResTitle, setNewResTitle] = useState("");
  const [newResVersion, setNewResVersion] = useState("");
  const [newResourceType, setNewResourceType] = useState("Map");
  const [newResSize, setNewResSize] = useState("");
  const [newResStatus, setNewResStatus] = useState<
    "Synced" | "Update Available" | "Downloaded"
  >("Downloaded");
  const [loading, setLoading] = useState(false);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  //  2. Push Notification Orchestration Hook
  useEffect(() => {
    const handleNotifications = async () => {
      try {
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
          const token = await getToken(messaging, {
            vapidKey:
              "BBbR-lAhvsS1Uu6dGWI7j7MF8JE8ybCAxiKSfe9yTX6GbjuyqdJz7G3uM6GNecLcq6OmLmvUqtVb5flsH8985r8",
          });

          if (token) {
            console.log("FCM Token generated successfully:", token);

            await fetch(`${BACKEND_URL}/api/resources/save-token`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token }),
            });
          }
        }
      } catch (error) {
        console.error("Notification registration setup failed:", error);
      }
    };

    handleNotifications();

    const unsubscribe = onMessage(messaging, (payload) => {
      alert(`${payload.notification?.title}\n${payload.notification?.body}`);
      setInitialFetchDone(false);
    });

    return () => unsubscribe();
  }, []);

  //  3. Resource Hydration Hook
  useEffect(() => {
    let isMounted = true;
    const fetchResources = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/resources`);
        const data = await response.json();
        if (isMounted && Array.isArray(data)) {
          setOfflineResources(data);
          setInitialFetchDone(true);
        }
      } catch (error) {
        console.error("Failed to load records from backend server:", error);
      }
    };
    if (!initialFetchDone) {
      fetchResources();
    }
    return () => {
      isMounted = false;
    };
  }, [initialFetchDone]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewResTitle(file.name);
      setNewResSize(formatFileSize(file.size));
    }
  };

  const clearForm = () => {
    setNewResTitle("");
    setNewResVersion("");
    setNewResSize("");
    setNewResStatus("Downloaded");
    setEditingId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddOfflineResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (editingId) {
      try {
        const response = await fetch(
          `${BACKEND_URL}/api/resources/${editingId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              resourceType: newResourceType,
              version: newResVersion || "v1.0.0",
              status: newResStatus,
            }),
          },
        );
        const result = await response.json();
        if (result.success || response.ok) {
          setOfflineResources(
            offlineResources.map((r) =>
              r._id === editingId
                ? {
                    ...r,
                    resourceType: newResourceType,
                    version: newResVersion,
                    status: newResStatus,
                  }
                : r,
            ),
          );
          clearForm();
        }
      } catch (error) {
        console.error("Edit process crashed:", error);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (!fileInputRef.current?.files?.[0]) {
      setLoading(false);
      return;
    }
    const file = fileInputRef.current.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("resourceType", newResourceType);
    formData.append("version", newResVersion || "v1.0.0");
    try {
      const response = await fetch(`${BACKEND_URL}/api/resources/upload`, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        setOfflineResources([result.data, ...offlineResources]);
        clearForm();
      }
    } catch (error) {
      console.error("Upload process crashed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRes = (id: string) => {
    const resToEdit = offlineResources.find((r) => r._id === id);
    if (!resToEdit) return;
    setEditingId(resToEdit._id);
    setNewResTitle(resToEdit.title);
    setNewResVersion(resToEdit.version);
    setNewResSize(resToEdit.size);
    setNewResStatus(resToEdit.status);
  };

  const handleDeleteRes = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this resource file permanently?",
      )
    ) {
      return;
    }
    try {
      const response = await fetch(`${BACKEND_URL}/api/resources/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        setOfflineResources(offlineResources.filter((r) => r._id !== id));
      }
    } catch (error) {
      console.error("Deletion execution halted:", error);
    }
  };
  return (
    <div className="bg-[#111c40] rounded-xl p-6 border border-slate-800 space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="font-black text-white text-lg mb-4">
          Offline Resources (Database Synced)
        </h2>
        <form
          onSubmit={handleAddOfflineResource}
          className="bg-[#0b132b] p-4 rounded-xl border border-slate-800 mb-4 space-y-3"
        >
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {editingId
              ? "Update Selected Resource Configuration"
              : "Add New Resource File"}
          </h4>
          <div className="w-full">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              id="file-upload-input"
              disabled={!!editingId}
            />
            <label
              htmlFor="file-upload-input"
              className={`flex items-center justify-center border border-slate-700 bg-[#111c40] rounded-lg p-2.5 text-sm text-slate-300 transition ${editingId ? "opacity-40 cursor-not-allowed" : "hover:text-white hover:border-indigo-500 cursor-pointer"}`}
            >
              {newResTitle
                ? `Selected: ${newResTitle}`
                : "📁 Click here to choose a file from your computer"}
            </label>
          </div>
          <input
            type="text"
            placeholder="Resource Title (Auto-filled)"
            value={newResTitle}
            disabled
            className="w-full bg-[#111c40]/50 border border-slate-700 rounded-lg p-2 text-sm text-slate-400 focus:outline-none"
          />
          {/* Grid with 4 columns for Type, Version, Size, and Status */}
          <div className="grid grid-cols-4 gap-2">
            {/* 1. Resource Type Selection */}
            <select
              value={newResourceType}
              onChange={(e) => setNewResourceType(e.target.value)}
              className="w-full bg-[#111c40] border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="Map">Map</option>
              <option value="Guide">Guide</option>
              <option value="Manual">Manual</option>
              <option value="Procedure">Procedure</option>
              <option value="Image">Image</option>
            </select>
            {/* 2. Version Input */}
            <input
              type="text"
              placeholder="Version"
              value={newResVersion}
              onChange={(e) => setNewResVersion(e.target.value)}
              className="w-full bg-[#111c40] border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            {/* 3. Auto-calculated File Size */}
            <input
              type="text"
              placeholder="Size"
              value={newResSize}
              disabled
              className="w-full bg-[#111c40]/50 border border-slate-700 rounded-lg p-2 text-sm text-slate-400 focus:outline-none"
            />
            {/* 4. Availability Status Selection */}
            <select
              value={newResStatus}
              onChange={(e) =>
                setNewResStatus(
                  e.target.value as
                    | "Synced"
                    | "Update Available"
                    | "Downloaded",
                )
              }
              className="w-full bg-[#111c40] border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="Downloaded">Downloaded</option>
              <option value="Synced">Synced</option>
              <option value="Update Available">Update</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 rounded-lg text-sm transition disabled:bg-slate-800 disabled:text-slate-500"
            >
              {loading
                ? "Writing metadata changes..."
                : editingId
                  ? "Save Changes"
                  : "+ Add resources"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={clearForm}
                className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-1.5 px-4 rounded-lg text-sm transition"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
        {/*  Scrollable container with clean styled scrollbars for modern web browsers */}
        <div className="space-y-3 max-h-[300px] overflow-y-auto block pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {offlineResources.length === 0 ? (
            <p className="text-slate-500 text-xs text-center py-4">
              No active resources managed inside remote server cluster node
              index.
            </p>
          ) : (
            offlineResources.map((res) => (
              <div
                key={res._id}
                className="bg-[#0b132b] p-4 rounded-xl border border-slate-800/50 flex justify-between items-start"
              >
                <div className="max-w-[70%]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={res.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-white text-sm hover:text-indigo-400 hover:underline transition"
                    >
                      {res.title}
                    </a>
                    <span className="text-[10px] bg-indigo-950 text-indigo-400 px-1.5 py-0.5 rounded font-mono">
                      {res.resourceType || "Map"}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {res.version || "v1.0.0"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    File Size: {res.size}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/50 text-emerald-400">
                    {res.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditRes(res._id)}
                    className="text-slate-500 hover:text-indigo-400 text-xs p-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRes(res._id)}
                    className="text-slate-500 hover:text-red-400 text-xs p-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
