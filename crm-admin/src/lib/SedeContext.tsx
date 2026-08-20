"use client";

import { createContext, useContext } from "react";
import type { AdminProfile, Sede } from "./types";

export type SedeContextValue = {
  profile: AdminProfile;
  sedes: Sede[];
  selectedSedeId: string | "todas";
  setSelectedSedeId: (id: string | "todas") => void;
  /** Cambia cada vez que se pulsa Actualizar. Las pantallas lo llevan en
   *  las dependencias de su useEffect para recargar sus datos. */
  refreshToken: number;
  refrescar: () => void;
};

export const SedeContext = createContext<SedeContextValue | null>(null);

export function useSede() {
  const ctx = useContext(SedeContext);
  if (!ctx) throw new Error("useSede debe usarse dentro de SedeContext.Provider");
  return ctx;
}
