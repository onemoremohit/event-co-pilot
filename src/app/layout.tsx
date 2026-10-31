import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Event Co-pilot — Cultural Community Celebration Planner",
  description: "Deterministic GenAI planner for society festivals, cultural nights, and community gatherings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
