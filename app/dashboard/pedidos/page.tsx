"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Pedido = {
  id: number;
  sucursal: string;
  estado: string;
  usuario_email: string;
  created_at: string;
  leido: boolean;
  fecha_lectura: string | null;
  usuario_nombre: string;
  prioridad_alta?: boolean;
  motivo_prioridad?: string | null;
  leido_por?: string | null;
};

type PedidoItem = {
  id: number;
  producto_nombre: string;
  cantidad: number;
  cantidad_enviada: number;
};

type PedidoInfo = {
  pedido: Pedido;
  items: PedidoItem[];
};

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PedidosPage() {
  const [loading, setLoading] = useState(true);

  const [pedidos, setPedidos] = useState<PedidoInfo[]>([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] =
    useState<PedidoInfo | null>(null);

  useEffect(() => {
    async function cargarPedidos() {
      setLoading(true);

      const { data: pedidosData } = await supabase
        .from("pedidos")
        .select("*")
        .order("created_at", { ascending: false });

      if (!pedidosData) {
        setLoading(false);
        return;
      }

      const pedidosConItems = await Promise.all(
        pedidosData.map(async (pedido) => {
          const { data: itemsData } = await supabase
            .from("pedido_items")
            .select("*")
            .eq("pedido_id", pedido.id);

          return {
            pedido,
            items: itemsData || [],
          };
        }),
      );

      setPedidos(pedidosConItems);

      if (pedidosConItems.length > 0) {
        setPedidoSeleccionado(pedidosConItems[0]);
      }

      setLoading(false);
    }

    cargarPedidos();
  }, []);

  function colorEstado(estado: string) {
    switch (estado) {
      case "completado":
        return "bg-green-100 text-green-700";

      case "completado_con_excedentes":
        return "bg-cyan-100 text-cyan-700";

      case "parcial":
        return "bg-orange-100 text-orange-700";

      case "parcial_con_excedentes":
        return "bg-yellow-100 text-yellow-800";

      default:
        return "bg-zinc-100 text-zinc-700";
    }
  }

  function textoEstado(estado: string) {
    switch (estado) {
      case "completado":
        return "Completado";

      case "completado_con_excedentes":
        return "Completado con excedentes";

      case "parcial":
        return "Parcial";

      case "parcial_con_excedentes":
        return "Parcial con excedentes";

      default:
        return "Pendiente";
    }
  }

  const preview = useMemo(() => {
    return pedidoSeleccionado;
  }, [pedidoSeleccionado]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f4f7fb]">
        <div className="text-sm text-zinc-500">Cargando pedidos...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#f4f7fb] overflow-hidden p-4">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">
            Gestión de pedidos
          </h1>

          <p className="text-sm text-zinc-500">
            Historial y trazabilidad de solicitudes internas
          </p>
        </div>

        <Link
          href="/dashboard/pedidos/nuevo"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
        >
          Nuevo pedido
        </Link>
      </div>

      {/* CONTENIDO */}
      <div className="flex gap-4 h-[calc(100vh-100px)]">
        {/* TABLA PEDIDOS */}
        <div className="w-[750px] min-w-[750px] bg-white rounded-2xl border border-zinc-200 overflow-hidden flex flex-col">
          {/* HEADER */}
          {/* HEADER */}
          <div className="grid grid-cols-[70px_110px_105px_1fr_120px_95px] gap-2 px-4 py-3 border-b border-zinc-200 bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-500 font-semibold text-center">
            <div>Pedido</div>
            <div>Sucursal</div>
            <div>Estado</div>
            <div>Solicitante</div>
            <div>Fecha</div>
            <div>Lectura</div>
          </div>

          {/* FILAS */}
          <div className="overflow-y-auto flex-1">
            {pedidos.map((info) => {
              const seleccionado =
                pedidoSeleccionado?.pedido.id === info.pedido.id;

              return (
                <button
                  key={info.pedido.id}
                  onClick={() => setPedidoSeleccionado(info)}
                  className={`w-full border-b border-zinc-100 transition
        ${
          seleccionado
            ? "bg-blue-50 border-l-4 border-l-blue-700"
            : "hover:bg-zinc-50"
        }`}
                >
                  <div className="grid grid-cols-[70px_110px_105px_1fr_120px_95px] gap-2 px-4 py-3 items-center text-center text-[12px] text-zinc-700">
                    {/* PEDIDO */}
                    <div className="font-semibold text-zinc-900 flex items-center justify-center gap-1">
                      #{info.pedido.id}
                      {info.pedido.prioridad_alta && (
                        <div className="relative group flex items-center">
                          {/* ICONO ALERTA */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-4 h-4 text-red-600 drop-shadow-sm"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9.401 3.003c1.155-2.004 4.043-2.004 5.198 0l8.048 13.96c1.154 2.003-.289 4.507-2.598 4.507H3.95c-2.309 0-3.752-2.504-2.598-4.507l8.048-13.96zM12 8.25a.75.75 0 00-.75.75v4.5a.75.75 0 001.5 0V9a.75.75 0 00-.75-.75zm0 8.25a1.125 1.125 0 100-2.25 1.125 1.125 0 000 2.25z"
                              clipRule="evenodd"
                            />
                          </svg>

                          {/* TOOLTIP */}
                          <div
                            className="
          absolute left-1/2 -translate-x-1/2 top-6
          whitespace-nowrap
          bg-red-600 text-white text-[10px]
          px-2 py-1 rounded-md shadow-lg
          opacity-0 group-hover:opacity-100
          pointer-events-none
          transition-all duration-200
          z-50
        "
                          >
                            Prioridad alta
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SUCURSAL */}
                    <div className="flex items-center justify-center text-center break-words leading-tight">
                      {info.pedido.sucursal}
                    </div>

                    {/* ESTADO */}
                    <div className="flex items-center justify-center">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-[10px] leading-tight font-medium text-center whitespace-normal break-words max-w-[95px] ${colorEstado(
                          info.pedido.estado,
                        )}`}
                      >
                        {textoEstado(info.pedido.estado)}
                      </span>
                    </div>

                    {/* SOLICITANTE */}
                    <div className="flex items-center justify-center text-center break-all leading-tight">
                      {info.pedido.usuario_nombre}
                    </div>

                    {/* FECHA */}
                    <div className="flex items-center justify-center text-center text-zinc-500 text-[11px] leading-tight">
                      {formatFecha(info.pedido.created_at)}
                    </div>

                    {/* LECTURA */}
                    <div className="flex items-center justify-center">
                      {info.pedido.leido ? (
                        <div className="flex items-center gap-1 text-green-600 text-[11px]">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          Leído
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-zinc-400 text-[11px]">
                          <div className="w-2 h-2 rounded-full bg-zinc-400"></div>
                          No leído
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* VISTA PREVIA */}
        <div className="w-[490px] min-w-[490px] bg-white rounded-2xl border border-zinc-200 overflow-hidden flex flex-col">
          {preview && (
            <>
              {/* TOP */}
              <div className="px-5 py-4 border-b border-zinc-200">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                      Pedido
                    </p>

                    <h2 className="text-lg font-bold text-zinc-900">
                      #{preview.pedido.id}
                    </h2>
                  </div>

                  <span
                    className={`px-2 py-1 rounded-md text-[10px] leading-tight font-medium text-center max-w-[120px] ${colorEstado(
                      preview.pedido.estado,
                    )}`}
                  >
                    {textoEstado(preview.pedido.estado)}
                  </span>
                </div>

                {preview.pedido.prioridad_alta && (
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-2 bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-xl text-xs font-semibold">
                      <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
                      Prioridad Alta
                    </span>

                    {preview.pedido.motivo_prioridad && (
                      <p className="text-[11px] text-red-600 mt-1 leading-relaxed">
                        {preview.pedido.motivo_prioridad}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-1 text-sm">
                  <p className="text-zinc-700">
                    <span className="font-medium">Sucursal:</span>{" "}
                    {preview.pedido.sucursal}
                  </p>

                  <p className="text-zinc-700 break-all">
                    <span className="font-medium">Solicitante:</span>{" "}
                    {preview.pedido.usuario_nombre}
                  </p>

                  <p className="text-zinc-500 text-xs">
                    {formatFecha(preview.pedido.created_at)}
                  </p>
                </div>
              </div>

              {/* TABLA PRODUCTOS */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-5 pt-4 pb-3">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Productos solicitados
                  </h3>
                </div>

                {/* TABLA */}
                <div className="flex-1 overflow-hidden border-t border-zinc-200">
                  {/* HEADER */}
                  <div className="grid grid-cols-[1.6fr_95px_95px_90px] gap-2 px-4 py-3 bg-zinc-50 border-b border-zinc-200 text-[11px] uppercase font-semibold tracking-wide text-zinc-500">
                    <div>Producto</div>
                    <div>Solicitado</div>
                    <div>Enviado</div>
                    <div>Estado</div>
                  </div>

                  {/* BODY */}
                  <div className="overflow-y-auto h-full">
                    {preview.items.map((item) => {
                      const estado =
                        item.cantidad_enviada === 0
                          ? "Pendiente"
                          : item.cantidad_enviada >= item.cantidad
                            ? "Enviado"
                            : "Parcial";

                      return (
                        <div
                          key={item.id}
                          className="grid grid-cols-[1.6fr_95px_95px_90px] gap-2 px-4 py-3 border-b border-zinc-100 text-[12px] items-start"
                        >
                          {/* PRODUCTO */}
                          <div className="leading-snug text-zinc-800 break-words">
                            {item.producto_nombre}
                          </div>

                          {/* SOLICITADO */}
                          <div className="text-zinc-600">
                            {item.cantidad} unidades
                          </div>

                          {/* ENVIADO */}
                          <div className="text-zinc-600">
                            {item.cantidad_enviada} unidades
                          </div>

                          {/* ESTADO */}
                          <div
                            className={`text-[11px] font-medium leading-tight ${
                              estado === "Pendiente"
                                ? "text-red-600"
                                : estado === "Parcial"
                                  ? "text-orange-600"
                                  : "text-green-600"
                            }`}
                          >
                            {estado}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="p-5 border-t border-zinc-200">
                <Link
                  href={`/dashboard/pedidos/${preview.pedido.id}`}
                  className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 transition text-white font-medium rounded-xl py-3 text-sm"
                >
                  Completar pedido
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
