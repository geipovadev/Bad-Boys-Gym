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
