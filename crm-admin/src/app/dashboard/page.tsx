"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useSede } from "@/lib/SedeContext";
import type { Miembro } from "@/lib/types";
import BarChart, { type BarChartPoint } from "@/components/BarChart";

type Counts = {
  total: number;
  activos: number;
  porVencer: number;
  vencidos: number;
  pendientes: number;
};

const EMPTY_COUNTS: Counts = { total: 0, activos: 0, porVencer: 0, vencidos: 0, pendientes: 0 };

const MESES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const RANGOS = [
  { meses: 3, label: "3 meses" },
  { meses: 6, label: "6 meses" },
  { meses: 12, label: "12 meses" },
];

function listaDeMeses(n: number) {
  const hoy = new Date();
  const meses = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    meses.push({ key, label: `${MESES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` });
  }
  return meses;
}

function formatoColones(v: number) {
  return `₡${Math.round(v).toLocaleString("es-CR")}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { selectedSedeId, profile } = useSede();
  const [counts, setCounts] = useState<Counts>(EMPTY_COUNTS);
  const [recientes, setRecientes] = useState<Miembro[]>([]);
  const [rangoMeses, setRangoMeses] = useState(6);
  const [ingresosPorMes, setIngresosPorMes] = useState<BarChartPoint[]>([]);
  const [miembrosPorMes, setMiembrosPorMes] = useState<BarChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const meses = useMemo(() => listaDeMeses(rangoMeses), [rangoMeses]);

  // El Dashboard es solo para super_admin; el instructor arranca en Miembros.
  useEffect(() => {
    if (profile.rol !== "super_admin") {
      router.replace("/dashboard/miembros");
    }
  }, [profile, router]);

  useEffect(() => {
    async function load() {
      setLoading(true);

      let query = supabase.from("miembros_estado").select("*");
      if (selectedSedeId !== "todas") {
        query = query.eq("sede_id", selectedSedeId);
      }

      const { data } = await query;
      const miembros = (data ?? []) as Miembro[];

      setCounts({
        total: miembros.length,
        activos: miembros.filter((m) => m.estado === "activo").length,
        porVencer: miembros.filter((m) => m.estado === "por_vencer").length,
        vencidos: miembros.filter((m) => m.estado === "vencido").length,
        pendientes: miembros.filter((m) => m.estado === "pendiente").length,
      });

      setRecientes(
        [...miembros]
          .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
          .slice(0, 5)
      );

      const desde = `${meses[0].key}-01`;

      let pagosQuery = supabase
        .from("pagos")
        .select("fecha,monto,sede_id")
        .gte("fecha", desde);
      if (selectedSedeId !== "todas") {
        pagosQuery = pagosQuery.eq("sede_id", selectedSedeId);
      }
      const { data: pagosData } = await pagosQuery;

      const ingresosPorClave: Record<string, number> = {};
      (pagosData ?? []).forEach((p) => {
        const clave = String(p.fecha).slice(0, 7);
        ingresosPorClave[clave] = (ingresosPorClave[clave] ?? 0) + Number(p.monto);
      });
      setIngresosPorMes(
        meses.map((m) => ({ label: m.label, value: ingresosPorClave[m.key] ?? 0 }))
      );

      let miembrosQuery = supabase
        .from("miembros")
        .select("created_at,sede_id")
        .gte("created_at", desde);
      if (selectedSedeId !== "todas") {
        miembrosQuery = miembrosQuery.eq("sede_id", selectedSedeId);
      }
      const { data: miembrosData } = await miembrosQuery;

      const miembrosPorClave: Record<string, number> = {};
      (miembrosData ?? []).forEach((m) => {
        const clave = String(m.created_at).slice(0, 7);
        miembrosPorClave[clave] = (miembrosPorClave[clave] ?? 0) + 1;
      });
      setMiembrosPorMes(
        meses.map((m) => ({ label: m.label, value: miembrosPorClave[m.key] ?? 0 }))
      );

      setLoading(false);
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSedeId, rangoMeses]);

  const cards: { label: string; value: number; color: string }[] = [
    { label: "Total de miembros", value: counts.total, color: "text-white" },
    { label: "Activos", value: counts.activos, color: "text-green-500" },
    { label: "Por vencer (≤5 días)", value: counts.porVencer, color: "text-yellow-500" },
    { label: "Vencidos", value: counts.vencidos, color: "text-red-500" },
    { label: "Pendientes de confirmar", value: counts.pendientes, color: "text-blue-400" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
          >
            <div className={`text-3xl font-black ${c.color}`}>
              {loading ? "…" : c.value}
            </div>
            <div className="mt-1 text-sm text-neutral-400">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm text-neutral-500">Ver últimos:</span>
        {RANGOS.map((r) => (
          <button
            key={r.meses}
            onClick={() => setRangoMeses(r.meses)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              rangoMeses === r.meses
                ? "bg-red-600 text-white"
                : "bg-neutral-900 text-neutral-300 hover:bg-neutral-800"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarChart
          title="Ingresos por mes"
          data={ingresosPorMes}
          color="#3987e5"
          formatValue={formatoColones}
        />
        <BarChart
          title="Miembros nuevos por mes"
          data={miembrosPorMes}
          color="#199e70"
          formatValue={(v) => v.toLocaleString("es-CR")}
        />
      </div>

      <h2 className="mb-3 text-lg font-semibold">Últimos registros</h2>
      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-400">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">WhatsApp</th>
              <th className="px-4 py-3">Método de pago</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {recientes.map((m) => (
              <tr key={m.id} className="border-t border-neutral-800">
                <td className="px-4 py-3">
                  {m.nombre} {m.apellido}
                </td>
                <td className="px-4 py-3">{m.whatsapp}</td>
                <td className="px-4 py-3 capitalize">{m.metodo_pago}</td>
                <td className="px-4 py-3">
                  <EstadoBadge estado={m.estado} />
                </td>
              </tr>
            ))}
            {!loading && recientes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                  Sin registros todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function EstadoBadge({ estado }: { estado: Miembro["estado"] }) {
  const styles: Record<Miembro["estado"], string> = {
    activo: "bg-green-600/20 text-green-400",
    por_vencer: "bg-yellow-600/20 text-yellow-400",
    vencido: "bg-red-600/20 text-red-400",
    pendiente: "bg-blue-600/20 text-blue-400",
    inactivo: "bg-neutral-600/20 text-neutral-400",
  };
  const labels: Record<Miembro["estado"], string> = {
    activo: "Activo",
    por_vencer: "Por vencer",
    vencido: "Vencido",
    pendiente: "Pendiente",
    inactivo: "Inactivo",
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[estado]}`}>
      {labels[estado]}
    </span>
  );
}
