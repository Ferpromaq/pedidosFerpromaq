"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ProductoTop = {
  nombre: string;
  codigo: string;
  total: number;
};

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [nombre, setNombre] = useState("");

  const [stats, setStats] = useState({
    total: 0,
    completados: 0,
    excedentes: 0,
    parciales: 0,
    pendientes: 0,
    hoy: 0,
  });

  const [productosTop, setProductosTop] = useState<ProductoTop[]>([]);

  useEffect(() => {
    async function cargarDashboard() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace("/");
        return;
      }

      // PERFIL
      const { data: profile } = await supabase
        .from("profiles")
        .select("nombre")
        .eq("id", user.id)
        .single();

      if (profile?.nombre) {
        setNombre(profile.nombre);
      }

      // PEDIDOS
      const { data: pedidos } = await supabase.from("pedidos").select("*");

      // ITEMS
      const { data: items } = await supabase.from("pedido_items").select("*");

      if (pedidos) {
        const hoyFecha = new Date().toISOString().split("T")[0];

        // COMPLETADOS NORMALES
        const completadosNormales = pedidos.filter(
          (p) => p.estado === "completado",
        ).length;

        // COMPLETADOS CON EXCEDENTES
        const excedentes = pedidos.filter(
          (p) => p.estado === "completado_con_excedentes",
        ).length;

        // TOTAL COMPLETADOS
        const completados = completadosNormales + excedentes;

        // PARCIALES
        const parciales = pedidos.filter((p) => p.estado === "parcial").length;

        // PENDIENTES
        const pendientes = pedidos.filter(
          (p) => p.estado === "pendiente",
        ).length;

        // HOY
        const hoy = pedidos.filter((p) =>
          p.created_at?.startsWith(hoyFecha),
        ).length;

        setStats({
          total: pedidos.length,
          completados,
          excedentes,
          parciales,
          pendientes,
          hoy,
        });
      }

      // PRODUCTOS MÁS PEDIDOS
      if (items) {
        const agrupados: Record<string, ProductoTop> = {};

        items.forEach((item) => {
          const key = item.producto_codigo;

          if (!agrupados[key]) {
            agrupados[key] = {
              nombre: item.producto_nombre,
              codigo: item.producto_codigo,
              total: 0,
            };
          }

          agrupados[key].total += item.cantidad || 0;
        });

        const top = Object.values(agrupados)
          .sort((a, b) => b.total - a.total)
          .slice(0, 10);

        setProductosTop(top);
      }

      setLoading(false);
    }

    cargarDashboard();
  }, [router]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          Cargando dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Dashboard</h1>

        <p className="text-zinc-500 mt-2">
          Bienvenido nuevamente, {nombre || "Usuario"}
        </p>
      </div>

      {/* TARJETAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
        {/* TOTAL */}
        <div className="relative overflow-hidden bg-white rounded-3xl p-5 border border-zinc-200 shadow-sm">
          <div className="absolute top-0 right-0 w-28 h-28 bg-blue-100 rounded-full blur-3xl opacity-60" />

          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Total pedidos
                </p>

                <h2 className="text-4xl font-bold text-zinc-900 mt-2">
                  {stats.total}
                </h2>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
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
              </div>
            </div>

            {/* PROGRESO */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-500">Completados</span>

                <span className="text-sm font-semibold text-zinc-700">
                  {stats.total > 0
                    ? Math.round((stats.completados / stats.total) * 100)
                    : 0}
                  %
                </span>
              </div>

              <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      stats.total > 0
                        ? (stats.completados / stats.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>

              <p className="text-xs text-zinc-500 mt-2">
                {stats.completados} completados de {stats.total} pedidos
              </p>
            </div>
          </div>
        </div>

        {/* COMPLETADOS */}
        <div className="relative overflow-hidden bg-white rounded-3xl p-5 border border-zinc-200 shadow-sm">
          <div className="absolute top-0 right-0 w-28 h-28 bg-green-100 rounded-full blur-3xl opacity-60" />

          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">Completados</p>

                <h2 className="text-4xl font-bold text-green-600 mt-2">
                  {stats.completados}
                </h2>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-400">
                  Con excedentes
                </p>

                <p className="text-xl font-semibold text-zinc-800 mt-1">
                  {stats.excedentes}
                </p>
              </div>

              <div className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                Finalizados
              </div>
            </div>
          </div>
        </div>

        {/* PARCIALES */}
        <div className="relative overflow-hidden bg-white rounded-3xl p-5 border border-zinc-200 shadow-sm">
          <div className="absolute top-0 right-0 w-28 h-28 bg-orange-100 rounded-full blur-3xl opacity-60" />

          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">Parciales</p>

                <h2 className="text-4xl font-bold text-orange-500 mt-2">
                  {stats.parciales}
                </h2>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-orange-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3"
                  />
                </svg>
              </div>
            </div>

            <p className="text-sm text-zinc-500 mt-6">
              Pedidos enviados parcialmente
            </p>
          </div>
        </div>

        {/* PENDIENTES */}
        <div className="relative overflow-hidden bg-white rounded-3xl p-5 border border-zinc-200 shadow-sm">
          <div className="absolute top-0 right-0 w-28 h-28 bg-yellow-100 rounded-full blur-3xl opacity-60" />

          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">Pendientes</p>

                <h2 className="text-4xl font-bold text-yellow-500 mt-2">
                  {stats.pendientes}
                </h2>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-yellow-50 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-yellow-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01"
                  />
                </svg>
              </div>
            </div>

            <p className="text-sm text-zinc-500 mt-6">
              Aún pendientes por gestionar
            </p>
          </div>
        </div>

        {/* HOY */}
        <div className="relative overflow-hidden bg-white rounded-3xl p-5 border border-zinc-200 shadow-sm">
          <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-100 rounded-full blur-3xl opacity-60" />

          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">Creados hoy</p>

                <h2 className="text-4xl font-bold text-cyan-600 mt-2">
                  {stats.hoy}
                </h2>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-cyan-50 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-cyan-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3"
                  />
                </svg>
              </div>
            </div>

            <p className="text-sm text-zinc-500 mt-6">Pedidos generados hoy</p>
          </div>
        </div>
      </div>

      {/* PRODUCTOS MÁS PEDIDOS */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-200 mt-8">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-zinc-900">
            Productos más pedidos
          </h3>

          <p className="text-sm text-zinc-500 mt-1">
            Top 10 productos más solicitados
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="text-left py-3 text-sm font-semibold text-zinc-600">
                  Producto
                </th>

                <th className="text-left py-3 text-sm font-semibold text-zinc-600">
                  Código
                </th>

                <th className="text-right py-3 text-sm font-semibold text-zinc-600">
                  Cantidad
                </th>
              </tr>
            </thead>

            <tbody>
              {productosTop.map((producto, index) => (
                <tr
                  key={index}
                  className="border-b border-zinc-100 hover:bg-zinc-50 transition"
                >
                  <td className="py-4 text-zinc-900 font-medium">
                    {producto.nombre}
                  </td>

                  <td className="py-4 text-zinc-500">{producto.codigo}</td>

                  <td className="py-4 text-right font-semibold text-blue-600">
                    {producto.total}
                  </td>
                </tr>
              ))}

              {productosTop.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-10 text-center text-zinc-500">
                    No hay datos disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
