"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Sidebar from "../components/Sidebar";

const supabase = createClient();

/* ---------------- PROVIDERS ---------------- */
function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 30,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

/* ---------------- DASHBOARD ---------------- */
export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function cargarPerfil() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (mounted && profile?.role) {
        setRole(profile.role);
      }
    }

    cargarPerfil();

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <Providers>
      <main className="h-screen bg-[#f5f7fb] overflow-hidden">
        <div className="flex h-full">
          <Sidebar role={role ?? "usuario"} />

          {/* CONTENIDO */}
          <section className="flex-1 overflow-y-auto p-0">{children}</section>
        </div>
      </main>
    </Providers>
  );
}
