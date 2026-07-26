"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { SedeContext } from "@/lib/SedeContext";
import type { AdminProfile, Sede } from "@/lib/types";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [selectedSedeId, setSelectedSedeId] = useState<string | "todas">("todas");
  const [notAdmin, setNotAdmin] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data: adminRow } = await supabase
        .from("admins")
        .select("id,nombre,rol,sede_id")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!adminRow) {
        setNotAdmin(true);
        setLoading(false);
        return;
      }

      const { data: sedesData } = await supabase
        .from("sedes")
        .select("id,nombre,activa")
        .order("nombre");

      setProfile(adminRow as AdminProfile);
      setSedes((sedesData ?? []) as Sede[]);
      setSelectedSedeId(
        adminRow.rol === "super_admin" ? "todas" : (adminRow.sede_id as string)
      );
      setLoading(false);
    }

    init();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-400">
        Cargando...
      </div>
    );
  }

  if (notAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-950 px-4 text-center text-neutral-300">
        <p>Tu cuenta no tiene un perfil de administrador asignado.</p>
        <button
          onClick={handleLogout}
          className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
        pathname === href
          ? "bg-red-600 text-white"
          : "text-neutral-300 hover:bg-neutral-800"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <SedeContext.Provider
      value={{ profile: profile!, sedes, selectedSedeId, setSelectedSedeId }}
    >
      <div className="min-h-screen bg-neutral-950 text-white">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 px-6 py-4">
          <div className="flex items-center gap-6">
            <div className="text-lg font-black uppercase tracking-wide">
              Bad Boys <span className="text-red-600">Gym</span>
            </div>
            <nav className="flex gap-2">
              {navLink("/dashboard", "Dashboard")}
              {navLink("/dashboard/miembros", "Miembros")}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {profile?.rol === "super_admin" ? (
              <select
                value={selectedSedeId}
                onChange={(e) => setSelectedSedeId(e.target.value)}
                className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
              >
                <option value="todas">Todas las sedes</option>
                {sedes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <span className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-300">
                {sedes.find((s) => s.id === profile?.sede_id)?.nombre ?? "Sin sede"}
              </span>
            )}

            <span className="hidden text-sm text-neutral-400 sm:inline">
              {profile?.nombre}
            </span>

            <button
              onClick={handleLogout}
              className="rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
            >
              Salir
            </button>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </SedeContext.Provider>
  );
}
