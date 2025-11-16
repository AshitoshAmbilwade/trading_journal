// app/dashboard/page.tsx
"use client";

// This file exists so /dashboard is a valid route (prevents 404).
// It simply mounts your existing DashboardPage component (the router wrapper).
// Adjust the import path if your DashboardPage file is in a different location.

import DashboardPage from "./DashboardPage";

export default function DashboardRoute() {
  return <DashboardPage />;
}
