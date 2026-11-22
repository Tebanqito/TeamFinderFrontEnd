/** Usuario del sistema, tal como lo ve el owner (UsuarioResponse). */
export interface UsuarioDetalle {
  id: number;
  nombre: string;
  email: string;
  rol: 'USUARIO' | 'OWNER';
  equipoId: number | null;
  equipoNombre: string | null;
}
