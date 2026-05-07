import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthGuard } from "@/components/AuthGuard";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif", style: 'italic' });

export const metadata: Metadata = {
  title: "Memoria",
  description: "Your emotion-centered digital memory book",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-slate-100`}>
        <div className="max-w-md mx-auto min-h-screen bg-memoria-background shadow-2xl relative overflow-x-hidden">
          <AuthGuard>
            {children}
          </AuthGuard>
        </div>
      </body>
    </html>
  );
}