import Link from "next/link";
import { Bus, Map, Settings, Home, Plane, Building2, Train } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:block">
        <div className="h-full flex flex-col p-4">
          <div className="mb-8 px-2">
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              PocketGuide
            </h2>
          </div>
          
          <nav className="flex-1 space-y-1">
            <Link href="/" className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition">
              <Home className="w-5 h-5 mr-3" />
              Dashboard
            </Link>
            <Link href="/admin/transfers" className="flex items-center px-4 py-2 text-blue-600 bg-blue-50 rounded-lg transition">
              <Bus className="w-5 h-5 mr-3" />
              Transfer Guide
            </Link>
          </nav>

          <div className="mt-auto pt-4 border-t border-gray-200">
            <div className="px-4 py-2 text-sm text-gray-500">
              Admin Console v0.1
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div className="flex items-center md:hidden">
            <h2 className="text-lg font-bold text-blue-600">PocketGuide</h2>
          </div>
          <div className="flex-1" />
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
              A
            </div>
            <span className="text-sm font-medium text-gray-700">Admin</span>
          </div>
        </header>

        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
