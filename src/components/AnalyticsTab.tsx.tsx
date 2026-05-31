import React from "react";

interface Alert {
  status: string;
}

interface AnalyticsTabProps {
  criticalAlerts: Alert[];
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  criticalAlerts,
}) => {
  return (
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
              criticalAlerts.filter((a) => a.status === "ESCALATED_TO_POLICE")
                .length
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
  );
};
