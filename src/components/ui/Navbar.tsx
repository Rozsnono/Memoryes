"use client";

import { Home, MessageCircle, Map as MapIcon, User, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const Navbar = () => {
    const pathname = usePathname();

    // Hide navbar on chat and upload screens for better focus
    const hiddenRoutes = ["/chat", "/upload", "/onboarding"];
    if (hiddenRoutes.some(route => pathname.startsWith(route))) return null;

    const navItems = [
        { icon: Home, label: "Vault", href: "/dashboard" },
        { icon: MessageCircle, label: "Chat", href: "/chat" },
        { icon: Plus, label: "Add", href: "/upload", isCenter: true },
        { icon: MapIcon, label: "Map", href: "/map" },
        { icon: User, label: "Profile", href: "/profile" },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-6 px-4 pointer-events-none">
            <nav className="w-full max-w-md h-20 bg-white/80 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] shadow-2xl flex items-center justify-around px-2 pointer-events-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    if (item.isCenter) {
                        return (
                            <Link key="add" href={item.href} className="relative -mt-12">
                                <div className="w-16 h-16 bg-memoria-clay rounded-full flex items-center justify-center shadow-xl shadow-memoria-clay/40 active:scale-90 transition-transform">
                                    <Plus className="text-white" size={32} />
                                </div>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-memoria-primary' : 'text-slate-400'}`}
                        >
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
};