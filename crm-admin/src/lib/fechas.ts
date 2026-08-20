function aISO(d: Date): string {
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/**
 * Hoy en la zona horaria del dispositivo, no en UTC.
 *
 * `new Date().toISOString()` devuelve la fecha UTC, así que en Costa Rica
 * (UTC-6) a partir de las 6pm ya reporta el día siguiente. El gimnasio
 * cierra a las 9pm, así que todo lo registrado en la noche quedaba fechado
 * un día adelante.
 */
export function hoyISO(): string {
  return aISO(new Date());
}

export function addDias(fechaISO: string, dias: number): string {
  const [a, m, d] = fechaISO.split("-").map(Number);
  const f = new Date(a, m - 1, d);
  f.setDate(f.getDate() + dias);
  return aISO(f);
}

/**
 * Suma meses de calendario conservando el día. Si el mes destino no tiene
 * ese día (31 de enero + 1 mes), cae al último día: 28 de febrero.
 */
export function addMeses(fechaISO: string, meses: number): string {
  const [a, m, d] = fechaISO.split("-").map(Number);
  const f = new Date(a, m - 1 + meses, 1);
  const ultimoDia = new Date(f.getFullYear(), f.getMonth() + 1, 0).getDate();
  f.setDate(Math.min(d, ultimoDia));
  return aISO(f);
}

/**
 * Vencimiento de un plan a partir de una fecha.
 *
 * Los planes de 30 días vencen el mismo día del mes siguiente, no a los 30
 * días exactos: registrado el 5 de agosto, vence el 5 de septiembre. Con
 * días exactos caería el 4, y en febrero se pasaría al 7 de marzo.
 *
 * Semanal (7) y Quincenal (15) se siguen sumando como días.
 */
export function calcularVencimiento(desdeISO: string, duracionDias: number): string {
  return duracionDias % 30 === 0
    ? addMeses(desdeISO, duracionDias / 30)
    : addDias(desdeISO, duracionDias);
}
