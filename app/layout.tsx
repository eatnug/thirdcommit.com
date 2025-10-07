import type { Metadata } from "next";
import { Gothic_A1, Inter } from "next/font/google";
import { QueryProvider } from "@/app/_adapters/_providers";
import { Header } from "@/app/_components/header";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const gothicA1 = Gothic_A1({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: '--font-gothic-a1'
});

export const metadata: Metadata = {
  title: "Jake Park — thirdcommit.com",
  description: "Jake Park — panic vibe-coding in public. Resume, brand, and a live catalog of panic shots under thirdcommit.com.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} ${gothicA1.variable} bg-white`}>
        <QueryProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}