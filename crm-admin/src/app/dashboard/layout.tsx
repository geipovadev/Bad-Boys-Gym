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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        .select("id,nombre,username,rol,sede_id")
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

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/miembros", label: "Miembros" },
    ...(profile?.rol === "super_admin"
      ? [
          { href: "/dashboard/instructores", label: "Instructores" },
          { href: "/dashboard/contactos", label: "Contactos" },
        ]
      : []),
    { href: "/dashboard/cuenta", label: "Mi cuenta" },
  ];

  const navLink = (href: string, label: string, full = false) => (
    <Link
      key={href}
      href={href}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
        full ? "block w-full" : ""
      } ${
        pathname === href
          ? "bg-red-600 text-white"
          : "text-neutral-300 hover:bg-neutral-800"
      }`}
    >
      {label}
    </Link>
  );

  const sedeControl = profile?.rol === "super_admin" ? (
    <select
      value={selectedSedeId}
      onChange={(e) => setSelectedSedeId(e.target.value)}
      className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm lg:w-auto"
    >
      <option value="todas">Todas las sedes</option>
      {sedes.map((s) => (
        <option key={s.id} value={s.id}>
          {s.nombre}
        </option>
      ))}
    </select>
  ) : (
    <span className="block w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-center text-sm text-neutral-300 lg:w-auto lg:text-left">
      {sedes.find((s) => s.id === profile?.sede_id)?.nombre ?? "Sin sede"}
    </span>
  );

  return (
    <SedeContext.Provider
      value={{ profile: profile!, sedes, selectedSedeId, setSelectedSedeId }}
    >
      <div className="min-h-screen bg-neutral-950 text-white">
        <header className="border-b border-neutral-800">
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
            <Link href="/dashboard" className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.jpeg"
                alt="Bad Boys Gym"
                width={36}
                height={36}
                className="rounded-lg object-cover"
              />
              <span className="hidden text-lg font-black uppercase tracking-wide sm:inline">
                Bad Boys <span className="text-red-600">Gym</span>
              </span>
            </Link>

            <div className="hidden items-center gap-6 lg:flex">
              <nav className="flex gap-2">
                {links.map((l) => navLink(l.href, l.label))}
              </nav>
              <div className="flex items-center gap-4">
                {sedeControl}
                <span className="text-sm text-neutral-400">{profile?.nombre}</span>
                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
                >
                  Salir
                </button>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Menú"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-700 text-neutral-300 lg:hidden"
            >
              {mobileMenuOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
              )}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="flex flex-col gap-4 border-t border-neutral-800 px-4 py-4 lg:hidden">
              <nav className="flex flex-col gap-1">
                {links.map((l) => navLink(l.href, l.label, true))}
              </nav>
              <div className="flex flex-col gap-3 border-t border-neutral-800 pt-4">
                {sedeControl}
                <span className="text-center text-sm text-neutral-400">
                  {profile?.nombre}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
                >
                  Salir
                </button>
              </div>
            </div>
          )}
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </SedeContext.Provider>
  );
}
