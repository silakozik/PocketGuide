import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PocketGuide Admin",
  description: "General Transfer Guide Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <main className="min-h-screen bg-gray-50/50">
          {children}
        </main>
      </body>
    </html>
  );
}
