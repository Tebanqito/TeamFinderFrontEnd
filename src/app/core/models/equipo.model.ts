export type TipoEquipo = 'FUTBOL_5' | 'FUTBOL_11';

/** Opciones de tipo de equipo; el cupo cuenta al creador. */
export const TIPOS_EQUIPO: { valor: TipoEquipo; nombre: string; cupo: number }[] = [
  { valor: 'FUTBOL_5', nombre: 'Fútbol 5', cupo: 5 },
  { valor: 'FUTBOL_11', nombre: 'Fútbol 11', cupo: 11 },
];

export function nombreDeTipo(tipo: TipoEquipo): string {
  return TIPOS_EQUIPO.find((t) => t.valor === tipo)?.nombre ?? tipo;
}

/** Cuerpo de POST /equipos. Equivale al EquipoCreateRequest de la API. */
export interface EquipoCrearRequest {
  nombre: string;
  descripcion: string;
  tipo: TipoEquipo;
}

export interface UsuarioResumen {
  id: number;
  nombre: string;
}

/** Equipo con sus integrantes (EquipoDetalleResponse). */
export interface EquipoDetalle {
  id: number;
  nombre: string;
  descripcion: string;
  tipo: TipoEquipo;
  cupo: number;
  cantidadMiembros: number;
  miembros: UsuarioResumen[];
}

/** Filtros del listado de equipos (GET /equipos). */
export interface FiltrosEquipos {
  tipo: '' | TipoEquipo;
  nombre: string;
  conCupo: boolean;
}

/** Cuerpo de PATCH /equipos/{id}: solo se envía lo que cambia. */
export interface EquipoEditarRequest {
  nombre?: string;
  descripcion?: string;
}
