"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { SedeContext } from "@/lib/SedeContext";
import type { AdminProfile, Sede } from "@/lib/types";

const ICONO_CLASE = "h-5 w-5 shrink-0";

function Icono({ children }: { children: React.ReactNode }) {
  return (
    <svg
      className={ICONO_CLASE}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const ICONOS: Record<string, React.ReactNode> = {
  "/dashboard": (
    <Icono>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </Icono>
  ),
  "/dashboard/miembros": (
    <Icono>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Icono>
  ),
  "/dashboard/sesiones": (
    <Icono>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </Icono>
  ),
  "/dashboard/ingresos": (
    <Icono>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" />
    </Icono>
  ),
  "/dashboard/instructores": (
    <Icono>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="m16 11 2 2 4-4" />
    </Icono>
  ),
  "/dashboard/contactos": (
    <Icono>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M9 7h6" />
    </Icono>
  ),
  "/dashboard/cuenta": (
    <Icono>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6.2 19a6 6 0 0 1 11.6 0" />
    </Icono>
  ),
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [selectedSedeId, setSelectedSedeId] = useState<string | "todas">("todas");
  const [notAdmin, setNotAdmin] = useState(false);

  // Colapsado = solo iconos, en pantallas grandes.
  const [colapsado, setColapsado] = useState(false);
  // En móvil la barra es un cajón que se desliza encima del contenido.
  const [cajonAbierto, setCajonAbierto] = useState(false);

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

  // Se lee después del primer render para no romper la hidratación.
  useEffect(() => {
    setColapsado(localStorage.getItem("bbg_menu_colapsado") === "1");
  }, []);

  useEffect(() => {
    setCajonAbierto(false);
  }, [pathname]);

  function alternarColapso() {
    setColapsado((v) => {
      localStorage.setItem("bbg_menu_colapsado", v ? "0" : "1");
      return !v;
    });
  }

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

  const esSuperAdmin = profile?.rol === "super_admin";
  const inicio = esSuperAdmin ? "/dashboard" : "/dashboard/miembros";

  const links = [
    ...(esSuperAdmin ? [{ href: "/dashboard", label: "Dashboard" }] : []),
    { href: "/dashboard/miembros", label: "Miembros" },
    { href: "/dashboard/sesiones", label: "Sesiones" },
    { href: "/dashboard/ingresos", label: "Ingresos" },
    ...(esSuperAdmin
      ? [
          { href: "/dashboard/instructores", label: "Instructores" },
          { href: "/dashboard/contactos", label: "Contactos" },
        ]
      : []),
    { href: "/dashboard/cuenta", label: "Mi cuenta" },
  ];

  const sedeControl = esSuperAdmin ? (
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
  );

  const anchoBarra = colapsado ? "lg:w-16" : "lg:w-60";
  const margenContenido = colapsado ? "lg:pl-16" : "lg:pl-60";

  return (
    <SedeContext.Provider
      value={{ profile: profile!, sedes, selectedSedeId, setSelectedSedeId }}
    >
      <div className="min-h-screen bg-neutral-950 text-white">
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-neutral-800 bg-neutral-900 transition-all duration-200 ${anchoBarra} ${
            cajonAbierto ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
        >
          <div
            className={`flex h-16 shrink-0 items-center gap-3 border-b border-neutral-800 px-4 ${
              colapsado ? "lg:justify-center lg:px-0" : ""
            }`}
          >
            <Link href={inicio} className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.jpeg"
                alt="Bad Boys Gym"
                width={34}
                height={34}
                className="shrink-0 rounded-lg object-cover"
              />
              <span
                className={`text-base font-black uppercase tracking-wide ${
                  colapsado ? "lg:hidden" : ""
                }`}
              >
                Bad Boys <span className="text-red-600">Gym</span>
              </span>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {links.map((l) => {
              const activo = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  title={colapsado ? l.label : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    colapsado ? "lg:justify-center lg:px-0" : ""
                  } ${
                    activo
                      ? "bg-red-600 text-white"
                      : "text-neutral-300 hover:bg-neutral-800"
                  }`}
                >
                  {ICONOS[l.href]}
                  <span className={colapsado ? "lg:hidden" : ""}>{l.label}</span>
                </Link>
              );
            })}
          </nav>

          <button
            onClick={alternarColapso}
            aria-label={colapsado ? "Mostrar menú" : "Ocultar menú"}
            className={`hidden shrink-0 items-center gap-3 border-t border-neutral-800 px-3 py-3 text-sm text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 lg:flex ${
              colapsado ? "lg:justify-center" : ""
            }`}
          >
            <Icono>
              {colapsado ? (
                <>
                  <path d="m13 17 5-5-5-5" />
                  <path d="m6 17 5-5-5-5" />
                </>
              ) : (
                <>
                  <path d="m11 17-5-5 5-5" />
                  <path d="m18 17-5-5 5-5" />
                </>
              )}
            </Icono>
            <span className={colapsado ? "lg:hidden" : ""}>Ocultar menú</span>
          </button>
        </aside>

        {cajonAbierto && (
          <div
            onClick={() => setCajonAbierto(false)}
            className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          />
        )}

        <div className={`transition-all duration-200 ${margenContenido}`}>
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-neutral-800 bg-neutral-950/95 px-4 backdrop-blur sm:px-6">
            <button
              onClick={() => setCajonAbierto(true)}
              aria-label="Abrir menú"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-700 text-neutral-300 lg:hidden"
            >
              <Icono>
                <path d="M4 7h16M4 12h16M4 17h16" />
              </Icono>
            </button>

            <div className="ml-auto flex items-center gap-3">
              {sedeControl}
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

          <main className="p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </SedeContext.Provider>
  );
}
