import type { Metadata } from "next";
import "./globals.css";
import { SiteShell } from "@/components/layout/SiteShell";
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: "NovaDrive CarLink Solutions",
  description: "Modern car rental and logistics mobility across Kenya.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <SiteShell>{children}</SiteShell>
        <Analytics />
      </body>
    </html>
  );
}
