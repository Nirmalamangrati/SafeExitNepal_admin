import React, { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { ShieldAlert, ExternalLink } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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
// SOCKET URL
const SOCKET_SERVER_URL = "http://192.168.43.132:8000";
//MAP VIEW
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}
// MAIN APP
export default function App(): React.JSX.Element {
  const [currentTab, setCurrentTab] = useState<
    "incidents" | "resources" | "analytics" | "manual"
  >("incidents");
  const [criticalAlerts, setCriticalAlerts] = useState<SOSAlertPayload[]>([]);
  const [interacted, setInteracted] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    27.7172, 85.324,
  ]);
  //  SHELTERS
  const shelters = [
    {
      id: 1,
      name: "Kapan Emergency Safe Camp",
      capacity: "120/200",
      status: "Active",
      amenities: "Food, Medical, Power",
    },

    {
      id: 2,
      name: "Balkhu Relief Center",
      capacity: "85/100",
      status: "Full",
      amenities: "Water, Medical",
    },

    {
      id: 3,
      name: "Sankhamul Shelter Home",
      capacity: "10/150",
      status: "Active",
      amenities: "Food, Blankets",
    },
  ];
  //  TEAMS
  const teams = [
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
  // MANUAL ALERT
  const [manualType, setManualType] = useState("FLOOD");
  const [manualLat, setManualLat] = useState("27.7172");
  const [manualLng, setManualLng] = useState("85.3240");
  //  SOUND
  const triggerAlertSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;

      audioRef.current.play().catch(() => {});
    }
  };
  //FETCH DATA
  useEffect(() => {
    const fetchInitialIncidents = async () => {
      try {
        const response = await fetch(`${SOCKET_SERVER_URL}/api/incidents`);
        const data = await response.json();
        if (response.ok && Array.isArray(data)) {
          const formattedData: SOSAlertPayload[] = data.map(
            (newIncident: BackendIncidentPayload) => ({
              eventId:
                newIncident._id || Math.random().toString(36).substr(2, 9),
              victim: newIncident.reporterInfo?.yourName || "Nisha Mangrati",
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
        console.error("Database initialization fetch collapsed:", err);
      }
    };
    fetchInitialIncidents();

    const socket: Socket = io(SOCKET_SERVER_URL);
    socket.on("admin-new-incident", (newIncident: BackendIncidentPayload) => {
      const mappedIncident: SOSAlertPayload = {
        eventId: newIncident._id || Math.random().toString(36).substr(2, 9),
        victim: newIncident.reporterInfo?.yourName || "Unknown User",
        location: {
          lat: Number(newIncident.latitude) || 27.7172,
          lng: Number(newIncident.longitude) || 85.324,
        },
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
  }, []);
  // UPDATE STATUS
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
  // MANUAL ALERT SUBMIT
  const handleManualAlertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fakeIncident: SOSAlertPayload = {
      eventId:
        "MANUAL-" + Math.random().toString(36).substr(2, 5).toUpperCase(),
      victim: "Command Center Override",
      location: {
        lat: parseFloat(manualLat),
        lng: parseFloat(manualLng),
      },
      status: "PENDING",
      incidentCategory: manualType,
    };
    setCriticalAlerts((prev) => [fakeIncident, ...prev]);
    setMapCenter([fakeIncident.location.lat, fakeIncident.location.lng]);
    setCurrentTab("incidents");
    alert(" Manual incident broadcasted successfully!");
  };
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
      {/* TOP BAR */}

      <header className="bg-[#111c40] border-b border-slate-800 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-red-500" />

          <h1 className="text-xl font-black text-red-500">SafeExit Nepal</h1>
        </div>

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
      </header>

      {/* CONTENT */}
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
                        className="flex-1 lg:flex-none border border-amber-500/40 hover:bg-amber-600/10 text-amber-400 text-xs font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        title="Escalate to Local Security Forces"
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
          <div className="grid md:grid-cols-2 gap-6">
            {/* SHELTERS */}
            <div className="bg-[#111c40] rounded-xl p-6 border border-slate-800">
              <h2 className="font-black mb-5">Shelter Management</h2>
              <div className="space-y-4">
                {shelters.map((s) => (
                  <div key={s.id} className="bg-[#0b132b] p-4 rounded-xl">
                    <h3 className="font-bold">{s.name}</h3>
                    <p className="text-sm text-slate-400">
                      Amenities: {s.amenities}
                    </p>
                    <p className="text-sm">Capacity: {s.capacity}</p>
                    <span
                      className={`text-xs font-bold ${
                        s.status === "Full"
                          ? "text-red-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {/* TEAMS */}
            <div className="bg-[#111c40] rounded-xl p-6 border border-slate-800">
              <h2 className="font-black mb-5">Rescue Teams</h2>

              <div className="space-y-4">
                {teams.map((t) => (
                  <div key={t.id} className="bg-[#0b132b] p-4 rounded-xl">
                    <h3 className="font-bold">{t.name}</h3>
                    <p className="text-sm text-slate-400">
                      Contact: {t.contact}
                    </p>
                    <p className="text-sm">Crew Members: {t.members}</p>
                    <span className="text-xs font-bold text-cyan-400">
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS */}
        {currentTab === "analytics" && (
          <div className="bg-[#111c40] rounded-xl border border-slate-800 p-6">
            <h2 className="font-black mb-6">Incident Analytics</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-red-950 p-5 rounded-xl text-center">
                <h3 className="text-3xl font-black">
                  {criticalAlerts.filter((a) => a.status === "PENDING").length}
                </h3>

                <p className="text-red-400 text-sm">Pending</p>
              </div>

              <div className="bg-blue-950 p-5 rounded-xl text-center">
                <h3 className="text-3xl font-black">
                  {criticalAlerts.filter((a) => a.status === "APPROVED").length}
                </h3>

                <p className="text-blue-400 text-sm">Approved</p>
              </div>

              <div className="bg-amber-950 p-5 rounded-xl text-center">
                <h3 className="text-3xl font-black">
                  {
                    criticalAlerts.filter(
                      (a) => a.status === "ESCALATED_TO_POLICE",
                    ).length
                  }
                </h3>

                <p className="text-amber-400 text-sm">Escalated</p>
              </div>

              <div className="bg-emerald-950 p-5 rounded-xl text-center">
                <h3 className="text-3xl font-black">
                  {criticalAlerts.filter((a) => a.status === "RESOLVED").length}
                </h3>

                <p className="text-emerald-400 text-sm">Resolved</p>
              </div>
            </div>
          </div>
        )}

        {/* MANUAL */}
        {currentTab === "manual" && (
          <form
            onSubmit={handleManualAlertSubmit}
            className="bg-[#111c40] rounded-xl border border-slate-800 p-6 max-w-xl mx-auto space-y-5"
          >
            <h2 className="text-xl font-black">Manual Incident Override</h2>
            <div>
              <label className="text-sm font-bold">Incident Type</label>
              <select
                value={manualType}
                onChange={(e) => setManualType(e.target.value)}
                className="w-full bg-[#0b132b] border border-slate-700 rounded-xl p-3 mt-2"
              >
                <option value="FLOOD">FLOOD</option>
                <option value="LANDSLIDE">LANDSLIDE</option>
                <option value="EARTHQUAKE">EARTHQUAKE</option>

                <option value="FIRE">FIRE</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-bold">Latitude</label>

              <input
                type="text"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                className="w-full bg-[#0b132b] border border-slate-700 rounded-xl p-3 mt-2"
              />
            </div>
            <div>
              <label className="text-sm font-bold">Longitude</label>

              <input
                type="text"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                className="w-full bg-[#0b132b] border border-slate-700 rounded-xl p-3 mt-2"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-xl font-black"
            >
              Inject & Broadcast Alert
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
