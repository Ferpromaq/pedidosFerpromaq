// components/DashboardShell.tsx
"use client";

import Sidebar from "./Sidebar";

export default function DashboardShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role: string;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar role={role} />

      <main className="flex-1 overflow-y-auto p-4">
        {children}
      </main>
    </div>
  );
}