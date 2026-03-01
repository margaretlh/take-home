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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading applications...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Queue</h1>
          <p className="text-sm text-gray-400">{intakes.length} application{intakes.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={async () => {
            await fetch("/api/auth", { method: "DELETE" });
            router.push("/login");
          }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Sign out
        </button>
      </div>

      <div className="flex h-[calc(100vh-65px)]">
        {/* Left panel — intake list */}
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto bg-white">
          {error && <p className="text-red-500 text-sm p-4">{error}</p>}
          {intakes.length === 0 ? (
            <p className="text-gray-400 text-sm p-4">No applications yet.</p>
          ) : (
            intakes.map((intake) => (
              <div
                key={intake.id}
                onClick={() => { setSelectedIntake(intake); setPrivileged(false); }}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedIntake?.id === intake.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900 text-sm">{intake.clientName}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[intake.status]}`}>
                    {intake.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{intake.clientEmail}</p>
                <p className="text-xs text-gray-400">
                  {new Date(intake.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Right panel — detail view */}
        <div className="flex-1 overflow-y-auto p-8">
          {!selectedIntake ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">Select an application to review</p>
            </div>
          ) : (
            <div className="max-w-2xl">
              {/* Detail header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedIntake.clientName}</h2>
                  <p className="text-sm text-gray-400">Submitted {new Date(selectedIntake.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Privileged toggle */}
                  <button
                    onClick={() => setPrivileged((prev) => !prev)}
                    className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      privileged
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {privileged ? "🔓 Privileged View" : "🔒 Redacted View"}
                  </button>
                </div>
              </div>

              {/* Status update */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
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
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {s.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Patient info */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
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
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Application Details</p>
                <p className="text-sm text-gray-700 mb-3">{selectedIntake.description}</p>
                {selectedIntake.notes && (
                  <p className="text-sm text-gray-500 italic">{selectedIntake.notes}</p>
                )}
              </div>

              {/* Documents */}
              {selectedIntake.documents.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
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

              {/* Document preview modal */}
              {previewDoc && (
                <DocumentPreviewModal
                  filePath={previewDoc.filePath}
                  fileName={previewDoc.fileName}
                  onClose={() => setPreviewDoc(null)}
                />
              )}
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Audit Trail</p>
                <AuditLog intakeId={selectedIntake.id} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
