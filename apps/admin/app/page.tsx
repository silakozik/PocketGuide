import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <h1 className="text-4xl font-bold mb-4">PocketGuide Admin</h1>
      <p className="text-lg text-gray-600 mb-8">Management console for PocketGuide travel assistant.</p>
      <Link 
        href="/admin/transfers" 
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Go to General Transfer Guide
      </Link>
    </div>
  );
}
