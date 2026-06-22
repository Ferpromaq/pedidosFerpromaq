"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const supabase = createClient();

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  const linkBase =
    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] transition";

  const isActive = (path: string) =>
    pathname === path
      ? "bg-blue-50 text-blue-600 font-medium"
      : "hover:bg-zinc-100 text-zinc-700";

  return (
    <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col h-screen px-4 py-4 shadow-sm">

      {/* LOGO */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow">
          F
        </div>

        <div>
          <h1 className="font-bold text-xl text-zinc-900 leading-none">
            FERPROMAQ
          </h1>
          <p className="text-xs text-zinc-500">
            Sistema de Pedidos
          </p>
        </div>
      </div>

      {/* NAV */}
      <nav className="flex-1 overflow-y-auto space-y-1">

        <Link
          href="/dashboard"
          className={`${linkBase} ${isActive("/dashboard")}`}
        >
          📊 Dashboard
        </Link>

        <p className="text-xs font-semibold text-zinc-400 uppercase mt-4 px-2">
          Pedidos
        </p>

        <Link
          href="/dashboard/pedidos/nuevo"
          className={`${linkBase} ${isActive("/dashboard/pedidos/nuevo")}`}
        >
          ➕ Crear pedido
        </Link>

        <Link
          href="/dashboard/pedidos"
          className={`${linkBase} ${isActive("/dashboard/pedidos")}`}
        >
          📄 Mis pedidos
        </Link>

        <p className="text-xs font-semibold text-zinc-400 uppercase mt-4 px-2">
          Catálogo
        </p>

        <Link
          href="/dashboard/productos"
          className={`${linkBase} ${isActive("/dashboard/productos")}`}
        >
          📦 Productos
        </Link>

        <div className="px-3 py-2.5 text-zinc-400 text-[15px] opacity-50 cursor-not-allowed">
          🏬 Sucursales
        </div>

        <p className="text-xs font-semibold text-zinc-400 uppercase mt-4 px-2">
          Configuración
        </p>

        {(role === "administrador" || role === "dueño") && (
          <Link
            href="/dashboard/usuarios"
            className={`${linkBase} ${isActive("/dashboard/usuarios")}`}
          >
            👤 Usuarios
          </Link>
        )}

        <div className="px-3 py-2.5 text-zinc-400 text-[15px] opacity-50 cursor-not-allowed">
          ⚙️ Mi perfil
        </div>

      </nav>

      {/* LOGOUT */}
      <button
        onClick={cerrarSesion}
        className="mt-4 flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl transition shadow"
      >
        🚪 Cerrar sesión
      </button>

    </aside>
  );
}