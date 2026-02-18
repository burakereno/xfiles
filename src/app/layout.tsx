import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "XFiles - AI Tweet Automation",
  description: "AI destekli X (Twitter) otomasyon ve viral içerik üretim platformu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Fixed Top Bar */}
        <TopBar />

        <div className="flex min-h-screen pt-14">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <main className="ml-16 flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
