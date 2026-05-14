"use client";

import { Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Producto = {
  id: number;
  nombre: string;
  codigo: string;
};

type ItemPedido = {
  producto_id: number;
  producto_nombre: string;
  producto_codigo: string;
  cantidad: number;
};

export default function NuevoPedidoPage() {
  const [busqueda, setBusqueda] = useState("");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [items, setItems] = useState<ItemPedido[]>([]);
  const [sucursal, setSucursal] = useState("Picarte");

  const [prioridadAlta, setPrioridadAlta] = useState(false);
  const [motivoPrioridad, setMotivoPrioridad] = useState("");

  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  async function buscarProductos(valor: string) {
    setBusqueda(valor);
    setSelectedIndex(0);

    if (!valor.trim()) {
      setProductos([]);
      return;
    }

    const palabras = valor.toLowerCase().split(" ").filter(Boolean);

    let query = supabase.from("productos").select("*");

    palabras.forEach((palabra) => {
      query = query.ilike("nombre", `%${palabra}%`);
    });

    const { data } = await query.limit(10);

    if (data) setProductos(data);
  }

  function agregarProducto(producto: Producto) {
    setItems((prev) => {
      const existe = prev.find((item) => item.producto_id === producto.id);

      // Si ya existe, aumentar cantidad
      if (existe) {
        return prev.map((item) =>
          item.producto_id === producto.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
              }
            : item,
        );
      }

      // Si no existe, agregar nuevo
      return [
        ...prev,
        {
          producto_id: producto.id,
          producto_nombre: producto.nombre,
          producto_codigo: producto.codigo,
          cantidad: 1,
        },
      ];
    });

    // Limpiar búsqueda
    setBusqueda("");
    setProductos([]);
    setSelectedIndex(0);

    // Mantener foco
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }

  function cambiarCantidad(productoId: number, cantidad: number) {
    if (cantidad < 1) return;

    setItems((prev) =>
      prev.map((item) =>
        item.producto_id === productoId ? { ...item, cantidad } : item,
      ),
    );
  }

  function eliminarItem(productoId: number) {
    setItems((prev) => prev.filter((item) => item.producto_id !== productoId));
  }

  async function crearPedido() {
    if (items.length === 0) {
      alert("Agrega productos");
      return;
    }

    if (prioridadAlta && motivoPrioridad.trim() === "") {
      alert("Debes ingresar el motivo de la prioridad alta");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Usuario no autenticado");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("nombre")
      .eq("id", user.id)
      .single();

    const nombreUsuario = profile?.nombre || user.email || "Usuario";

    const { data: pedido, error } = await supabase
      .from("pedidos")
      .insert({
        usuario_id: user.id,
        usuario_email: user.email,
        usuario_nombre: nombreUsuario,
        sucursal,
        estado: "pendiente",
        prioridad_alta: prioridadAlta,
        motivo_prioridad: prioridadAlta ? motivoPrioridad : null,
      })
      .select()
      .single();

    if (error || !pedido) {
      console.log(error);
      alert("Error creando pedido");
      return;
    }

    const itemsInsertar = items.map((item) => ({
      pedido_id: pedido.id,
      producto_id: item.producto_id,
      producto_nombre: item.producto_nombre,
      producto_codigo: item.producto_codigo,
      cantidad: item.cantidad,
    }));

    const { error: itemsError } = await supabase
      .from("pedido_items")
      .insert(itemsInsertar);

    if (itemsError) {
      console.log(itemsError);
      alert("Error guardando productos");
      return;
    }

    // =========================
    // 📩 ENVIAR EMAIL AQUÍ
    // =========================
    try {
      await fetch("/api/notificar-pedido", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pedidoId: pedido.id,
          sucursal,
          usuario: nombreUsuario,
          prioridadAlta,
        }),
      });
    } catch (e) {
      console.log("Error enviando correo", e);
    }

    alert("Pedido creado correctamente");

    setItems([]);
    setPrioridadAlta(false);
    setMotivoPrioridad("");
    setBusqueda("");
    setProductos([]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (productos.length === 0) return;

    // Flecha abajo
    if (e.key === "ArrowDown") {
      e.preventDefault();

      setSelectedIndex((prev) =>
        prev < productos.length - 1 ? prev + 1 : prev,
      );
    }

    // Flecha arriba
    if (e.key === "ArrowUp") {
      e.preventDefault();

      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    }

    // Enter
    if (e.key === "Enter") {
      e.preventDefault();

      const producto = productos[selectedIndex];

      if (producto) {
        agregarProducto(producto);
      }
    }
  }

  return (
    <div className="bg-white min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">Crear pedido</h1>

      {/* SUCURSAL */}
      <select
        value={sucursal}
        onChange={(e) => setSucursal(e.target.value)}
        className="border border-gray-300 rounded-xl p-3 mb-4 w-full text-gray-900 bg-white shadow-sm"
      >
        <option>Picarte</option>
        <option>Collico</option>
        <option>Las Ánimas</option>
      </select>

      {/* BUSCADOR */}
      <div className="relative mb-4">
        <input
          ref={inputRef}
          value={busqueda}
          onChange={(e) => buscarProductos(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar producto"
          className="border border-gray-300 rounded-xl p-3 w-full text-gray-900 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* RESULTADOS */}
        {productos.length > 0 && (
          <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white/95 backdrop-blur-md shadow-2xl">
            {productos.map((p, index) => (
              <div
                key={p.id}
                onClick={() => agregarProducto(p)}
                className={`p-3 cursor-pointer transition-all border-b border-gray-100 last:border-b-0
                ${selectedIndex === index ? "bg-blue-50" : "hover:bg-gray-50"}`}
              >
                <div className="text-gray-900 font-semibold">{p.codigo}</div>

                <div className="text-gray-600 text-sm">{p.nombre}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ITEMS */}
      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div
            key={item.producto_id}
            className="border border-gray-200 rounded-2xl p-4 flex justify-between items-center bg-white shadow-sm"
          >
            <div>
              <div className="font-semibold text-gray-900">
                {item.producto_codigo}
              </div>

              <div className="text-sm text-gray-600">
                {item.producto_nombre}
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <input
                type="number"
                min={1}
                value={item.cantidad}
                onChange={(e) =>
                  cambiarCantidad(item.producto_id, Number(e.target.value))
                }
                className="border border-gray-300 rounded-lg w-20 p-2 text-gray-900 bg-white"
              />

              <button
                onClick={() => eliminarItem(item.producto_id)}
                className="bg-red-500 hover:bg-red-600 transition-colors rounded-lg cursor-pointer text-white p-2"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PRIORIDAD */}
      <div className="flex items-center gap-2 mb-3">
        <input
          type="checkbox"
          checked={prioridadAlta}
          onChange={(e) => setPrioridadAlta(e.target.checked)}
        />

        <label className="text-gray-700 font-medium">Prioridad alta</label>
      </div>

      {prioridadAlta && (
        <textarea
          value={motivoPrioridad}
          onChange={(e) => setMotivoPrioridad(e.target.value)}
          placeholder="Motivo de prioridad"
          className="border border-gray-300 rounded-xl p-3 w-full mb-4 text-gray-900 bg-white shadow-sm"
          rows={3}
        />
      )}

      {/* BOTÓN */}
      <button
        onClick={crearPedido}
        className="bg-blue-600 hover:bg-blue-700 transition-colors rounded-xl cursor-pointer text-white px-5 py-3 font-medium shadow-lg"
      >
        Crear pedido
      </button>
    </div>
  );
}
