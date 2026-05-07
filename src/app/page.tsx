// app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Small delay to show the nice logo animation
    const timer = setTimeout(() => {
      const token = localStorage.getItem("memoria_token");
      if (token) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-memoria-background">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center mb-6"
      >
        <Heart className="text-memoria-primary fill-memoria-primary" size={40} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-3xl font-serif italic text-memoria-clay"
      >
        Memoria
      </motion.h1>

      <div className="absolute bottom-12">
        <div className="w-1 h-1 bg-memoria-primary rounded-full animate-ping" />
      </div>
    </div>
  );
}