"use client";
import { useState } from "react";

interface Document {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  description: string | null;
}

export default function DocumentUpload({ intakeId }: { intakeId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("description", description);

    const res = await fetch(`/api/intakes/${intakeId}/documents`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const newDoc = await res.json();
      setDocuments((prev) => [newDoc, ...prev]);
      setFile(null);
      setDescription("");
    }
    setUploading(false);
  };

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="text-left mt-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Supporting Documents</h3>

      <div className="space-y-3">
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-gray-500"
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full bg-gray-900 text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? "Uploading..." : "Upload Document"}
        </button>
      </div>

      {documents.length > 0 && (
        <ul className="mt-4 space-y-2">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between text-sm text-gray-600 border border-gray-100 rounded-lg px-3 py-2">
              <a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                {doc.fileName}
              </a>
              <span className="text-gray-400">{formatSize(doc.fileSize)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}