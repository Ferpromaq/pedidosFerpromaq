"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [role, setRole] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function cargarPerfil() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role) {
        setRole(profile.role);
      }
    }

    cargarPerfil();
  }, []);

  async function cerrarSesion() {
    await supabase.auth.signOut();

    router.replace("/");
  }

  return (
    <main className="h-screen bg-[#f5f7fb] overflow-hidden">
      <div className="flex h-full">

        {/* SIDEBAR */}
        <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col h-screen px-4 py-4">

          {/* LOGO */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              F
            </div>

            <div>
              <h1 className="font-bold text-2xl text-zinc-900 leading-none">
                FERPROMAQ
              </h1>

              <p className="text-sm text-zinc-500">
                Sistema de Pedidos
              </p>
            </div>
          </div>

          {/* NAV */}
          <nav className="flex-1 overflow-y-auto">

            {/* DASHBOARD */}
            <div className="mb-5">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-50 text-blue-600 font-medium text-[15px]"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12L12 4l9 8M5 10v10h14V10"
                  />
                </svg>

                Dashboard
              </Link>
            </div>

            {/* PEDIDOS */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-zinc-400 uppercase mb-2 px-2">
                Pedidos
              </p>

              <div className="flex flex-col gap-1">

                <Link
                  href="/dashboard/pedidos/nuevo"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-100 text-zinc-700 text-[15px] transition"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>

                  Crear pedido
                </Link>

                <Link
                  href="/dashboard/pedidos"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-100 text-zinc-700 text-[15px] transition"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
                    />
                  </svg>

                  Mis pedidos
                </Link>

              </div>
            </div>

            {/* CATÁLOGO */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-zinc-400 uppercase mb-2 px-2">
                Catálogo
              </p>

              <div className="flex flex-col gap-1">

                <Link
                  href="/dashboard/productos"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-100 text-zinc-700 text-[15px] transition"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7L12 3 4 7m16 0v10l-8 4m8-14l-8 4m0 10L4 17V7m8 14V11M4 7l8 4"
                    />
                  </svg>

                  Productos
                </Link>

                {/* SUCURSALES DESHABILITADO */}
                <div
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 text-[15px] opacity-50 cursor-not-allowed select-none"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 21h18M5 21V7l7-4v18M19 21V11l-6-4"
                    />
                  </svg>

                  Sucursales
                </div>

              </div>
            </div>

            {/* CONFIG */}
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase mb-2 px-2">
                Configuración
              </p>

              <div className="flex flex-col gap-1">

                {(role === "administrador" || role === "dueño") && (
                  <div
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 text-[15px] opacity-50 cursor-not-allowed select-none"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5V4H2v16h5m10 0v-2a4 4 0 00-4-4H11a4 4 0 00-4 4v2m10 0H7m8-10a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>

                    Usuarios
                  </div>
                )}

                {/* PERFIL DESHABILITADO */}
                <div
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 text-[15px] opacity-50 cursor-not-allowed select-none"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.121 17.804A9 9 0 1118.88 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>

                  Mi perfil
                </div>

              </div>
            </div>

          </nav>

          {/* BOTÓN CERRAR SESIÓN */}
          <button
            onClick={cerrarSesion}
            className="mt-4 flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl transition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1m0-10V7"
              />
            </svg>

            Cerrar sesión
          </button>

        </aside>

        {/* CONTENIDO */}
        <section className="flex-1 overflow-y-auto p-0">
          {children}
        </section>

      </div>
    </main>
  );
}