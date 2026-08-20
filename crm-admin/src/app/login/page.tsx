"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { usernameToEmail } from "@/lib/auth";

type Acceso = "admin" | "instructor";

export default function LoginPage() {
  const router = useRouter();
  const [acceso, setAcceso] = useState<Acceso>("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });

    if (signInError || !data.user) {
      setLoading(false);
      setError("Usuario o contraseña incorrectos.");
      return;
    }

    const { data: adminRow } = await supabase
      .from("admins")
      .select("rol")
      .eq("id", data.user.id)
      .maybeSingle();

    const rolEsperado = acceso === "admin" ? "super_admin" : "instructor";

    if (!adminRow) {
      await supabase.auth.signOut();
      setLoading(false);
      setError("Esta cuenta no tiene acceso al panel.");
      return;
    }

    if (adminRow.rol !== rolEsperado) {
      await supabase.auth.signOut();
      setLoading(false);
      setError(
        acceso === "admin"
          ? "Esta cuenta es de instructor. Selecciona la pestaña \"Instructor\"."
          : "Esta cuenta es de administrador. Selecciona la pestaña \"Administrador\"."
      );
      return;
    }

    setLoading(false);
    router.push(
      adminRow.rol === "super_admin" ? "/dashboard" : "/dashboard/miembros"
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-red-900/30 bg-neutral-900 p-8 shadow-xl"
      >
        <div className="mb-4 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.jpeg"
            alt="Bad Boys Gym"
            width={44}
            height={44}
            className="rounded-lg object-cover"
          />
          <div className="text-xs font-semibold uppercase tracking-widest text-red-600">
            Bad Boys Gym
          </div>
        </div>
        <h1 className="mb-6 text-2xl font-bold text-white light:text-zinc-900">Panel de Administración</h1>

        <div className="mb-6 flex gap-2 rounded-lg bg-neutral-800 p-1">
          <button
            type="button"
            onClick={() => setAcceso("admin")}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
              acceso === "admin"
                ? "bg-red-600 text-white"
                : "text-neutral-400 hover:text-white light:hover:text-zinc-900"
            }`}
          >
            Administrador
          </button>
          <button
            type="button"
            onClick={() => setAcceso("instructor")}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
              acceso === "instructor"
                ? "bg-red-600 text-white"
                : "text-neutral-400 hover:text-white light:hover:text-zinc-900"
            }`}
          >
            Instructor
          </button>
        </div>

        <label className="mb-1 block text-sm text-neutral-400">Usuario</label>
        <input
          type="text"
          required
          autoCapitalize="none"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mb-4 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white light:text-zinc-900 outline-none focus:border-red-600"
          placeholder="Tu usuario"
        />

        <label className="mb-1 block text-sm text-neutral-400">Contraseña</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white light:text-zinc-900 outline-none focus:border-red-600"
          placeholder="••••••••"
        />

        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-red-600 py-2.5 font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
