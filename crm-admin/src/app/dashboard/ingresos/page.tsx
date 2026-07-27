"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSede } from "@/lib/SedeContext";
import type { Pago, Sede } from "@/lib/types";

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function inicioDeMes() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function formatoColones(monto: number) {
  return `₡${monto.toLocaleString("es-CR")}`;
}

export default function IngresosPage() {
  const { profile, sedes, selectedSedeId } = useSede();

  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);

  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [monto, setMonto] = useState("");
  const [sedePago, setSedePago] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  async function cargar() {
    setLoading(true);
    let query = supabase.from("pagos").select("*").order("fecha", { ascending: false });
    if (selectedSedeId !== "todas") {
      query = query.eq("sede_id", selectedSedeId);
    }
    const { data } = await query;
    setPagos((data ?? []) as Pago[]);
    setLoading(false);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSedeId]);

  const totales = useMemo(() => {
    const hoy = hoyISO();
    const mes = inicioDeMes();
    return {
      total: pagos.reduce((s, p) => s + Number(p.monto), 0),
      mes: pagos.filter((p) => p.fecha >= mes).reduce((s, p) => s + Number(p.monto), 0),
      hoy: pagos.filter((p) => p.fecha === hoy).reduce((s, p) => s + Number(p.monto), 0),
    };
  }, [pagos]);

  function sedeNombre(id: string) {
    return sedes.find((s: Sede) => s.id === id)?.nombre ?? "—";
  }

  async function handleRegistrarPago(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const montoNum = Number(monto);
    if (!montoNum || montoNum <= 0) {
      setError("Ingresa un monto válido.");
      return;
    }

    const sedeId = selectedSedeId !== "todas" ? selectedSedeId : sedePago;
    if (!sedeId) {
      setError("Selecciona la sede de este pago.");
      return;
    }

    setSaving(true);

    const { error: pagoError } = await supabase.from("pagos").insert({
      sede_id: sedeId,
      nombre: nombre.trim(),
      whatsapp: whatsapp.trim(),
      concepto: "Pago por día",
      monto: montoNum,
      metodo: "efectivo",
      registrado_por: profile.id,
    });

    if (pagoError) {
      setSaving(false);
      setError("No se pudo registrar el pago. Intenta de nuevo.");
      return;
    }

    await supabase.from("contactos").insert({
      nombre: nombre.trim(),
      whatsapp: whatsapp.trim(),
      origen: "pago_diario",
      sede_id: sedeId,
    });

    setSaving(false);
    setSuccess(true);
    setNombre("");
    setWhatsapp("");
    setMonto("");
    setSedePago("");
    await cargar();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Ingresos</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
          <div className="text-3xl font-black text-green-500">
            {loading ? "…" : formatoColones(totales.hoy)}
          </div>
          <div className="mt-1 text-sm text-neutral-400">Ingresos hoy</div>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
          <div className="text-3xl font-black text-white">
            {loading ? "…" : formatoColones(totales.mes)}
          </div>
          <div className="mt-1 text-sm text-neutral-400">Ingresos este mes</div>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
          <div className="text-3xl font-black text-white">
            {loading ? "…" : formatoColones(totales.total)}
          </div>
          <div className="mt-1 text-sm text-neutral-400">Ingresos totales</div>
        </div>
      </div>

      <div className="mb-8 max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="mb-1 text-lg font-semibold">Registrar pago diario</h2>
        <p className="mb-4 text-sm text-neutral-400">
          Para clientes que pagan por día, sin registrarse a un plan.
        </p>

        <form onSubmit={handleRegistrarPago} className="flex flex-col gap-4">
          <input
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-red-600"
            placeholder="Nombre"
          />
          <input
            required
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-red-600"
            placeholder="Número de WhatsApp"
          />
          <input
            required
            type="number"
            min="1"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-red-600"
            placeholder="Monto pagado (₡)"
          />

          {selectedSedeId === "todas" && (
            <select
              required
              value={sedePago}
              onChange={(e) => setSedePago(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-red-600"
            >
              <option value="">Selecciona una sede</option>
              {sedes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-500">Pago registrado correctamente.</p>}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-red-600 py-2.5 font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Registrar pago"}
          </button>
        </form>
      </div>

      <h2 className="mb-3 text-lg font-semibold">Pagos recientes</h2>
      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-400">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Concepto</th>
              <th className="px-4 py-3">Método</th>
              {selectedSedeId === "todas" && <th className="px-4 py-3">Sede</th>}
              <th className="px-4 py-3">Monto</th>
            </tr>
          </thead>
          <tbody>
            {pagos.map((p) => (
              <tr key={p.id} className="border-t border-neutral-800">
                <td className="px-4 py-3 text-neutral-400">{p.fecha}</td>
                <td className="px-4 py-3">{p.nombre ?? "—"}</td>
                <td className="px-4 py-3 text-neutral-400">{p.concepto ?? "—"}</td>
                <td className="px-4 py-3 capitalize">{p.metodo}</td>
                {selectedSedeId === "todas" && (
                  <td className="px-4 py-3">{sedeNombre(p.sede_id)}</td>
                )}
                <td className="px-4 py-3 font-semibold text-green-400">
                  {formatoColones(Number(p.monto))}
                </td>
              </tr>
            ))}
            {!loading && pagos.length === 0 && (
              <tr>
                <td colSpan={selectedSedeId === "todas" ? 6 : 5} className="px-4 py-6 text-center text-neutral-500">
                  Todavía no hay pagos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
