"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSede } from "@/lib/SedeContext";
import type { Miembro } from "@/lib/types";

type Counts = {
  total: number;
  activos: number;
  porVencer: number;
  vencidos: number;
  pendientes: number;
};

const EMPTY_COUNTS: Counts = { total: 0, activos: 0, porVencer: 0, vencidos: 0, pendientes: 0 };

export default function DashboardPage() {
  const { selectedSedeId } = useSede();
  const [counts, setCounts] = useState<Counts>(EMPTY_COUNTS);
  const [recientes, setRecientes] = useState<Miembro[]>([]);
  const [loading, setLoading] = useState(true);

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

      setLoading(false);
    }

    load();
  }, [selectedSedeId]);

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
