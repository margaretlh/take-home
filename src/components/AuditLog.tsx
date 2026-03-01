"use client";

// TODO: Implement the audit log component
// This component should display the audit trail for an intake
//
// Features to implement:
// - Fetch and display audit log entries for a specific intake
// - Show action type, user who performed it, and timestamp
// - Display additional details (e.g., status changes, what was viewed)
// - Sort by most recent first

// interface AuditLogProps {
//   intakeId: string;
// }

// export default function AuditLog({ intakeId }: AuditLogProps) {
//   return (
//     <div>
//       <h3>Audit Trail</h3>
//       <p>Intake ID: {intakeId}</p>
//       <p>TODO: Implement audit log display</p>
//     </div>
//   );
// }

"use client";

import { useState, useEffect } from "react";

interface AuditEntry {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface AuditLogProps {
  intakeId: string;
}

const ACTION_COLORS: Record<string, string> = {
  CREATED: "bg-green-100 text-green-800",
  STATUS_CHANGED: "bg-blue-100 text-blue-800",
  DOCUMENT_UPLOADED: "bg-purple-100 text-purple-800",
  UPDATED: "bg-yellow-100 text-yellow-800",
  VIEWED: "bg-gray-100 text-gray-800",
};

function formatDetails(action: string, details: string | null): string {
  if (!details) return "";

  try {
    const parsed = JSON.parse(details);
    if (action === "STATUS_CHANGED" && parsed.from && parsed.to) {
      return `${parsed.from.replace("_", " ")} → ${parsed.to.replace("_", " ")}`;
    }
    if (action === "DOCUMENT_UPLOADED" && parsed.fileName) {
      return parsed.fileName;
    }
    return "";
  } catch {
    return "";
  }
}

export default function AuditLog({ intakeId }: AuditLogProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuditLog = async () => {
      try {
        const res = await fetch(`/api/intakes/${intakeId}`);
        if (!res.ok) throw new Error("Failed to fetch audit log");
        const data = await res.json();
        setEntries(data.auditLogs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLog();
  }, [intakeId]);

  if (loading) {
    return <p className="text-sm text-gray-400">Loading audit trail...</p>;
  }

  if (entries.length === 0) {
    return <p className="text-sm text-gray-400">No audit entries yet.</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div key={entry.id} className="flex items-start gap-3 text-sm">
          {/* Timeline dot */}
          <div className="mt-1 w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[entry.action] ?? "bg-gray-100 text-gray-800"}`}>
                {entry.action.replace("_", " ")}
              </span>
              <span className="text-gray-500">by {entry.user.name}</span>
              <span className="text-gray-400 text-xs">
                {new Date(entry.createdAt).toLocaleString()}
              </span>
            </div>
            {formatDetails(entry.action, entry.details) && (
              <p className="text-gray-500 mt-0.5 text-xs">
                {formatDetails(entry.action, entry.details)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
