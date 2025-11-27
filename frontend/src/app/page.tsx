"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LandingPage } from "./landing/landingPage";
import { authApi } from "@/api/auth";
import { toast } from "@/components/ui/use-toast";

/**
 * Safer Home (/) page:
 * - If a token exists, validate it with authApi.getMe() BEFORE redirecting.
 * - Only redirect when validation succeeds.
 * - If no token or validation fails, show LandingPage.
 */

type AuthMeResponse = {
  user?: { [k: string]: unknown } | null;
  [k: string]: unknown;
};

export default function Home() {
  const [state, setState] = useState<"checking" | "landing">("checking");
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      // Guard: only proceed in browser
      if (typeof window === "undefined") {
        if (mounted) setState("landing");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        if (mounted) setState("landing");
        return;
      }

      // We have a token — validate it with the server.
      try {
        // optional: toast to inform user
        try {
          toast({
            title: "Welcome back!",
            description: "Verifying session and redirecting...",
          });
        } catch {}

        const res = (await authApi.getMe()) as AuthMeResponse;
        // If res is truthy and indicates user, consider it valid
        const ok = !!(res && res.user);

        if (ok) {
          // Use next/router replace for SPA navigation (keeps history tidy)
          try {
            router.replace("/dashboard");
          } catch {
            // fallback to hard replace
            window.location.replace("/dashboard");
          }
          return; // don't set landing
        } else {
          // invalid -> clear token and go landing
          try {
            localStorage.removeItem("token");
          } catch {}
          if (mounted) setState("landing");
        }
      } catch (err) {
        // validation failed -> clear token and show landing
        try {
          localStorage.removeItem("token");
        } catch {}
        if (mounted) setState("landing");
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (state === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return <LandingPage />;
}
