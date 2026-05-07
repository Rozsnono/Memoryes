"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            // 1. Normalize the path (remove trailing slashes for comparison)
            const normalizedPath = pathname.replace(/\/$/, "") || "/";
            const publicRoutes = ["/login", "/register", "/"];
            const isPublicRoute = publicRoutes.includes(normalizedPath);

            const token = localStorage.getItem("memoria_token");

            // 2. Scenario: No Token
            if (!token) {
                if (!isPublicRoute) {
                    router.push("/login");
                } else {
                    setChecking(false);
                }
                return;
            }

            // 3. Scenario: Token exists -> Verify with Backend
            try {
                await apiClient.get("/api/auth/me");

                // If logged in and trying to access login/register, go to dashboard
                if (isPublicRoute) {
                    router.push("/dashboard");
                } else {
                    setChecking(false);
                }
            } catch (err: any) {
                // If token is invalid (401), clear it and redirect to login if on private route
                console.error("Auth Verification Failed", err);
                localStorage.removeItem("memoria_token");
                localStorage.removeItem("memoria_user");

                if (!isPublicRoute) {
                    router.push("/login");
                } else {
                    setChecking(false);
                }
            }
        };

        checkAuth();
    }, [pathname, router]);

    // Show loader while checking authentication for private routes
    const normalizedPath = pathname.replace(/\/$/, "") || "/";
    const isPublicRoute = ["/login", "/register", "/"].includes(normalizedPath);

    if (checking && !isPublicRoute) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-memoria-background text-memoria-primary">
                <Loader2 className="animate-spin mb-4" size={40} />
                <p className="text-[10px] font-black uppercase tracking-[4px]">Unlocking Vault...</p>
            </div>
        );
    }

    return <>{children}</>;
}