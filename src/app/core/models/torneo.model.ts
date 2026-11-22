import { TipoEquipo } from './equipo.model';

export type EstadoTorneo = 'ACTIVO' | 'FINALIZADO';

export interface EquipoResumen {
  id: number;
  nombre: string;
}

/** Cuerpo de POST /torneos. Equivale al TorneoCreateRequest de la API. */
export interface TorneoCrearRequest {
  nombre: string;
  tipo: TipoEquipo;
  cantidadEquipos: number;
}

/** Torneo con los equipos sorteados, en el orden del sorteo (TorneoResponse). */
export interface Torneo {
  id: number;
  nombre: string;
  tipo: TipoEquipo;
  cantidadEquipos: number;
  estado: EstadoTorneo;
  equipos: EquipoResumen[];
}

/** Fila del historial. El campeón es null mientras la final no tenga resultado (TorneoResumenResponse). */
export interface TorneoResumen {
  id: number;
  nombre: string;
  tipo: TipoEquipo;
  cantidadEquipos: number;
  estado: EstadoTorneo;
  campeon: EquipoResumen | null;
}

/** Un cruce de la llave. Los equipos son null mientras no se sepa quién llega. */
export interface Cruce {
  posicion: number;
  equipoUno: EquipoResumen | null;
  equipoDos: EquipoResumen | null;
  paseDirecto: boolean;
  /** Null mientras el cruce no tiene resultado. */
  partidoId: number | null;
  ganador: EquipoResumen | null;
}

export interface Ronda {
  numero: number;
  /** "Final", "Semifinales", "Cuartos de final", ... */
  nombre: string;
  cruces: Cruce[];
}

/** Llaves de eliminación directa ya calculadas por la API (LlaveResponse). */
export interface Llave {
  torneoId: number;
  nombre: string;
  tipo: TipoEquipo;
  estado: EstadoTorneo;
  rondas: Ronda[];
  campeon: EquipoResumen | null;
}

/** Cuerpo de POST /torneos/{id}/partidos: el resultado de un cruce. */
export interface PartidoCrearRequest {
  equipoUnoId: number;
  equipoDosId: number;
  ganadorId: number;
}
