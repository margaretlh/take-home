"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DocumentUpload from "@/components/DocumentUpload";
import SignOutButton from "@/components/SignOutButton";

export default function IntakePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intakeId, setIntakeId] = useState<string | null>(null);

  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    dateOfBirth: "",
    ssn: "",
    description: "",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const errors: string[] = [];

    // Name validation
    if (!/^[a-zA-Z\s'-]+$/.test(form.clientName.trim())) {
      errors.push("Name can only contain letters, spaces, hyphens, and apostrophes");
    } else if (form.clientName.trim().length < 2) {
      errors.push("Please enter a valid full name");
    }

    // Phone validation
    const rawPhone = form.clientPhone.replace(/[-\s]/g, "");
    if (!/^\d{10}$/.test(rawPhone)) {
      errors.push("Phone number must be 10 digits e.g. 555-555-5555 or 5555555555");
    }

    // SSN validation
    const rawSSN = form.ssn.replace(/[-\s]/g, "");
    if (!/^\d{9}$/.test(rawSSN)) {
      errors.push("SSN must be 9 digits e.g. XXX-XX-XXXX or XXXXXXXXX");
    }

    // Include all errors
    if (errors.length > 0) {
      setError(errors.join("\n"));
      return null;
    }

    // Return formatted values before submitting
    return {
      ...form,
      clientName: form.clientName.trim(),
      clientPhone: `${rawPhone.slice(0,3)}-${rawPhone.slice(3,6)}-${rawPhone.slice(6)}`,
      ssn: `${rawSSN.slice(0,3)}-${rawSSN.slice(3,5)}-${rawSSN.slice(5)}`,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formattedForm = validate();
    if (!formattedForm) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/intakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit application");
      }

      const data = await res.json();
      setIntakeId(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Success state — show confirmation + document upload
  if (intakeId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Intake Submitted Successfully</h2>
          <p className="text-gray-400 text-sm mb-6">
            Your intake has been received and is now pending review. You will be notified once a
            reviewer processes your submission.
          </p>

          {/* Reference number */}
        <div className="bg-gray-50 rounded-xl px-6 py-4 mb-8 inline-block w-full">
          <p className="text-xs text-gray-400 mb-1">Reference Number</p>
          <p className="text-lg font-mono font-semibold text-gray-900">
            INT-{intakeId.slice(-3).toUpperCase()}
          </p>
        </div>
        
          <DocumentUpload intakeId={intakeId} />
          <button
            onClick={() => router.push("/")}
            className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors mt-4"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      {/* Back to Login */}
      <button
        onClick={() => router.push("/login")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        ← Back to Login
      </button>

      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Submit New Intake</h1>
        <p className="text-sm text-gray-500 mb-6">
          Please provide your personal information below. All fields marked with * are required.
          Your information is encrypted and securely stored.
        </p>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              name="clientName"
              type="text"
              value={form.clientName}
              onChange={handleChange}
              placeholder="John Smith"
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          {/* Email + Phone side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                name="clientEmail"
                type="email"
                value={form.clientEmail}
                onChange={handleChange}
                placeholder="john@example.com"
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                name="clientPhone"
                type="tel"
                value={form.clientPhone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>
          </div>

          {/* SSN + DOB side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Social Security Number *
              </label>
              <input
                name="ssn"
                type="text"
                value={form.ssn}
                onChange={handleChange}
                placeholder="123-45-6789"
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
              <p className="text-xs text-gray-400 mt-1">Format: XXX-XX-XXXX</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth *
              </label>
              <input
                name="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>
          </div>

          {/* Full Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Address *
            </label>
            <input
              name="description"
              type="text"
              value={form.description}
              onChange={handleChange}
              placeholder="123 Main St, City, State 12345"
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Any additional information you'd like to provide..."
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
            />
          </div>

          {/* Errors */}
          {error && (
            <div className="text-sm text-red-500 space-y-1">
              {error.split("\n").map((e, i) => (
                <p key={i}>• {e}</p>
              ))}
            </div>
          )}

          {/* Consent */}
          <div className="border border-gray-200 rounded-lg p-4 text-sm text-gray-500">
            By submitting this form, you consent to the collection and processing of your personal
            information in accordance with our privacy policy. Your data will be reviewed by authorized
            personnel only.
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : "Submit Intake"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
