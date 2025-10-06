import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { QueryProvider } from "@/app/_adapters/_providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: "700",
  variable: '--font-space-grotesk'
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
      <body className={`${inter.className} ${spaceGrotesk.variable}`}>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}