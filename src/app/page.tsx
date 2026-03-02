import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import SignOutButton from "@/components/SignOutButton";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Intake Review System</h1>
        <p className="text-gray-400">Secure document intake and review platform</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        {user ? (
          <>
            <p className="text-sm text-gray-500 mb-6">
              Signed in as <span className="font-medium text-gray-900">{user.name}</span>
            </p>

            {user.role === "PATIENT" && (
              <Link
                href="/intake"
                className="block w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors mb-3"
              >
                Submit Intake
              </Link>
            )}

            {user.role === "REVIEWER" && (
              <Link
                href="/queue"
                className="block w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors mb-3"
              >
                Review Queue
              </Link>
            )}

            <div className="mt-4">
              <SignOutButton />
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6">Please sign in to continue</p>
            <Link
              href="/login"
              className="block w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Sign In
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
