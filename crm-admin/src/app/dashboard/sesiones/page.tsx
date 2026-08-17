"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSede } from "@/lib/SedeContext";
import type { EstadoSesion, SesionGratis } from "@/lib/types";

const TABS: { key: EstadoSesion | "hoy" | "todas"; label: string }[] = [
  { key: "hoy", label: "Hoy" },
  { key: "pendiente", label: "Pendientes" },
  { key: "asistio", label: "Asistieron" },
  { key: "no_asistio", label: "No asistieron" },
  { key: "todas", label: "Todas" },
];

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatoFecha(fecha: string) {
  const [a, m, d] = fecha.split("-");
  return `${d}/${m}/${a}`;
}

function formatoHora(hora: string) {
  const h = Number(hora.slice(0, 2));
  const sufijo = h < 12 ? "am" : "pm";
  const doce = h % 12 === 0 ? 12 : h % 12;
  return `${doce}:00${sufijo}`;
}

function EstadoBadge({ estado }: { estado: EstadoSesion }) {
  const estilos: Record<EstadoSesion, string> = {
    pendiente: "bg-blue-600/20 text-blue-400",
    asistio: "bg-green-600/20 text-green-400",
    no_asistio: "bg-neutral-600/20 text-neutral-400",
  };
  const textos: Record<EstadoSesion, string> = {
    pendiente: "Pendiente",
    asistio: "Asistió",
    no_asistio: "No asistió",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estilos[estado]}`}>
      {textos[estado]}
    </span>
  );
}

export default function SesionesPage() {
  const { selectedSedeId, sedes } = useSede();
  const [sesiones, setSesiones] = useState<SesionGratis[]>([]);
  const [tab, setTab] = useState<EstadoSesion | "hoy" | "todas">("hoy");
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function cargar() {
    setLoading(true);
    let query = supabase
      .from("sesiones_gratis")
      .select("*")
      .order("fecha", { ascending: true })
      .order("hora", { ascending: true });

    if (selectedSedeId !== "todas") {
      query = query.eq("sede_id", selectedSedeId);
    }

    const { data } = await query;
    setSesiones((data ?? []) as SesionGratis[]);
    setLoading(false);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSedeId]);

  const filtradas = useMemo(() => {
    if (tab === "todas") return sesiones;
    if (tab === "hoy") return sesiones.filter((s) => s.fecha === hoyISO());
    return sesiones.filter((s) => s.estado === tab);
  }, [sesiones, tab]);

  async function marcar(s: SesionGratis, estado: EstadoSesion) {
    setBusy(s.id);
    await supabase.from("sesiones_gratis").update({ estado }).eq("id", s.id);
    await cargar();
    setBusy(null);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Sesiones gratis</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              tab === t.key
                ? "bg-red-600 text-white"
                : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-400">
            <tr>
              <th className="px-4 py-3">Cuándo</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Sede</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((s) => (
              <tr key={s.id} className="border-t border-neutral-800 align-top">
                <td className="px-4 py-3">
                  <div>{formatoFecha(s.fecha)}</div>
                  <div className="text-neutral-500">{formatoHora(s.hora)}</div>
                </td>
                <td className="px-4 py-3">{s.nombre}</td>
                <td className="px-4 py-3">
                  <div>{s.correo}</div>
                  <div className="text-neutral-500">{s.telefono}</div>
                </td>
                <td className="px-4 py-3">
                  {sedes.find((x) => x.id === s.sede_id)?.nombre ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <EstadoBadge estado={s.estado} />
                </td>
                <td className="px-4 py-3">
                  {s.estado === "pendiente" && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        disabled={busy === s.id}
                        onClick={() => marcar(s, "asistio")}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        Asistió
                      </button>
                      <button
                        disabled={busy === s.id}
                        onClick={() => marcar(s, "no_asistio")}
                        className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 disabled:opacity-50"
                      >
                        No asistió
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!loading && filtradas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-500">
                  No hay sesiones en esta vista.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
