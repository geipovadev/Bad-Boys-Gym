"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSede } from "@/lib/SedeContext";
import type { Miembro, Plan, Estado } from "@/lib/types";
import { EstadoBadge } from "../page";
import { hoyISO, calcularVencimiento } from "@/lib/fechas";

const TABS: { key: Estado | "todos"; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "pendiente", label: "Pendientes" },
  { key: "activo", label: "Activos" },
  { key: "por_vencer", label: "Por vencer" },
  { key: "vencido", label: "Vencidos" },
  { key: "inactivo", label: "Inactivos" },
];

export default function MiembrosPage() {
  const { selectedSedeId, profile, sedes } = useSede();
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [planes, setPlanes] = useState<Record<string, Plan>>({});
  const [tab, setTab] = useState<Estado | "todos">("todos");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function cargar() {
    setLoading(true);

    const { data: planesData } = await supabase.from("planes").select("*");
    const mapaPlanes: Record<string, Plan> = {};
    (planesData ?? []).forEach((p) => (mapaPlanes[p.id] = p as Plan));
    setPlanes(mapaPlanes);

    let query = supabase
      .from("miembros_estado")
      .select("*")
      .order("created_at", { ascending: false });

    if (selectedSedeId !== "todas") {
      query = query.eq("sede_id", selectedSedeId);
    }

    const { data } = await query;
    setMiembros((data ?? []) as Miembro[]);
    setLoading(false);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSedeId]);

  const filtrados = useMemo(
    () => (tab === "todos" ? miembros : miembros.filter((m) => m.estado === tab)),
    [miembros, tab]
  );

  async function confirmarYActivar(m: Miembro) {
    const plan = planes[m.plan_id];
    if (!plan) return;

    setBusy(m.id);
    const inicio = hoyISO();
    const vencimiento = calcularVencimiento(inicio, plan.duracion_dias);

    await supabase
      .from("miembros")
      .update({
        activo: true,
        estado_pago: "confirmado",
        fecha_inicio: inicio,
        fecha_vencimiento: vencimiento,
      })
      .eq("id", m.id);

    await supabase.from("pagos").insert({
      miembro_id: m.id,
      sede_id: m.sede_id,
      concepto: plan.nombre,
      monto: plan.precio,
      metodo: m.metodo_pago,
      registrado_por: profile.id,
    });

    await cargar();
    setBusy(null);
  }

  async function renovar(m: Miembro) {
    const plan = planes[m.plan_id];
    if (!plan) return;

    setBusy(m.id);
    const base = m.fecha_vencimiento && m.fecha_vencimiento > hoyISO() ? m.fecha_vencimiento : hoyISO();
    const nuevoVencimiento = calcularVencimiento(base, plan.duracion_dias);

    await supabase
      .from("miembros")
      .update({ activo: true, fecha_vencimiento: nuevoVencimiento })
      .eq("id", m.id);

    await supabase.from("pagos").insert({
      miembro_id: m.id,
      sede_id: m.sede_id,
      concepto: plan.nombre,
      monto: plan.precio,
      metodo: m.metodo_pago,
      registrado_por: profile.id,
    });

    await cargar();
    setBusy(null);
  }

  async function toggleActivo(m: Miembro) {
    setBusy(m.id);
    await supabase.from("miembros").update({ activo: !m.activo }).eq("id", m.id);
    await cargar();
    setBusy(null);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Miembros</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              tab === t.key
                ? "bg-red-600 text-white"
                : "bg-neutral-900 text-neutral-300 hover:bg-neutral-800"
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
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Sede</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Pago</th>
              <th className="px-4 py-3">Vence</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((m) => (
              <tr key={m.id} className="border-t border-neutral-800 align-top">
                <td className="px-4 py-3">
                  {m.nombre} {m.apellido}
                </td>
                <td className="px-4 py-3">
                  <div>{m.correo}</div>
                  <div className="text-neutral-500">{m.whatsapp}</div>
                </td>
                <td className="px-4 py-3">
                  {sedes.find((s) => s.id === m.sede_id)?.nombre ?? "—"}
                </td>
                <td className="px-4 py-3">{planes[m.plan_id]?.nombre ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="capitalize">{m.metodo_pago}</div>
                  <div className="text-neutral-500">{m.estado_pago}</div>
                </td>
                <td className="px-4 py-3">{m.fecha_vencimiento ?? "—"}</td>
                <td className="px-4 py-3">
                  <EstadoBadge estado={m.estado} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {m.estado_pago === "pendiente" && (
                      <button
                        disabled={busy === m.id}
                        onClick={() => confirmarYActivar(m)}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        Confirmar y activar
                      </button>
                    )}
                    {m.estado_pago === "confirmado" &&
                      (m.estado === "vencido" || m.estado === "por_vencer") && (
                        <button
                          disabled={busy === m.id}
                          onClick={() => renovar(m)}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          Renovar
                        </button>
                      )}
                    {m.estado_pago === "confirmado" &&
                      profile.rol === "super_admin" && (
                        <button
                          disabled={busy === m.id}
                          onClick={() => toggleActivo(m)}
                          className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 disabled:opacity-50"
                        >
                          {m.activo ? "Desactivar" : "Reactivar"}
                        </button>
                      )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filtrados.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-neutral-500">
                  No hay miembros en este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
