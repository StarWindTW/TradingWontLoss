import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from './providers';
import { Toaster } from "@/components/ui/toaster";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { Box } from "@chakra-ui/react/";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TradingWontLoss",
  description: "TradingWontLoss Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>
        <Providers>
          <Navbar />
          <Sidebar />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
