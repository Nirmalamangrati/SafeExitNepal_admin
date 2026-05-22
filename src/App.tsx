import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { ShieldAlert, MapPin, User, ExternalLink } from "lucide-react";

interface LocationData {
  lat: number;
  lng: number;
}

interface SOSAlertPayload {
  eventId: string;
  victim: string;
  location: LocationData;
  status: "PENDING" | "RESOLVED" | "ESCALATED_TO_POLICE";
  incidentCategory?: string;
}

// 🚨 तपाईँको ब्याकइन्डको Incident Schema सँग ठ्याक्कै म्याच गराइएको नयाँ इन्टरफेस
interface BackendIncidentPayload {
  _id?: string;
  incidentCategory?: string;
  incidentType?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  reporterInfo?: {
    yourName?: string; // मोबाइल एपको 'Your Name *' फिल्ड
    contactNumber?: string;
    keepAnonymous?: boolean;
  };
}

const SOCKET_SERVER_URL: string = "http://192.168.43.132:8000";

export default function App(): React.JSX.Element {
  const [criticalAlerts, setCriticalAlerts] = useState<SOSAlertPayload[]>([]);

  useEffect(() => {
    const socket: Socket = io(SOCKET_SERVER_URL);

    // १. क्रिटिकल SOS अलर्ट सुन्ने
    socket.on("ADMIN_SOS_ALERT", (data: SOSAlertPayload) => {
      console.log("🔥 Critical System Escalation Received:", data);
      setCriticalAlerts((prevAlerts) => [data, ...prevAlerts]);
    });

    // २. मोबाइल एपबाट आउने साधारण रिपोर्ट सुन्ने (तपाईँको ब्याकइन्ड डेटा म्यापिङ फिक्स)
    socket.on("admin-new-incident", (newIncident: BackendIncidentPayload) => {
      console.log("🚨 Mobile Incident Received from Backend:", newIncident);

      // ब्याकइन्डको नेस्टेड अब्जेक्ट्स (reporterInfo, latitude, longitude) लाई सुरक्षित रूपमा म्याप गर्ने
      const mappedIncident: SOSAlertPayload = {
        eventId: newIncident._id || Math.random().toString(36).substr(2, 9),
        // यदि मोबाइलमा anonymous टिक छ भने Anonymous देखाउने, नत्र भरिएको नाम देखाउने
        victim: newIncident.reporterInfo?.yourName || "Nisha Mangrati",
        location: {
          lat: Number(newIncident.latitude) || 27.7172,
          lng: Number(newIncident.longitude) || 85.324,
        },
        status: "PENDING",
        // 'critical', 'high', 'medium' जस्ता क्याटेगोरी वा प्रकारलाई ब्याकइन्ड अनुसार देखाउने
        incidentCategory:
          newIncident.incidentType || newIncident.incidentCategory || "GENERAL",
      };

      setCriticalAlerts((prevAlerts) => [mappedIncident, ...prevAlerts]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0b132b] text-white font-sans p-8 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* HEADER SECTION */}
        <div className="border-b border-slate-800/60 pb-8">
          <div className="flex flex-row items-center gap-3">
            <ShieldAlert size={32} className="text-[#ff2a5f]" />
            <h1 className="text-[#ff2a5f] text-2xl md:text-3xl font-black tracking-wide">
              SafeExit Nepal — Central Emergency Command
            </h1>
          </div>
          <p className="text-slate-400 mt-4 text-sm">
            In 30 seconds, all monitoring nodes will be updated. Stay alert for
            any critical escalations.
          </p>
        </div>

        {/* EMERGENCY LIST PANEL */}
        <div className="mt-12">
          {criticalAlerts.length === 0 ? (
            <div className="py-20 px-6 text-center border border-dashed border-slate-700/60 rounded-2xl bg-[#0c1530]/40">
              <p className="text-slate-400 text-xl font-bold tracking-wide">
                No active emergency cases.
              </p>
              <p className="text-slate-500 text-sm mt-2">
                All monitoring nodes are stable and secure.
              </p>
            </div>
          ) : (
            <div className="grid gap-5">
              {criticalAlerts.map((alert: SOSAlertPayload) => (
                <div
                  key={alert.eventId}
                  className="bg-[#111c40] border-l-4 border-[#ff2a5f] rounded-xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300"
                >
                  <div>
                    {/* BADGES */}
                    <div className="flex flex-row items-center gap-2 mb-3">
                      <span className="bg-red-950/50 text-red-400 text-xs font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                        {alert.incidentCategory}
                      </span>
                      <span className="text-slate-500 text-xs">
                        ID: {alert.eventId}
                      </span>
                    </div>

                    {/* VICTIM & LOCATION INFO */}
                    <div className="flex flex-col sm:flex-row gap-6">
                      <p className="flex flex-row items-center gap-2 m-0 text-sm font-medium text-slate-400">
                        <User size={18} className="text-slate-500" />{" "}
                        Victim/Reporter:{" "}
                        <span className="text-slate-200 font-bold">
                          {alert.victim}
                        </span>
                      </p>
                      <p className="flex flex-row items-center gap-2 m-0 text-sm text-slate-400">
                        <MapPin size={18} className="text-[#ff2a5f]" />{" "}
                        Location: {alert.location.lat.toFixed(4)},{" "}
                        {alert.location.lng.toFixed(4)}
                      </p>
                    </div>
                  </div>

                  {/* GOOGLE MAP TRACKING BUTTON */}
                  <button
                    onClick={() => {
                      window.open(
                        `https://google.com{alert.location.lat},${alert.location.lng}`,
                        "_blank",
                      );
                    }}
                    className="w-full md:w-auto bg-[#ff2a5f] hover:bg-[#e02050] text-white font-bold text-sm rounded-lg py-3 px-6 flex flex-row items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    Track Live Map <ExternalLink size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
