"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { createClient } from "@/lib/supabase";

const supabase = createClient();

type DocWithAutoTable = {
  lastAutoTable?: {
    finalY: number;
  };
};

type Pedido = {
  id: number;
  sucursal: string;
  estado: string;
  usuario_email: string;
  usuario_nombre: string;
  created_at: string;
  fecha_despacho: string;
  despachado_por: string;
  leido: boolean;
  fecha_lectura: string | null;
  editable: boolean;
  prioridad_alta: boolean;
  motivo_prioridad: string | null;
  leido_por?: string | null;
  comentario?: string | null;
  comentario_usuario?: string | null;
  comentario_fecha?: string | null;
  envio_por?: string | null;
  fecha_estimada?: string | null;
  metodo_envio?: string | null;
};

type PedidoItem = {
  id: number;
  producto_nombre: string;
  producto_codigo: string;
  cantidad: number;
  cantidad_enviada: number;
};

type HistorialEvento = {
  id: number;
  pedido_id: number;
  tipo: string;
  descripcion: string;
  usuario: string;
  fecha: string;
};

function formatFecha(fecha: string) {
  const date = new Date(fecha);
  const dia = date.getDate();
  const meses = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  const mes = meses[date.getMonth()];
  const año = date.getFullYear();
  const horas = date.getHours().toString().padStart(2, "0");
  const minutos = date.getMinutes().toString().padStart(2, "0");
  return `${dia} ${mes} ${año} - ${horas}:${minutos} hrs`;
}

function formatFechaCorta(fecha: string) {
  const date = new Date(fecha);
  const dia = date.getDate();
  const meses = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  const mes = meses[date.getMonth()];
  const año = date.getFullYear();
  return `${dia} ${mes} ${año}`;
}

function calcularEstadoPedido(items: PedidoItem[]): string {
  const totalCantidad = items.reduce((a, i) => a + i.cantidad, 0);
  const totalEnviado = items.reduce((a, i) => a + i.cantidad_enviada, 0);

  if (totalEnviado === 0) {
    return "pendiente";
  }

  // Verificar si hay excedentes (algún item tiene más enviado que solicitado)
  const hayExcedentes = items.some(
    (item) => item.cantidad_enviada > item.cantidad,
  );

  // Verificar si todos los items tienen al menos lo solicitado
  const todosCompletos = items.every(
    (item) => item.cantidad_enviada >= item.cantidad,
  );

  if (todosCompletos && hayExcedentes) {
    return "completado_con_excedentes";
  } else if (todosCompletos) {
    return "completado";
  } else if (hayExcedentes) {
    return "parcial_con_excedentes";
  } else {
    return "parcial";
  }
}

function getEstadoBadgeHeader(estado: string) {
  switch (estado) {
    case "completado":
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          Completado
        </span>
      );
    case "completado_con_excedentes":
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          Completado con excedentes
        </span>
      );
    case "parcial":
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
          Parcialmente enviado
        </span>
      );
    case "parcial_con_excedentes":
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
          Parcial con excedentes
        </span>
      );
    case "pendiente":
    default:
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
          Pendiente
        </span>
      );
  }
}

function getEstadoItem(item: PedidoItem) {
  if (item.cantidad_enviada > item.cantidad) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        Excedente +{item.cantidad_enviada - item.cantidad}
      </span>
    );
  } else if (item.cantidad_enviada === item.cantidad) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        Completado
      </span>
    );
  } else if (item.cantidad_enviada > 0) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
        Faltan {item.cantidad - item.cantidad_enviada}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
      Pendiente
    </span>
  );
}

function getHistorialIcono(tipo: string) {
  switch (tipo) {
    case "creado":
      return (
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-3.5 h-3.5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
      );
    case "leido":
      return (
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-3.5 h-3.5 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </div>
      );
    case "enviado":
      return (
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-3.5 h-3.5 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
            />
          </svg>
        </div>
      );
    case "comentario":
      return (
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-3.5 h-3.5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
      );
    default:
      return (
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-3.5 h-3.5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      );
  }
}

