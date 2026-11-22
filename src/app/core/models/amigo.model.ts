/** Amigo del usuario (AmigoResponse). equipoId es null si todavía no tiene equipo. */
export interface Amigo {
  id: number;
  nombre: string;
  equipoId: number | null;
}
