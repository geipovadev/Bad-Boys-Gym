"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useSede } from "@/lib/SedeContext";
import type { Contacto, Sede } from "@/lib/types";

const TABS: { key: Contacto["origen"] | "todos"; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "registro_miembro", label: "Registro de membresía" },
  { key: "boton_whatsapp", label: "Botón de WhatsApp" },
  { key: "pago_diario", label: "Pago diario" },
];

export default function ContactosPage() {
  const router = useRouter();
  const { profile, sedes } = useSede();

  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [tab, setTab] = useState<Contacto["origen"] | "todos">("todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile.rol !== "super_admin") {
      router.replace("/dashboard");
    }
  }, [profile, router]);

  useEffect(() => {
    async function cargar() {
      setLoading(true);
      const { data } = await supabase
        .from("contactos")
        .select("*")
        .order("created_at", { ascending: false });
      setContactos((data ?? []) as Contacto[]);
      setLoading(false);
    }
    cargar();
  }, []);

  const filtrados = useMemo(
    () => (tab === "todos" ? contactos : contactos.filter((c) => c.origen === tab)),
    [contactos, tab]
  );

  function sedeNombre(id: string | null) {
    return sedes.find((s: Sede) => s.id === id)?.nombre ?? "—";
  }

  if (profile.rol !== "super_admin") return null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Contactos</h1>
      <p className="mb-6 max-w-2xl text-sm text-neutral-400">
        Todas las personas que dejaron su nombre y WhatsApp, ya sea al registrarse a un
        plan o al escribir por el botón de WhatsApp. Úsalos para promociones y redes
        sociales.
      </p>

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
              <th className="px-4 py-3">WhatsApp</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Origen</th>
              <th className="px-4 py-3">Sede</th>
              <th className="px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((c) => (
              <tr key={c.id} className="border-t border-neutral-800">
                <td className="px-4 py-3">{c.nombre}</td>
                <td className="px-4 py-3">
                  <a
                    href={`https://wa.me/${c.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener"
                    className="text-green-400 hover:underline"
                  >
                    {c.whatsapp}
                  </a>
                </td>
                <td className="px-4 py-3 text-neutral-400">{c.correo ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      c.origen === "registro_miembro"
                        ? "bg-red-600/20 text-red-400"
                        : c.origen === "pago_diario"
                          ? "bg-blue-600/20 text-blue-400"
                          : "bg-green-600/20 text-green-400"
                    }`}
                  >
                    {c.origen === "registro_miembro"
                      ? "Registro"
                      : c.origen === "pago_diario"
                        ? "Pago diario"
                        : "WhatsApp"}
                  </span>
                </td>
                <td className="px-4 py-3">{sedeNombre(c.sede_id)}</td>
                <td className="px-4 py-3 text-neutral-400">
                  {new Date(c.created_at).toLocaleDateString("es-CR")}
                </td>
              </tr>
            ))}
            {!loading && filtrados.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-500">
                  No hay contactos en este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
