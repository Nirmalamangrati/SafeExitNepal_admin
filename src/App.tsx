import React, { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { ShieldAlert, ExternalLink } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { ResourcesTab } from "./components/ResourcesTab";
import { AnalyticsTab } from "./components/AnalyticsTab";
import { ManualTab } from "./components/ManualTab";
const customMarkerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
interface LocationData {
  lat: number;
  lng: number;
}

interface SOSAlertPayload {
  eventId: string;
  victim: string;
  location: LocationData;
  locationName?: string;
  status: "PENDING" | "RESOLVED" | "ESCALATED_TO_POLICE" | "APPROVED";
  incidentCategory?: string;
}

interface BackendIncidentPayload {
  _id?: string;
  incidentCategory?: string;
  incidentType?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  reporterInfo?: {
    yourName?: string;
  };
}
const SOCKET_SERVER_URL = "https://safeexitnepal-backend-2.onrender.com";

/* MAP VIEW CONTROLLER */
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

/* LOGIN PAGE */
function Login({ onLogin }: { onLogin: () => void }): React.JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const ADMIN_EMAIL = "nishamgrt@gmail.com";
    const ADMIN_PASSWORD = "SafeExitNepal@123";
    if (email.trim() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      alert("Invalid email or password");
      return;
    }
    localStorage.setItem("userLoggedIn", "true");
    onLogin();
  };
  return (
    <div className="min-h-screen bg-[#0b132b] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* LOGIN CARD */}
        <form
          onSubmit={handleLogin}
          className="bg-[#111c40] border border-slate-800 rounded-2xl p-8 shadow-2xl"
        >
          {/* LOGO */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
              <ShieldAlert size={36} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-black text-red-500">SafeExit Nepal</h1>
            <p className="text-slate-400 text-sm mt-2">
              Emergency Command Center
            </p>
          </div>

          {/* TITLE */}
          <h2 className="text-xl font-bold text-white mb-6">
            Command Center Login
          </h2>

          {/* EMAIL */}
          <div className="mb-4">
            <label className="block text-sm text-slate-300 mb-2">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 outline-none focus:border-red-500"
            />
          </div>

          {/* PASSWORD */}
          <div className="mb-6">
            <label className="block text-sm text-slate-300 mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 outline-none focus:border-red-500"
            />
          </div>
          {/* FORGOT PASSWORD */}
          <div className="flex justify-end mt-2 mb-6">
            <button
              type="button"
              onClick={() => {
                alert(
                  "Please contact the system administrator to reset your password.",
                );
              }}
              className="text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Forgot Password?
            </button>
          </div>
          {/* LOGIN BUTTON */}
          <button
            type="submit"
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-all"
          >
            Login to Command Center
          </button>
        </form>
        <p className="text-center text-slate-500 text-xs mt-4">
          SafeExit Nepal Emergency Management System
        </p>
      </div>
    </div>
  );
}
export default function App(): React.JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTab, setCurrentTab] = useState<
    "incidents" | "resources" | "analytics" | "manual"
  >("incidents");
  const [criticalAlerts, setCriticalAlerts] = useState<SOSAlertPayload[]>([]);
  /*   SOUND */
  const [interacted, setInteracted] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  /* MAP */
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    27.7172, 85.324,
  ]);
  /*    MANUAL ALERT STATES */
  const [manualType, setManualType] = useState<string>("FLOOD");
  const [manualCategory, setManualCategory] = useState<string>("HIGH");
  const [locationName, setLocationName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [manualLat, setManualLat] = useState<string>("27.7172");
  const [manualLng, setManualLng] = useState<string>("85.3240");
  /* SHELTERS*/
  const shelters = [
    {
      id: 1,
      name: "Kapan Emergency Safe Camp",
      capacity: "120/200",
      status: "Active",
      amenities: "Food, Medical, Power",
      lat: 27.7342,
      lng: 85.3624,
    },

    {
      id: 2,
      name: "Balkhu Relief Center",
      capacity: "85/100",
      status: "Full",
      amenities: "Water, Medical",
      lat: 27.6841,
      lng: 85.3022,
    },

    {
      id: 3,
      name: "Sankhamul Shelter Home",
      capacity: "10/150",
      status: "Active",
      amenities: "Food, Blankets",
      lat: 27.6897,
      lng: 85.3341,
    },
  ];
  /*  SOUND FUNCTION */
  const triggerAlertSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };
  /* FETCH INITIAL INCIDENTS + SOCKET */
  useEffect(() => {
    // Login nagaresamma backend connection nagarne
    if (!isAuthenticated) {
      return;
    }
    const fetchInitialIncidents = async () => {
      try {
        const response = await fetch(`${SOCKET_SERVER_URL}/api/incidents`);
        const data = await response.json();
        if (response.ok && Array.isArray(data)) {
          const formattedData: SOSAlertPayload[] = data.map(
            (newIncident: BackendIncidentPayload) => ({
              eventId:
                newIncident._id || Math.random().toString(36).substr(2, 9),
              victim: newIncident.reporterInfo?.yourName || "Unknown Reporter",
              location: {
                lat: Number(newIncident.latitude) || 27.7172,
                lng: Number(newIncident.longitude) || 85.324,
              },
              locationName: newIncident.locationName || "Kapan, Kathmandu",
              status:
                (newIncident.status as SOSAlertPayload["status"]) || "PENDING",
              incidentCategory:
                newIncident.incidentType ||
                newIncident.incidentCategory ||
                "GENERAL",
            }),
          );
          setCriticalAlerts(formattedData);
          if (formattedData.length > 0) {
            setMapCenter([
              formattedData[0].location.lat,

              formattedData[0].location.lng,
            ]);
          }
        }
      } catch (err) {
        console.error("Database initialization fetch failed:", err);
      }
    };
    fetchInitialIncidents();
    /* SOCKET CONNECTION */
    const socket: Socket = io(SOCKET_SERVER_URL);
    socket.on("admin-new-incident", (newIncident: BackendIncidentPayload) => {
      const mappedIncident: SOSAlertPayload = {
        eventId: newIncident._id || Math.random().toString(36).substr(2, 9),
        victim:
          typeof newIncident.reporterInfo === "string"
            ? JSON.parse(newIncident.reporterInfo)?.yourName
            : newIncident.reporterInfo?.yourName || "Command Center",
        location: {
          lat: Number(newIncident.latitude) || 27.7172,
          lng: Number(newIncident.longitude) || 85.324,
        },
        locationName: newIncident.locationName || "Command Center Override",
        status: (newIncident.status as SOSAlertPayload["status"]) || "PENDING",
        incidentCategory:
          newIncident.incidentType || newIncident.incidentCategory || "GENERAL",
      };
      setCriticalAlerts((prev) => [mappedIncident, ...prev]);
      setMapCenter([mappedIncident.location.lat, mappedIncident.location.lng]);
      triggerAlertSound();
    });
    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated]);
  /* UPDATE INCIDENT STATUS */
  const updateIncidentStatus = async (
    eventId: string,
    newStatus: SOSAlertPayload["status"],
  ) => {
    try {
      const response = await fetch(
        `${SOCKET_SERVER_URL}/api/incidents/${eventId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        },
      );
      if (response.ok) {
        setCriticalAlerts((prev) =>
          prev.map((alert) =>
            alert.eventId === eventId
              ? {
                  ...alert,
                  status: newStatus,
                }
              : alert,
          ),
        );
      }
    } catch (err) {
      console.error(err);
    }
  };
  /*   DELETE INCIDENT*/
  const handleDelete = async (eventId: string) => {
    if (!window.confirm("Are you sure you want to delete this incident?")) {
      return;
    }
    try {
      const response = await fetch(
        `${SOCKET_SERVER_URL}/api/incidents/${eventId}`,
        {
          method: "DELETE",
        },
      );
      if (response.ok) {
        setCriticalAlerts((prev) =>
          prev.filter((alert) => alert.eventId !== eventId),
        );
      }
    } catch (err) {
      console.error(err);
    }
  };
  /*MANUAL ALERT SUBMIT*/
  const handleManualAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const latVal = parseFloat(manualLat) || 27.7172;
    const lngVal = parseFloat(manualLng) || 85.324;
    const fakeIncident = {
      incidentCategory: manualCategory.toLowerCase(),

      incidentType: manualType.toLowerCase(),

      incidentDate: new Date().toISOString(),

      locationName: locationName || "Command Center Override",

      latitude: latVal,

      longitude: lngVal,

      description: `Manual override alert for ${manualType} injected from Command Center.`,

      status: "PENDING",

      attachedFilePath: "",

      suspectInfo: JSON.stringify({
        name: "",
        age: "",
        gender: "",
        contact: "",
      }),

      reporterInfo: JSON.stringify({
        name: "Command Center",
        yourName: "Command Center",
        contact: "System Override",
        isAnonymous: false,
      }),
    };

    try {
      const response = await fetch(`${SOCKET_SERVER_URL}/api/incidents`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(fakeIncident),
      });

      if (response.ok) {
        alert("Alert broadcasted successfully!");

        setLocationName("");
      } else {
        alert("Failed to create manual alert.");
      }
    } catch (err) {
      console.error("API Connection Error:", err);

      alert("Network error. Cannot connect to server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /*
     IF NOT LOGGED IN → LOGIN PAGE*/

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  /* DASHBOARD*/

  return (
    <div
      onClick={() => {
        if (!interacted) {
          setInteracted(true);

          audioRef.current
            ?.play()
            .then(() => audioRef.current?.pause())
            .catch(() => {});
        }
      }}
      className="min-h-screen bg-[#0b132b] text-white"
    >
      <audio ref={audioRef} src="/sounds/alert.mp3" preload="auto" />

      {/*TOP BAR */}

      <header className="bg-[#111c40] border-b border-slate-800 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-red-500" />

          <h1 className="text-xl font-black text-red-500">SafeExit Nepal</h1>
        </div>

        <div className="flex items-center gap-4">
          <nav className="flex gap-2">
            <button
              onClick={() => setCurrentTab("incidents")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                currentTab === "incidents"
                  ? "bg-red-500 text-white"
                  : "bg-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              Reports
            </button>

            <button
              onClick={() => setCurrentTab("resources")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                currentTab === "resources"
                  ? "bg-red-500 text-white"
                  : "bg-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              Resources
            </button>
            <button
              onClick={() => setCurrentTab("analytics")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                currentTab === "analytics"
                  ? "bg-red-500 text-white"
                  : "bg-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setCurrentTab("manual")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                currentTab === "manual"
                  ? "bg-red-500 text-white"
                  : "bg-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              Manual Alert
            </button>
          </nav>
          {/* LOGOUT */}
          <button
            onClick={() => {
              localStorage.removeItem("userLoggedIn");
              setIsAuthenticated(false);
            }}
            className="px-3 py-2 rounded-lg text-xs font-bold bg-zinc-800 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
          >
            Logout
          </button>
        </div>
      </header>
      {/*MAIN CONTENT*/}
      <main className="p-6 max-w-7xl mx-auto">
        {/* INCIDENTS */}
        {currentTab === "incidents" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* LEFT */}
            <div className="lg:col-span-3 space-y-4">
              {criticalAlerts.map((alert) => (
                <div
                  key={alert.eventId}
                  onClick={() =>
                    setMapCenter([alert.location.lat, alert.location.lng])
                  }
                  className="bg-[#111c40] border border-slate-800 rounded-xl p-5 cursor-pointer hover:border-cyan-400 transition-all"
                >
                  {/* STATUS */}
                  <div
                    className={`inline-block text-[10px] font-bold px-2 py-1 rounded mb-3 ${
                      alert.status === "RESOLVED"
                        ? "bg-emerald-950 text-emerald-400"
                        : alert.status === "ESCALATED_TO_POLICE"
                          ? "bg-amber-950 text-amber-400"
                          : alert.status === "APPROVED"
                            ? "bg-blue-950 text-blue-400"
                            : "bg-red-950 text-red-400"
                    }`}
                  >
                    {alert.status}
                  </div>
                  {/* DETAILS */}
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Reporter:</strong> {alert.victim}
                    </p>
                    <p>
                      <strong>Category:</strong> {alert.incidentCategory}
                    </p>
                    <p>
                      <strong>Location:</strong>{" "}
                      {alert.locationName || "Kapan, Kathmandu"}
                    </p>
                  </div>
                  {/* BUTTONS */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {alert.status === "PENDING" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateIncidentStatus(alert.eventId, "APPROVED");
                        }}
                        className="px-3 py-1.5 rounded-md border border-blue-500 text-blue-400 text-xs font-bold"
                      >
                        Approve
                      </button>
                    )}
                    {alert.status === "ESCALATED_TO_POLICE" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateIncidentStatus(alert.eventId, "APPROVED");
                        }}
                        className="px-3 py-1.5 rounded-md border border-blue-500 text-blue-400 text-xs font-bold hover:bg-blue-500/10 cursor-pointer"
                      >
                        Approve Feed
                      </button>
                    )}
                    {alert.status === "PENDING" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateIncidentStatus(
                            alert.eventId,
                            "ESCALATED_TO_POLICE",
                          );
                        }}
                        className="border border-amber-500/40 hover:bg-amber-600/10 text-amber-400 text-xs font-bold py-2 px-3 rounded-lg transition-colors"
                      >
                        Escalate
                      </button>
                    )}
                    {alert.status !== "RESOLVED" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateIncidentStatus(alert.eventId, "RESOLVED");
                        }}
                        className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-bold"
                      >
                        Resolve
                      </button>
                    )}
                    {/* MAP */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(
                          `https://google.com/maps?q=${alert.location.lat},${alert.location.lng}`,
                          "_blank",
                        );
                      }}
                      className="px-3 py-1.5 rounded-md bg-slate-800 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <ExternalLink size={12} />
                      Maps
                    </button>
                    {/* DELETE */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(alert.eventId);
                      }}
                      className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {/* MAP */}
            <div className="lg:col-span-2 h-[700px] rounded-xl overflow-hidden border border-slate-800">
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{
                  height: "100%",
                  width: "100%",
                }}
              >
                <ChangeView center={mapCenter} />
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {criticalAlerts.map((alert) => (
                  <Marker
                    key={alert.eventId}
                    position={[alert.location.lat, alert.location.lng]}
                    icon={customMarkerIcon}
                  >
                    <Popup>
                      <div className="text-black">
                        <strong>{alert.incidentCategory}</strong>
                        <br />
                        Reporter: {alert.victim}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        )}
        {/* RESOURCES */}
        {currentTab === "resources" && (
          <ResourcesTab initialShelters={shelters} />
        )}
        {/* ANALYTICS */}
        {currentTab === "analytics" && (
          <div className="bg-[#111c40] border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">Analytics Dashboard</h2>
            <AnalyticsTab criticalAlerts={criticalAlerts} />
          </div>
        )}
        {/* MANUAL ALERT */}
        {currentTab === "manual" && (
          <ManualTab
            manualType={manualType}
            setManualType={setManualType}
            manualCategory={manualCategory}
            setManualCategory={setManualCategory}
            locationName={locationName}
            setLocationName={setLocationName}
            handleManualAlertSubmit={handleManualAlertSubmit}
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
            manualLat={manualLat}
            setManualLat={setManualLat}
            manualLng={manualLng}
            setManualLng={setManualLng}
          />
        )}
      </main>
    </div>
  );
}
