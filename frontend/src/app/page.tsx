// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { LandingPage } from "./landing/landingPage";
import { authApi } from "@/api/auth";
import { toast } from "@/components/ui/use-toast";

/**
 * Safer Home (/) page:
 * - If a token exists, validate it with authApi.getMe() BEFORE redirecting.
 * - Only redirect when validation succeeds.
 * - If no token or validation fails, show LandingPage.
 */

export default function Home() {
  const [state, setState] = useState<"checking" | "landing">("checking");

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

        const res = await authApi.getMe(); // must reject on invalid
        // If res is truthy and indicates user, consider it valid
        const ok = !!(res && (res as any).user);

        if (ok) {
          // SPA navigate if possible, else hard replace
          try {
            // try to use Router.navigate if available (keeps history tidy)
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const router = require("@/utils/routes")?.useRouter?.();
            const navigate = router && (router as any).navigate;
            if (typeof navigate === "function") {
              navigate("/dashboard");
            } else {
              window.location.replace("/dashboard");
            }
            return; // don't set landing
          } catch (err) {
            window.location.replace("/dashboard");
            return;
          }
        } else {
          // invalid -> clear token and go landing
          try { localStorage.removeItem("token"); } catch {}
          if (mounted) setState("landing");
        }
      } catch (err) {
        // validation failed -> clear token and show landing
        try { localStorage.removeItem("token"); } catch {}
        if (mounted) setState("landing");
      }
    };

    run();
    return () => { mounted = false; };
  }, []);

  if (state === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return <LandingPage />;
}
