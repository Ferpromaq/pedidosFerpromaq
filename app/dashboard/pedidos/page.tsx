"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase";

const supabase = createClient();
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Filter,
  X,
  AlertTriangle,
} from "lucide-react";

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

type SortField =
  | "id"
  | "sucursal"
  | "estado"
  | "usuario_nombre"
  | "created_at"
  | "leido";

async function obtenerPedidos(): Promise<PedidoInfo[]> {
  const { data, error } = await supabase
    .from("pedidos")
    .select(
      `
      *,
      pedido_items (*)
    `,
    )
    .order("created_at", { ascending: false });

  if (error || !data) {
    throw new Error("Error cargando pedidos");
  }

  return data.map((pedido) => ({
    pedido,
    items: pedido.pedido_items || [],
  }));
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PedidosPage() {
  const [pedidoSeleccionado, setPedidoSeleccionado] =
    useState<PedidoInfo | null>(null);

  const { data: pedidos = [], isLoading: loading } = useQuery({
    queryKey: ["pedidos"],
    queryFn: obtenerPedidos,

    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,

    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    if (!pedidoSeleccionado && pedidos.length > 0) {
      setPedidoSeleccionado(pedidos[0]);
    }
  }, [pedidos, pedidoSeleccionado]);

  // =========================
  // FILTROS ACTIVOS
  // =========================
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [filtroSucursal, setFiltroSucursal] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroPrioridad, setFiltroPrioridad] = useState("todos");

  // =========================
  // FILTROS TEMPORALES
  // =========================
  const [tempBusqueda, setTempBusqueda] = useState("");
  const [tempFiltroSucursal, setTempFiltroSucursal] = useState("todos");
  const [tempFiltroEstado, setTempFiltroEstado] = useState("todos");
  const [tempFiltroPrioridad, setTempFiltroPrioridad] = useState("todos");

  const [sortField, setSortField] = useState<SortField>("created_at");

  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // =========================
  // ORDENAMIENTO
  // =========================
  function ordenarPor(campo: SortField) {
    if (sortField === campo) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(campo);
      setSortDirection("asc");
    }
  }

  function iconoOrden(campo: SortField) {
    if (sortField !== campo) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />;
    }

    return sortDirection === "asc" ? (
      <ChevronUp className="w-3.5 h-3.5" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5" />
    );
  }

  // =========================
  // APLICAR FILTROS
  // =========================
  function aplicarFiltros() {
    setBusqueda(tempBusqueda);
    setFiltroSucursal(tempFiltroSucursal);
    setFiltroEstado(tempFiltroEstado);
    setFiltroPrioridad(tempFiltroPrioridad);

    setMostrarFiltros(false);
  }

  function limpiarFiltros() {
    setTempBusqueda("");
    setTempFiltroSucursal("todos");
    setTempFiltroEstado("todos");
    setTempFiltroPrioridad("todos");

    setBusqueda("");
    setFiltroSucursal("todos");
    setFiltroEstado("todos");
    setFiltroPrioridad("todos");
  }

  // =========================
  // FILTRADO
  // =========================
  const pedidosFiltrados = useMemo(() => {
    let resultado = [...pedidos];

    // BUSQUEDA
    resultado = resultado.filter((info) => {
      const texto = `
      ${info.pedido.id}
      ${info.pedido.usuario_nombre}
      ${info.pedido.sucursal}
      `
        .toLowerCase()
        .trim();

      return texto.includes(busqueda.toLowerCase());
    });

    // SUCURSAL
    if (filtroSucursal !== "todos") {
      resultado = resultado.filter(
        (info) => info.pedido.sucursal === filtroSucursal,
      );
    }

    // ESTADO
    if (filtroEstado !== "todos") {
      resultado = resultado.filter(
        (info) => info.pedido.estado === filtroEstado,
      );
    }

    // PRIORIDAD
    if (filtroPrioridad === "alta") {
      resultado = resultado.filter((info) => info.pedido.prioridad_alta);
    }

    if (filtroPrioridad === "normal") {
      resultado = resultado.filter((info) => !info.pedido.prioridad_alta);
    }

    // SORT
    resultado.sort((a, b) => {
      let valorA: string | number | boolean =
        a.pedido[sortField as keyof Pedido] ?? "";

      let valorB: string | number | boolean =
        b.pedido[sortField as keyof Pedido] ?? "";

      if (typeof valorA === "string") {
        valorA = valorA.toLowerCase();
      }

      if (typeof valorB === "string") {
        valorB = valorB.toLowerCase();
      }

      if (valorA < valorB) {
        return sortDirection === "asc" ? -1 : 1;
      }

      if (valorA > valorB) {
        return sortDirection === "asc" ? 1 : -1;
      }

      return 0;
    });

    return resultado;
  }, [
    pedidos,
    busqueda,
    filtroSucursal,
    filtroEstado,
    filtroPrioridad,
    sortField,
    sortDirection,
  ]);

  useEffect(() => {
    if (
      pedidoSeleccionado &&
      pedidosFiltrados.find((p) => p.pedido.id === pedidoSeleccionado.pedido.id)
    ) {
      return;
    }

    if (pedidosFiltrados.length > 0) {
      setPedidoSeleccionado(pedidosFiltrados[0]);
    }
  }, [pedidosFiltrados]);

  function colorEstado(estado: string) {
    switch (estado) {
      case "completado":
        return "bg-emerald-100 text-emerald-700 border border-emerald-200";

      case "completado_con_excedentes":
        return "bg-cyan-100 text-cyan-700 border border-cyan-200";

      case "parcial":
        return "bg-orange-100 text-orange-700 border border-orange-200";

      case "parcial_con_excedentes":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";

      default:
        return "bg-zinc-100 text-zinc-700 border border-zinc-200";
    }
  }

  function textoEstado(estado: string) {
    switch (estado) {
      case "completado":
        return "Completado";

      case "completado_con_excedentes":
        return "Comp. excedentes";

      case "parcial":
        return "Parcial";

      case "parcial_con_excedentes":
        return "Parcial exced.";

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
    <div className="h-screen bg-[#f4f7fb] overflow-hidden p-5">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Gestión de pedidos
          </h1>

          <p className="text-sm text-zinc-500 mt-1">
            Historial y trazabilidad de solicitudes internas
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* FILTROS */}
          <div className="relative">
            <button
              onClick={() => {
                setTempBusqueda(busqueda);
                setTempFiltroSucursal(filtroSucursal);
                setTempFiltroEstado(filtroEstado);
                setTempFiltroPrioridad(filtroPrioridad);

                setMostrarFiltros(!mostrarFiltros);
              }}
              className="flex items-center gap-2 bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 px-4 py-2.5 rounded-2xl text-sm font-medium text-zinc-700 shadow-sm transition"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>

            {/* PANEL FILTROS */}
            <div
              className={`absolute right-0 top-14 z-50 w-[340px] bg-white border border-zinc-200 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 origin-top-right
              ${
                mostrarFiltros
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
              }`}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
                <h3 className="font-semibold text-zinc-900">Filtros</h3>

                <button
                  onClick={() => setMostrarFiltros(false)}
                  className="text-zinc-400 hover:text-zinc-700 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* BUSQUEDA */}
                <div>
                  <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">
                    Buscar
                  </label>

                  <input
                    value={tempBusqueda}
                    onChange={(e) => setTempBusqueda(e.target.value)}
                    placeholder="Pedido, solicitante o sucursal"
                    className="w-full border border-zinc-200 rounded-2xl text-black px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* SUCURSAL */}
                <div>
                  <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">
                    Sucursal
                  </label>

                  <select
                    value={tempFiltroSucursal}
                    onChange={(e) => setTempFiltroSucursal(e.target.value)}
                    className="w-full border border-zinc-200 text-black rounded-2xl px-3 py-2.5 text-sm"
                  >
                    <option value="todos">Todas</option>

                    <option value="Picarte">Picarte</option>

                    <option value="Collico">Collico</option>

                    <option value="Las Ánimas">Las Ánimas</option>
                  </select>
                </div>

                {/* ESTADO */}
                <div>
                  <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">
                    Estado
                  </label>

                  <select
                    value={tempFiltroEstado}
                    onChange={(e) => setTempFiltroEstado(e.target.value)}
                    className="w-full border border-zinc-200 text-black rounded-2xl px-3 py-2.5 text-sm"
                  >
                    <option value="todos">Todos</option>

                    <option value="pendiente">Pendiente</option>

                    <option value="parcial">Parcial</option>

                    <option value="completado">Completado</option>
                  </select>
                </div>

                {/* PRIORIDAD */}
                <div>
                  <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">
                    Prioridad
                  </label>

                  <select
                    value={tempFiltroPrioridad}
                    onChange={(e) => setTempFiltroPrioridad(e.target.value)}
                    className="w-full border border-zinc-200 text-black rounded-2xl px-3 py-2.5 text-sm"
                  >
                    <option value="todos">Todas</option>

                    <option value="alta">Alta</option>

                    <option value="normal">Normal</option>
                  </select>
                </div>

                {/* BOTONES */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      limpiarFiltros();
                      setMostrarFiltros(false);
                    }}
                    className="flex-1 border text-black border-zinc-200 hover:bg-zinc-100 rounded-2xl py-2.5 text-sm font-medium transition"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={aplicarFiltros}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-2.5 text-sm font-medium transition"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* NUEVO PEDIDO */}
          <Link
            href="/dashboard/pedidos/nuevo"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl text-sm font-medium shadow-lg shadow-blue-500/20 transition"
          >
            Nuevo pedido
          </Link>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="flex gap-5 h-[calc(100vh-120px)]">
        {/* TABLA */}
        <div className="flex-1 bg-white rounded-3xl border border-zinc-200 overflow-hidden flex flex-col shadow-sm">
          {/* HEADER */}
          <div className="grid grid-cols-[80px_110px_130px_1fr_130px_100px] gap-2 px-5 py-4 border-b border-zinc-200 bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-500 font-semibold">
            <button
              onClick={() => ordenarPor("id")}
              className="flex items-center justify-center gap-1 hover:text-zinc-900 transition"
            >
              Pedido
              {iconoOrden("id")}
            </button>

            <button
              onClick={() => ordenarPor("sucursal")}
              className="flex items-center justify-center gap-1 hover:text-zinc-900 transition"
            >
              Sucursal
              {iconoOrden("sucursal")}
            </button>

            <button
              onClick={() => ordenarPor("estado")}
              className="flex items-center justify-center gap-1 hover:text-zinc-900 transition"
            >
              Estado
              {iconoOrden("estado")}
            </button>

            <button
              onClick={() => ordenarPor("usuario_nombre")}
              className="flex items-center justify-center gap-1 hover:text-zinc-900 transition"
            >
              Solicitante
              {iconoOrden("usuario_nombre")}
            </button>

            <button
              onClick={() => ordenarPor("created_at")}
              className="flex items-center justify-center gap-1 hover:text-zinc-900 transition"
            >
              Fecha
              {iconoOrden("created_at")}
            </button>

            <button
              onClick={() => ordenarPor("leido")}
              className="flex items-center justify-center gap-1 hover:text-zinc-900 transition"
            >
              Lectura
              {iconoOrden("leido")}
            </button>
          </div>

          {/* BODY */}
          <div className="overflow-y-auto flex-1">
            {pedidosFiltrados.map((info) => {
              const seleccionado =
                pedidoSeleccionado?.pedido.id === info.pedido.id;

              return (
                <button
                  key={info.pedido.id}
                  onClick={() => setPedidoSeleccionado(info)}
                  className={`w-full border-b border-zinc-100 transition-all duration-200 relative
                  ${seleccionado ? "bg-blue-50" : "hover:bg-zinc-50"}`}
                >
                  {/* PRIORIDAD FLOAT */}
                  {info.pedido.prioridad_alta && (
                    <div className="absolute left-[73px] top-1/2 -translate-y-1/2 z-10 group">
                      <AlertTriangle className="w-4 h-4 text-red-400 fill-white-400" />

                      {/* TOOLTIP */}
                      <div className="absolute left-1/2 -translate-x-1/2 -top-6 whitespace-nowrap bg-red-600 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200">
                        Prioridad alta
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-[80px_110px_130px_1fr_130px_100px] gap-3 px-5 py-4 items-center text-sm">
                    {/* PEDIDO */}
                    <div className="font-semibold text-zinc-900 text-center">
                      #{info.pedido.id}
                    </div>

                    {/* SUCURSAL */}
                    <div className="text-zinc-700 text-center truncate">
                      {info.pedido.sucursal}
                    </div>

                    {/* ESTADO */}
                    <div className="flex justify-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${colorEstado(
                          info.pedido.estado,
                        )}`}
                      >
                        {textoEstado(info.pedido.estado)}
                      </span>
                    </div>

                    {/* SOLICITANTE */}
                    <div className="min-w-0 flex justify-center">
                      <p className="text-zinc-800 font-medium truncate whitespace-nowrap overflow-hidden max-w-full">
                        {info.pedido.usuario_nombre}
                      </p>
                    </div>

                    {/* FECHA */}
                    <div className="text-zinc-500 text-center text-xs">
                      {formatFecha(info.pedido.created_at)}
                    </div>

                    {/* LECTURA */}
                    <div className="flex justify-center">
                      {info.pedido.leido ? (
                        <span className="text-emerald-600 text-xs font-medium">
                          ● Leído
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-xs font-medium">
                          ● No Leído
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* PREVIEW */}
        <div className="w-[470px] min-w-[470px] bg-white rounded-3xl border border-zinc-200 overflow-hidden flex flex-col shadow-sm">
          {preview && (
            <>
              {/* TOP */}
              <div className="flex flex-col gap-2 mx-4 mt-2 mb-0 border-b border-zinc-200 pb-2">
                <div className="flex items-center justify-between mt-2 ">
                  <div className="flex items-center gap-2 ">
                    <p className="text-sm uppercase text-zinc-500">Pedido</p>

                    <h2 className="text-sm bg-black-500 font-bold text-zinc-900">
                      #{preview.pedido.id}
                    </h2>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${colorEstado(
                      preview.pedido.estado,
                    )}`}
                  >
                    {textoEstado(preview.pedido.estado)}
                  </span>
                </div>

                {/* INFO COMPACTA */}
                <div className="flex justify-around">
                  <div>
                    <p className="text-zinc-500 text-xs mb-1">Sucursal</p>

                    <p className="text-sm text-black">
                      {preview.pedido.sucursal}
                    </p>
                  </div>

                  <div>
                    <p className="text-zinc-500 text-xs mb-1">Solicitante</p>

                    <p className="text-sm text-black">
                      {preview.pedido.usuario_nombre}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-zinc-500 text-xs mb-1">Fecha</p>

                    <p className="text-sm text-black">
                      {formatFecha(preview.pedido.created_at)}
                    </p>
                  </div>
                </div>
                {preview.pedido.prioridad_alta && (
                  <div className="flex bg-red-50 border border-red-200 rounded-xl p-2 gap-2">
                    <div className="flex items-center text-center gap-2 text-red-700 font-semibold text-sm">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
                      Prioridad Alta
                    </div>

                    {preview.pedido.motivo_prioridad && (
                      <p className="text-red-600 text-xs leading-relaxed">
                        {preview.pedido.motivo_prioridad}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* PRODUCTOS */}
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="px-5 py-2 border-b border-zinc-100">
                  <h3 className="font-semibold text-zinc-900 text-lg">
                    Productos solicitados
                  </h3>
                </div>

                <div className="overflow-y-auto flex-1">
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
                        className="px-5 py-2 border-b border-zinc-100 hover:bg-zinc-50 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 ">
                            <p className="text-sm text-zinc-900 leading-snug break-words">
                              {item.producto_nombre}
                            </p>

                            <div className="flex items-center gap-2 mt-1">
                              <div className="bg-orange-100 rounded-xl px-2.5 py-1 text-xs text-zinc-700">
                                Solicitado: <strong>{item.cantidad}</strong>
                              </div>

                              <div className="bg-zinc-100 rounded-xl px-2.5 py-1 text-xs text-zinc-700">
                                Enviado:{" "}
                                <strong>{item.cantidad_enviada}</strong>
                              </div>
                            </div>
                          </div>

                          <div
                            className={`text-xs font-bold whitespace-nowrap
                            ${
                              estado === "Pendiente"
                                ? "text-red-600"
                                : estado === "Parcial"
                                  ? "text-orange-600"
                                  : "text-emerald-600"
                            }`}
                          >
                            {estado}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* FOOTER */}
              <div className="p-5 border-t border-zinc-200">
                <Link
                  href={`/dashboard/pedidos/${preview.pedido.id}`}
                  className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 transition text-white font-semibold rounded-2xl py-3.5 text-sm shadow-lg shadow-blue-500/20"
                >
                  {preview.pedido.estado === "completado" ||
                  preview.pedido.estado === "completado_con_excedentes"
                    ? "Revisar pedido"
                    : "Completar pedido"}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
