export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  RESIDENTE: 'RESIDENTE',
  SEGURIDAD: 'SEGURIDAD',
});

export const TICKET_STATUSES = Object.freeze({
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En proceso',
  RESUELTO: 'Resuelto',
  CERRADO: 'Cerrado',
});

export const RESERVATION_STATUSES = Object.freeze({
  PENDIENTE: 'Pendiente',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  CANCELADA: 'Cancelada',
});

export const AREA_STATUSES = Object.freeze({
  DISPONIBLE: 'Disponible',
  OCUPADA: 'Ocupada',
  MANTENIMIENTO: 'Mantenimiento',
});

export const USER_STATUSES = Object.freeze({
  ACTIVO: 'ACTIVO',
  INACTIVO: 'INACTIVO',
  PENDIENTE: 'PENDIENTE',
});

export const PRIORITIES = Object.freeze({
  ALTA: 'Alta',
  MEDIA: 'Media',
  BAJA: 'Baja',
});

export const DOCUMENT_TYPES = Object.freeze({
  REGLAMENTO: 'Reglamento',
  ACTA: 'Acta',
  CIRCULAR: 'Circular',
  CONTRATO: 'Contrato',
  OTRO: 'Otro',
});

export const PARCEL_STATUSES = Object.freeze({
  PENDIENTE: 'PENDIENTE',
  ENTREGADO: 'ENTREGADO',
  DEVUELTO: 'DEVUELTO',
});

export const LOG_ACTIONS = Object.freeze({
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
});

export const NOTIFICATION_TYPES = Object.freeze({
  INFO: 'info',
  WARNING: 'warning',
  SUCCESS: 'success',
  ERROR: 'error',
});
