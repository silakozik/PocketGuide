import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <h1 className="text-4xl font-bold mb-4">PocketGuide Admin</h1>
      <p className="text-lg text-gray-600 mb-8">Management console for PocketGuide travel assistant.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/admin/transfers" className="rounded-lg bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700">
          Transfer Guide
        </Link>
        <Link href="/admin/cities" className="rounded-lg border border-gray-200 bg-white px-6 py-3 text-gray-700 transition hover:bg-gray-50">
          City Data
        </Link>
        <Link href="/admin/reports" className="rounded-lg border border-gray-200 bg-white px-6 py-3 text-gray-700 transition hover:bg-gray-50">
          User Reports
        </Link>
      </div>
    </div>
  );
}
