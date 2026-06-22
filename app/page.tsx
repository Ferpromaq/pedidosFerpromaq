"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const supabase = createClient();

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    console.log("➡️ LOGIN INICIADO");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("📦 DATA:", data);
      console.log("❌ ERROR:", error);

      if (error) {
        setError(error.message);
        return;
      }

      if (!data?.session) {
        setError("No se generó sesión");
        return;
      }

      console.log("✅ LOGIN OK");

      // 🔥 IMPORTANTE: salir de loading ANTES del redirect
      setLoading(false);

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.log("❌ CATCH:", err);
      setError("Error inesperado al iniciar sesión");
    } finally {
      // 🔥 GARANTIZA que NUNCA quede pegado
      setLoading(false);
    }
  }

  return (
    <main className="h-screen flex items-center justify-center bg-zinc-100">
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-black">
          Pedidos Ferpromaq
        </h1>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-zinc-300 rounded-lg px-4 py-3 text-black"
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-zinc-300 rounded-lg px-4 py-3 text-black"
          />

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </main>
  );
}