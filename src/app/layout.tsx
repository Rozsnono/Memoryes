"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app'; // Import the App plugin
import { AuthGuard } from "@/components/AuthGuard";
import "./globals.css";
import { Toaster } from 'sonner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 1. Setup the Native Back Button Listener
    const setupBackButton = async () => {
      if (Capacitor.isNativePlatform()) {

        await App.addListener('backButton', ({ canGoBack }) => {
          // If we are on a main page (Dashboard/Login) and can't go back further
          if (pathname === '/dashboard' || pathname === '/login' || !canGoBack) {
            // Option A: Exit the app
            App.exitApp();

            // Option B: (Premium feel) Minimize app instead of closing
            // App.minimizeApp(); 
          } else {
            // Otherwise, tell the browser/Next.js to go back one page
            window.history.back();
          }
        });
      }
    };

    setupBackButton();

    // Cleanup listeners when component unmounts
    return () => {
      App.removeAllListeners();
    };
  }, [pathname]); // Re-run when pathname changes to ensure 'exit' logic is accurate

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
      </head>
      <body className="bg-slate-100 antialiased">
        <div className="max-w-md mx-auto h-screen bg-memoryes-background shadow-2xl relative app-scroller no-scrollbar">
          <AuthGuard>
            <div className="min-h-full">
              {children}
            </div>
          </AuthGuard>
        </div>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '20px',
              color: '#4A4E69', // memoria-clay
              fontFamily: 'inherit'
            },
          }}
        />
      </body>
    </html>
  );
}