export default function PedidoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [items, setItems] = useState<PedidoItem[]>([]);
  const [historial, setHistorial] = useState<HistorialEvento[]>([]);

  const [showAuth, setShowAuth] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");

  const router = useRouter();

  useEffect(() => {
    async function cargarPedido() {
      setLoading(true);

      // 🔥 Usuario autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 🔥 Obtener pedido
      const { data: pedidoData, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !pedidoData) {
        setLoading(false);
        return;
      }

      const userId = user?.id;

      // 🔥 Verificar si quien abrió el pedido es el creador
      const esCreador = userId === pedidoData.usuario_id;

      // 🔥 Obtener nombre REAL del usuario logueado
      let nombreSesion = "Usuario";

      if (userId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("nombre")
          .eq("id", userId)
          .single();

        nombreSesion = profile?.nombre || user?.email || "Usuario";
      }

      console.log("LECTOR:", nombreSesion);

      // 🔥 Marcar lectura SOLO si:
      // - hay usuario
      // - NO es el creador
      // - aún no está leído
      if (userId && !esCreador && !pedidoData.leido) {
        const ahora = new Date().toISOString();

        const { error: updateError } = await supabase
          .from("pedidos")
          .update({
            leido: true,
            fecha_lectura: ahora,
            leido_por: nombreSesion,
          })
          .eq("id", id);

        if (!updateError) {
          pedidoData.leido = true;
          pedidoData.fecha_lectura = ahora;
          pedidoData.leido_por = nombreSesion;
        }
      }

      // 🔥 Obtener items
      const { data: itemsData } = await supabase
        .from("pedido_items")
        .select("*")
        .eq("pedido_id", id);

      // 🔥 Obtener historial
      const { data: historialData } = await supabase
        .from("pedido_historial")
        .select("*")
        .eq("pedido_id", id)
        .order("fecha", { ascending: true });

      setPedido(pedidoData);
      setItems(itemsData || []);
      setHistorial(historialData || []);

      setLoading(false);
    }

    cargarPedido();
  }, [id]);

  function cambiarCantidadLocal(itemId: number, cantidad: number) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, cantidad_enviada: cantidad } : item,
      ),
    );
  }

  async function autorizarEdicion() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("No autenticado");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "administrador") {
      setPedido((prev) => (prev ? { ...prev, editable: true } : null));
      setShowAuth(false);
      alert("Autorización concedida");
    } else {
      alert("No autorizado");
    }
  }

  async function guardarDespacho() {
    if (!pedido?.editable) {
      alert("Pedido bloqueado. Requiere autorización.");
      return;
    }

    setGuardando(true);

    for (const item of items) {
      await supabase
        .from("pedido_items")
        .update({ cantidad_enviada: item.cantidad_enviada })
        .eq("id", item.id);
    }

    // Calcular estado basado en los 5 posibles estados
    const nuevoEstado = calcularEstadoPedido(items);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let nombreSesion = "Usuario";

    if (user?.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("nombre")
        .eq("id", user.id)
        .single();

      nombreSesion = profile?.nombre || user.email || "Usuario";
    }

    const ahora = new Date().toISOString();

    await supabase
      .from("pedidos")
      .update({
        estado: nuevoEstado,
        editable: false,
        fecha_despacho: ahora,
        despachado_por: nombreSesion,
      })
      .eq("id", id);
    setPedido((prev) =>
      prev ? { ...prev, estado: nuevoEstado, editable: false } : null,
    );

    setGuardando(false);
    alert("Despacho guardado correctamente");
  }

  if (loading || !pedido) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  console.log(pedido.estado);

  function descargarPDF() {
    if (!pedido) return;

    const doc = new jsPDF();

    // ===== TÍTULO =====
    doc.setFontSize(20);
    doc.text(`Pedido #${pedido.id}`, 14, 20);

    // ===== INFO =====
    doc.setFontSize(11);

    doc.text(`Sucursal: ${pedido.sucursal}`, 14, 32);
    doc.text(`Solicitante: ${pedido.usuario_nombre}`, 14, 39);
    doc.text(`Estado: ${pedido.estado}`, 14, 46);
    doc.text(`Fecha creación: ${formatFecha(pedido.created_at)}`, 14, 53);

    if (pedido.leido && pedido.fecha_lectura) {
      doc.text(`Leído por: ${pedido.leido_por || "Bodega"}`, 14, 60);

      doc.text(`Fecha lectura: ${formatFecha(pedido.fecha_lectura)}`, 14, 67);
    }

    // ===== TABLA =====
    autoTable(doc, {
      startY: 80,
      head: [["Producto", "Código", "Solicitado", "Enviado", "Estado"]],
      body: items.map((item) => {
        let estado = "Pendiente";

        if (item.cantidad_enviada > item.cantidad) {
          estado = "Excedente";
        } else if (item.cantidad_enviada === item.cantidad) {
          estado = "Completado";
        } else if (item.cantidad_enviada > 0) {
          estado = "Parcial";
        }

        return [
          item.producto_nombre,
          item.producto_codigo,
          item.cantidad,
          item.cantidad_enviada,
          estado,
        ];
      }),
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [37, 99, 235],
      },
    });

    // ===== COMENTARIO =====
    if (pedido.comentario) {
      const finalY = (doc as DocWithAutoTable).lastAutoTable?.finalY
        ? (doc as DocWithAutoTable).lastAutoTable!.finalY + 15
        : 20;
      doc.setFontSize(13);
      doc.text("Comentario:", 14, finalY);

      doc.setFontSize(11);

      doc.text(pedido.comentario, 14, finalY + 8, {
        maxWidth: 180,
      });
    }

    // ===== DESCARGAR =====
    doc.save(`pedido-${pedido.id}.pdf`);
  }

  return (
    <div className="h-screen bg-gray-50">
      {/* ===== TOP HEADER BAR ===== */}
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Title + Badge */}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-gray-900">
                Pedido #{pedido.id}
              </h1>
              {getEstadoBadgeHeader(pedido.estado)}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                Sucursal solicitante: {pedido.sucursal}
              </span>
              <span className="flex items-center gap-1.5">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Creado el: {formatFecha(pedido.created_at)}
              </span>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={descargarPDF}
              className="inline-flex cursor-pointer items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Descargar PDF
            </button>
            <button
              onClick={() => router.push("/dashboard/pedidos/nuevo")}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <svg
                className="w-4 h-4"
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
              Nueva solicitud
            </button>
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT: TWO COLUMNS ===== */}
      <div className="p-2">
        <div className="flex gap-2">
          {/* ===== LEFT COLUMN (2/3) ===== */}
          <div className="flex-1 space-y-2">
            {/* Productos solicitados */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col max-h-[calc(100dvh-100px)]">
              <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
                <h2 className="text-base font-semibold text-gray-900">
                  Productos solicitados
                </h2>
              </div>

              {/* TABLA CON SCROLL */}
              <div className="overflow-y-auto">
                <table className="w-full">
                  {/* HEADER FIJO */}
                  <thead className="sticky top-0 z-10 bg-gray-50">
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Producto
                      </th>

                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Solicitado
                      </th>

                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Enviado
                      </th>

                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {items.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <svg
                                className="w-5 h-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                />
                              </svg>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {item.producto_nombre}
                              </p>

                              <p className="text-xs text-gray-500">
                                {item.producto_codigo}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="text-center px-4 py-4">
                          <span className="text-sm font-medium text-gray-900">
                            {item.cantidad}
                          </span>
                        </td>

                        <td className="text-center px-4 py-4">
                          {pedido.editable ? (
                            <input
                              type="number"
                              value={item.cantidad_enviada}
                              onChange={(e) =>
                                cambiarCantidadLocal(
                                  item.id,
                                  Number(e.target.value),
                                )
                              }
                              className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-sm text-center text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-900">
                              {item.cantidad_enviada}
                            </span>
                          )}
                        </td>

                        <td className="text-center px-4 py-4">
                          {getEstadoItem(item)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* BOTÓN */}
              {pedido.editable && (
                <div className="px-6 py-4 border-t border-gray-100 bg-white-50 flex-shrink-0">
                  <button
                    onClick={guardarDespacho}
                    disabled={guardando}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <svg
                      className="w-4 h-4"
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

                    {guardando ? "Guardando..." : "Guardar despacho"}
                  </button>
                </div>
              )}
            </div>
            {/* Comentario del jefe / bodega */}
            {pedido.comentario && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">
                  Comentario del jefe / bodega
                </h2>
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    {(pedido.comentario_usuario || pedido.usuario_email)
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {pedido.comentario_usuario || pedido.usuario_email}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {pedido.comentario}
                    </p>
                    {pedido.comentario_fecha && (
                      <p className="text-xs text-gray-400 mt-2">
                        {formatFecha(pedido.comentario_fecha)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Información de envío */}
            {(pedido.envio_por ||
              pedido.fecha_estimada ||
              pedido.metodo_envio) && (
              <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Información de envío
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {pedido.envio_por && (
                    <div>
                      <p className="text-xs text-blue-600 font-medium">
                        Enviado por
                      </p>
                      <p className="text-sm text-blue-900 font-medium">
                        {pedido.envio_por}
                      </p>
                    </div>
                  )}
                  {pedido.fecha_estimada && (
                    <div>
                      <p className="text-xs text-blue-600 font-medium">
                        Fecha estimada
                      </p>
                      <p className="text-sm text-blue-900 font-medium">
                        {formatFechaCorta(pedido.fecha_estimada)}
                      </p>
                    </div>
                  )}
                  {pedido.metodo_envio && (
                    <div>
                      <p className="text-xs text-blue-600 font-medium">
                        Método de envío
                      </p>
                      <p className="text-sm text-blue-900 font-medium">
                        {pedido.metodo_envio}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Autorización (si no es editable) */}
            {!pedido.editable && (
              <div className="bg-white rounded-xl border border-red-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <svg
                    className="w-5 h-5 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <p className="text-sm font-semibold text-red-800">
                    Pedido bloqueado para edición
                  </p>
                </div>

                {!showAuth ? (
                  <button
                    onClick={() => setShowAuth(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    Autorizar edición
                  </button>
                ) : (
                  <div className="space-y-3 mt-3">
                    <input
                      type="text"
                      placeholder="Usuario admin"
                      value={adminUser}
                      onChange={(e) => setAdminUser(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="password"
                      placeholder="Clave admin"
                      value={adminPass}
                      onChange={(e) => setAdminPass(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={autorizarEdicion}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setShowAuth(false)}
                        className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ===== RIGHT COLUMN (1/3) ===== */}
          <div className="w-[380px] flex-shrink-0 space-y-2">
            {/* Detalles del pedido */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-5">
                Detalles del pedido
              </h2>

              <div className="space-y-4">
                {/* Solicitante */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {pedido.usuario_email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Solicitante</p>
                    <p className="text-sm font-medium text-gray-900">
                      {pedido.usuario_nombre}
                    </p>
                  </div>
                </div>

                {/* Sucursal solicitante */}
                <div>
                  <p className="text-xs text-gray-500">Sucursal solicitante</p>
                  <p className="text-sm font-medium text-gray-900">
                    {pedido.sucursal}
                  </p>
                </div>
              </div>

              {/* Confirmación de lectura */}
              {pedido.leido && (
                <div className="mt-5 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900">
                      Confirmación de lectura
                    </p>
                    <p className="text-xs text-blue-700">
                      Pedido leído por {pedido.leido_por}.
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-blue-600 flex-shrink-0"
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
              )}
            </div>

            {/* Historial del pedido */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 overflow-hidden">
              <h2 className="text-base font-semibold text-gray-900 mb-5">
                Historial del pedido
              </h2>

              <div className="space-y-0">
                {historial.length > 0 ? (
                  historial.map((evento, index) => (
                    <div key={evento.id} className="flex gap-3 relative">
                      {index < historial.length - 1 && (
                        <div className="absolute left-[15px] top-8 bottom-0 w-px bg-gray-200"></div>
                      )}
                      {getHistorialIcono(evento.tipo)}
                      <div className="pb-5">
                        <p className="text-sm font-semibold text-gray-900">
                          {evento.descripcion}
                        </p>
                        <p className="text-xs text-gray-500">
                          {evento.usuario} · {formatFecha(evento.fecha)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    {/* Pedido creado */}
                    <div className="flex gap-3 relative">
                      <div className="absolute left-[15px] top-8 bottom-0 w-px bg-gray-200"></div>
                      {getHistorialIcono("creado")}
                      <div className="pb-5">
                        <p className="text-sm font-semibold text-gray-900">
                          Pedido creado
                        </p>
                        <p className="text-xs text-gray-500">
                          {pedido.usuario_nombre} ·{" "}
                          {formatFecha(pedido.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Pedido leído */}
                    {pedido.leido && pedido.fecha_lectura && (
                      <div className="flex gap-3 relative">
                        {pedido.estado !== "pendiente" && (
                          <div className="absolute left-[15px] top-8 bottom-0 w-px bg-gray-200"></div>
                        )}
                        {getHistorialIcono("leido")}
                        <div className="pb-5">
                          <p className="text-sm font-semibold text-gray-900">
                            Pedido leído
                          </p>
                          <p className="text-xs text-gray-500">
                            {pedido.leido_por || "Bodega"} ·{" "}
                            {formatFecha(pedido.fecha_lectura)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Productos enviados */}
                    {pedido.estado !== "pendiente" && (
                      <div className="flex gap-3 relative">
                        {pedido.comentario && (
                          <div className="absolute left-[15px] top-8 bottom-0 w-px bg-gray-200"></div>
                        )}
                        {getHistorialIcono("enviado")}
                        <div className="pb-5">
                          <p className="text-sm font-semibold text-gray-900">
                            Productos enviados{" "}
                            {pedido.estado === "parcial" && "(parcial)"}
                            {pedido.estado === "parcial_con_excedentes" &&
                              "(parcial con excedentes)"}
                            {pedido.estado === "completado" && "(completo)"}
                            {pedido.estado === "completado_con_excedentes" &&
                              "(completo con excedentes)"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {pedido.despachado_por || "Bodega"} ·{" "}
                            {pedido.fecha_despacho
                              ? formatFecha(pedido.fecha_despacho)
                              : ""}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Comentario agregado */}
                    {pedido.comentario && (
                      <div className="flex gap-3 relative">
                        {getHistorialIcono("comentario")}
                        <div className="pb-5">
                          <p className="text-sm font-semibold text-gray-900">
                            Comentario agregado
                          </p>
                          <p className="text-xs text-gray-500">
                            {pedido.comentario_usuario ||
                              pedido.leido_por ||
                              "Bodega"}{" "}
                            ·{" "}
                            {pedido.comentario_fecha
                              ? formatFecha(pedido.comentario_fecha)
                              : ""}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
