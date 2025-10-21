"use client";

import { useEffect, useState } from "react";
import {LandingPage} from "./landing/landingPage";
import App from "./dashboard/DashboardPage";
import { authApi } from "@/api/auth";
import { toast } from "@/components/ui/use-toast";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (token) {
          await authApi.getMe();
          setIsLoggedIn(true);

          toast({
            title: "Welcome back!",
            description: "Your trading dashboard is ready!",
          });
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  return <>{isLoggedIn ? <App /> : <LandingPage />}</>;
}
