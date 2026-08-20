"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { usernameToEmail } from "@/lib/auth";
import { useSede } from "@/lib/SedeContext";
import type { AdminProfile, Sede } from "@/lib/types";

type Instructor = AdminProfile & { created_at: string };

export default function InstructoresPage() {
  const router = useRouter();
  const { profile, sedes, refreshToken } = useSede();

  const [instructores, setInstructores] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [sedeId, setSedeId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Solo los super admin pueden gestionar instructores.
  useEffect(() => {
    if (profile.rol !== "super_admin") {
      router.replace("/dashboard/miembros");
    }
  }, [profile, router]);

  async function cargar() {
    setLoading(true);
    const { data } = await supabase
      .from("admins")
      .select("id,nombre,username,rol,sede_id,created_at")
      .eq("rol", "instructor")
      .order("created_at", { ascending: false });
    setInstructores((data ?? []) as Instructor[]);
    setLoading(false);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

  async function handleCrear(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!sedeId) {
      setError("Selecciona la sede del instructor.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setSaving(true);

    // Guardamos la sesión del admin actual: signUp cambia la sesión activa
    // del navegador al usuario recién creado, así que hay que restaurarla.
    const { data: sessionData } = await supabase.auth.getSession();
    const adminSession = sessionData.session;

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: usernameToEmail(username),
      password,
    });

    if (adminSession) {
      await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
      });
    }

    if (signUpError || !signUpData.user) {
      setSaving(false);
      setError(
        signUpError?.message.includes("already registered")
          ? "Ese nombre de usuario ya está en uso."
          : "No se pudo crear el instructor. Intenta de nuevo."
      );
      return;
    }

    const { error: insertError } = await supabase.from("admins").insert({
      id: signUpData.user.id,
      nombre,
      username: username.trim().toLowerCase(),
      rol: "instructor",
      sede_id: sedeId,
    });

    setSaving(false);

    if (insertError) {
      setError("El usuario se creó pero no se pudo asignar el perfil. Contacta soporte.");
      return;
    }

    setNombre("");
    setUsername("");
    setPassword("");
    setSedeId("");
    await cargar();
  }

  async function handleEliminar(instructor: Instructor) {
    if (!confirm(`¿Quitar acceso a ${instructor.nombre} (${instructor.username})?`)) return;
    setBusyId(instructor.id);
    await supabase.from("admins").delete().eq("id", instructor.id);
    await cargar();
    setBusyId(null);
  }

  function sedeNombre(id: string | null) {
    return sedes.find((s: Sede) => s.id === id)?.nombre ?? "—";
  }

  if (profile.rol !== "super_admin") return null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Instructores</h1>

      <div className="mb-8 max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="mb-4 text-lg font-semibold">Crear instructor</h2>

        <form onSubmit={handleCrear} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm text-neutral-400">Nombre completo</label>
            <input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white light:text-zinc-900 outline-none focus:border-red-600"
              placeholder="Juan Pérez"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-neutral-400">Usuario</label>
            <input
              required
              autoCapitalize="none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white light:text-zinc-900 outline-none focus:border-red-600"
              placeholder="juan.gym"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-neutral-400">Contraseña</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white light:text-zinc-900 outline-none focus:border-red-600"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-neutral-400">Sede asignada</label>
            <select
              required
              value={sedeId}
              onChange={(e) => setSedeId(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white light:text-zinc-900 outline-none focus:border-red-600"
            >
              <option value="">Selecciona una sede</option>
              {sedes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-neutral-500">
              El instructor solo verá clientes y métricas de esta sede.
            </p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-red-600 py-2.5 font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {saving ? "Creando..." : "Crear instructor"}
          </button>
        </form>
      </div>

      <h2 className="mb-3 text-lg font-semibold">Instructores registrados</h2>
      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="tabla-responsiva w-full text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-400">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Sede</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {instructores.map((i) => (
              <tr key={i.id} className="border-t border-neutral-800">
                <td data-label="Nombre" className="px-4 py-3">{i.nombre}</td>
                <td data-label="Usuario" className="px-4 py-3 text-neutral-400">{i.username}</td>
                <td data-label="Sede" className="px-4 py-3">{sedeNombre(i.sede_id)}</td>
                <td data-label="Acciones" className="px-4 py-3">
                  <button
                    disabled={busyId === i.id}
                    onClick={() => handleEliminar(i)}
                    className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 disabled:opacity-50"
                  >
                    Quitar acceso
                  </button>
                </td>
              </tr>
            ))}
            {!loading && instructores.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                  Todavía no has creado instructores.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
