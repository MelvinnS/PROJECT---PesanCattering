import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DK Catering - Pesan Menu Masakan Rumahan Harian",
  description:
    "Menu masakan rumahan segar berganti setiap hari. Mudah dipesan dan ramah keluarga.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="min-h-screen bg-[#F8F9FA] text-[#121212] antialiased">
        <div className="min-h-screen flex flex-col relative w-full">
          {children}
        </div>
      </body>
    </html>
  );
}
