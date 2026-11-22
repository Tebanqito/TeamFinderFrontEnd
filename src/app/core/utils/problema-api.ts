import { HttpErrorResponse } from '@angular/common/http';

export const MENSAJE_SIN_CONEXION = 'No se pudo conectar con el servidor. Revisá que la API esté encendida.';

/** Error de la API (formato Problem Details) ya interpretado. */
export interface ProblemaApi {
  sinConexion: boolean;
  status: number;
  detalle: string;
  /** Solo en los 400 de validación: qué campo falló y por qué. */
  errores: Record<string, string> | null;
}

export function leerProblema(err: HttpErrorResponse): ProblemaApi {
  const cuerpo = (err.error ?? {}) as { detail?: string; errores?: Record<string, string> };
  return {
    sinConexion: err.status === 0,
    status: err.status,
    detalle: cuerpo.detail ?? 'Ocurrió un error inesperado. Probá de nuevo más tarde.',
    errores: cuerpo.errores ?? null,
  };
}

/** Mensaje listo para mostrar al usuario ante cualquier error de la API. */
export function mensajeDeError(err: HttpErrorResponse): string {
  const problema = leerProblema(err);
  return problema.sinConexion ? MENSAJE_SIN_CONEXION : problema.detalle;
}
