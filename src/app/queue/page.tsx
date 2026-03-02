"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuditLog from "@/components/AuditLog";
import DocumentPreviewModal from "@/components/DocumentPreviewModal";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Intake {
  id: string;
  status: "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED";
  createdAt: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  dateOfBirth: string;
  ssn: string;
  description: string;
  notes: string | null;
  submittedBy: User;
  reviewer: User | null;
  documents: { id: string; fileName: string; filePath: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_REVIEW: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

const STATUS_ICONS: Record<string, string> = {
  PENDING: "🕐",
  IN_REVIEW: "🔵",
  APPROVED: "✅",
  REJECTED: "❌",
};

const STATUS_CARD_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50",
  IN_REVIEW: "bg-blue-50",
  APPROVED: "bg-green-50",
  REJECTED: "bg-red-50",
};

function maskPII(value: string, type: "phone" | "dob" | "ssn") {
  if (type === "ssn") return `***-**-${value.slice(-4)}`;
  if (type === "phone") return `***-***-${value.slice(-4)}`;
  if (type === "dob") return `****-**-${value.slice(-2)}`;
  return value;
}

export default function QueuePage() {
  const router = useRouter();
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIntake, setSelectedIntake] = useState<Intake | null>(null);
  const [privileged, setPrivileged] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ filePath: string; fileName: string } | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"queue" | "audit">("queue");

  useEffect(() => {
    fetchIntakes();
  }, []);

  const fetchIntakes = async () => {
    try {
      const res = await fetch("/api/intakes");
      if (!res.ok) throw new Error("Failed to fetch intakes");
      const data = await res.json();
      setIntakes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (intakeId: string, status: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/intakes/${intakeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      const updated = await res.json();

      // Update local state
      setIntakes((prev) =>
        prev.map((i) => (i.id === intakeId ? { ...i, status: updated.status } : i))
      );
      if (selectedIntake?.id === intakeId) {
        setSelectedIntake((prev) => prev ? { ...prev, status: updated.status } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Stats counts
  const counts = {
    PENDING: intakes.filter((i) => i.status === "PENDING").length,
    IN_REVIEW: intakes.filter((i) => i.status === "IN_REVIEW").length,
    APPROVED: intakes.filter((i) => i.status === "APPROVED").length,
    REJECTED: intakes.filter((i) => i.status === "REJECTED").length,
  };

  // Filtered intakes
  const filtered = intakes.filter((intake) => {
    const matchesSearch =
      search === "" ||
      intake.clientName.toLowerCase().includes(search.toLowerCase()) ||
      intake.clientEmail.toLowerCase().includes(search.toLowerCase()) ||
      intake.id.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || intake.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading applications...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white">
      {/* Top navbar */}
      <div className="border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white text-sm font-bold">
              O
            </div>
            <span className="font-semibold text-gray-900">Intake Review</span>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("queue")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "queue"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              📋 Review Queue
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "audit"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              🕐 Audit Trail
            </button>
          </div>
        </div>

        {/* User info + sign out */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">Jane Smith</p>
            <p className="text-xs text-gray-400">Reviewer</p>
          </div>
          <button
            onClick={async () => {
              await fetch("/api/auth", { method: "DELETE" });
              router.push("/login");
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors text-lg"
            title="Sign out"
          >
            →
          </button>
        </div>
      </div>

      <div className="px-8 py-6">
        {activeTab === "queue" ? (
          <>
            {/* Page title */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Review Queue</h1>
              <p className="text-sm text-gray-400">Manage and review client intake submissions</p>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {(["PENDING", "IN_REVIEW", "APPROVED", "REJECTED"] as const).map((status) => (
                <div key={status} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${STATUS_CARD_COLORS[status]}`}>
                      {STATUS_ICONS[status]}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{status.replace("_", " ")}</p>
                      <p className="text-2xl font-bold text-gray-900">{counts[status]}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Table card */}
            <div className="bg-white rounded-xl border border-gray-200">
              {/* Table header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Intake Submissions</h2>
                  <p className="text-xs text-gray-400">{filtered.length} intakes found</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                    <input
                      type="text"
                      placeholder="Search by name, ID, or email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 w-64"
                    />
                  </div>
                  {/* Status filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">ID</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Client Name</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Email</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Submitted</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Reviewer</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {error && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-red-500 text-sm">{error}</td>
                    </tr>
                  )}
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-400 text-sm">
                        No applications found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((intake, index) => (
                      <tr key={intake.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-500">
                          INT-{String(index + 1).padStart(3, "0")}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{intake.clientName}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{intake.clientEmail}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(intake.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[intake.status]}`}>
                            {intake.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {intake.reviewer?.name ?? "—"}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => { setSelectedIntake(intake); setPrivileged(false); }}
                            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                          >
                            👁 View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          // Audit Trail tab
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
              <p className="text-sm text-gray-400">All actions taken on intake applications</p>
            </div>
            {selectedIntake ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <AuditLog intakeId={selectedIntake.id} />
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Select an application from the Review Queue to view its audit trail.</p>
            )}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedIntake && activeTab === "queue" && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedIntake(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedIntake.clientName}</h2>
                <p className="text-xs text-gray-400">Submitted {new Date(selectedIntake.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPrivileged((prev) => !prev)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    privileged
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {privileged ? "🔓 Privileged View" : "🔒 Redacted View"}
                </button>
                <button
                  onClick={() => setSelectedIntake(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Status update */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Status</p>
                <div className="flex gap-2 flex-wrap">
                  {["PENDING", "IN_REVIEW", "APPROVED", "REJECTED"].map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selectedIntake.id, s)}
                      disabled={updatingStatus || selectedIntake.status === s}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                        selectedIntake.status === s
                          ? STATUS_COLORS[s]
                          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {s.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Patient info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Patient Information</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <span className="text-gray-900">{selectedIntake.clientEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone</span>
                    <span className="text-gray-900">
                      {privileged ? selectedIntake.clientPhone : maskPII(selectedIntake.clientPhone, "phone")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date of Birth</span>
                    <span className="text-gray-900">
                      {privileged ? selectedIntake.dateOfBirth : maskPII(selectedIntake.dateOfBirth, "dob")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">SSN</span>
                    <span className="text-gray-900">
                      {privileged ? selectedIntake.ssn : maskPII(selectedIntake.ssn, "ssn")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Application details */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Application Details</p>
                <p className="text-sm text-gray-700 mb-2">{selectedIntake.description}</p>
                {selectedIntake.notes && (
                  <p className="text-sm text-gray-500 italic">{selectedIntake.notes}</p>
                )}
              </div>

              {/* Documents */}
              {selectedIntake.documents.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Documents</p>
                  <ul className="space-y-2">
                    {selectedIntake.documents.map((doc) => (
                      <li key={doc.id}>
                        <button
                          onClick={() => setPreviewDoc({ filePath: doc.filePath, fileName: doc.fileName })}
                          className="text-sm text-blue-600 hover:underline text-left"
                        >
                          {doc.fileName}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Audit trail */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Audit Trail</p>
                <AuditLog intakeId={selectedIntake.id} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document preview modal */}
      {previewDoc && (
        <DocumentPreviewModal
          filePath={previewDoc.filePath}
          fileName={previewDoc.fileName}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
