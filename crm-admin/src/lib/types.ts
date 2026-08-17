export type Sede = {
  id: string;
  nombre: string;
  activa: boolean;
};

export type Plan = {
  id: string;
  nombre: string;
  precio: number;
  duracion_dias: number;
  categoria: "principal" | "promocion";
  recomendado: boolean;
  activo: boolean;
};

export type AdminProfile = {
  id: string;
  nombre: string;
  username: string;
  rol: "super_admin" | "instructor";
  sede_id: string | null;
};

export type Estado = "pendiente" | "activo" | "por_vencer" | "vencido" | "inactivo";

export type MetodoPago = "sinpe" | "efectivo";

export type Contacto = {
  id: string;
  nombre: string;
  whatsapp: string;
  correo: string | null;
  origen: "registro_miembro" | "boton_whatsapp" | "pago_diario" | "sesion_gratis";
  sede_id: string | null;
  notas: string | null;
  created_at: string;
};

export type Pago = {
  id: string;
  miembro_id: string | null;
  sede_id: string;
  nombre: string | null;
  whatsapp: string | null;
  concepto: string | null;
  monto: number;
  metodo: MetodoPago;
  fecha: string;
  registrado_por: string | null;
  created_at: string;
};

export type EstadoSesion = "pendiente" | "asistio" | "no_asistio";

export type SesionGratis = {
  id: string;
  nombre: string;
  correo: string;
  telefono: string;
  sede_id: string;
  fecha: string;
  hora: string;
  estado: EstadoSesion;
  notas: string | null;
  created_at: string;
};

export type Miembro = {
  id: string;
  sede_id: string;
  plan_id: string;
  nombre: string;
  apellido: string;
  correo: string;
  whatsapp: string;
  metodo_pago: MetodoPago;
  estado_pago: "pendiente" | "confirmado";
  activo: boolean;
  fecha_inicio: string | null;
  fecha_vencimiento: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
  estado: Estado;
};
