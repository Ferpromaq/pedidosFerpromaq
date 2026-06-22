'use client'

import { useEffect, useState } from 'react'
import { createClient } from "@/lib/supabase";

const supabase = createClient();
type Producto = {
  id: number
  nombre: string
  codigo: string
}

export default function ProductosPage() {
  const [loading, setLoading] = useState(true)
  const [productos, setProductos] = useState<Producto[]>([])
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    async function cargarProductos() {
      const { data } = await supabase
        .from('productos')
        .select('*')
        .limit(10)

      if (data) {
        setProductos(data)
      }

      setLoading(false)
    }

    cargarProductos()
  }, [])

  async function buscarProductos(valor: string) {
    setBusqueda(valor)

    if (!valor.trim()) {
      const { data } = await supabase
        .from('productos')
        .select('*')
        .limit(10)

      if (data) {
        setProductos(data)
      }

      return
    }

    const palabras = valor
      .toLowerCase()
      .split(' ')
      .filter(Boolean)

    let query = supabase
      .from('productos')
      .select('*')

    palabras.forEach((palabra) => {
      query = query.ilike('nombre', `%${palabra}%`)
    })

    const { data } = await query.limit(10)

    if (data) {
      setProductos(data)
    }
  }

  if (loading) {
    return (
      <div className="bg-white p-6 shadow-sm">
        Cargando productos...
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">
          Productos
        </h1>

        <p className="text-zinc-500">
          Busca productos del sistema.
        </p>
      </div>

      <input
        type="text"
        placeholder="Buscar producto..."
        value={busqueda}
        onChange={(e) => buscarProductos(e.target.value)}
        className="w-full border border-zinc-300 rounded-xl px-4 py-3 mb-6 outline-none focus:ring-2 focus:ring-orange-500 text-zinc-900"
      />

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="w-full">

          <thead className="bg-zinc-100">
            <tr>
              <th className="text-left px-4 py-3 text-zinc-700">
                Código
              </th>

              <th className="text-left px-4 py-3 text-zinc-700">
                Nombre
              </th>
            </tr>
          </thead>

          <tbody>
            {productos.map((producto) => (
              <tr
                key={producto.id}
                className="border-t border-zinc-200 hover:bg-zinc-50 transition"
              >
                <td className="px-4 py-3 font-medium text-zinc-900">
                  {producto.codigo}
                </td>

                <td className="px-4 py-3 text-zinc-800">
                  {producto.nombre}
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

    </div>
  )
}