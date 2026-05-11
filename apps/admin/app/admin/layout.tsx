"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bus, Home, Building2, ChartColumn } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/admin/transfers", label: "Transfer Guide", icon: Bus },
    { href: "/admin/cities", label: "City Data", icon: Building2 },
    { href: "/admin/reports", label: "User Reports", icon: ChartColumn },
  ];

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
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center rounded-lg px-4 py-2 transition ${
                    isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
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
