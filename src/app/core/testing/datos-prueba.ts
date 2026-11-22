import { SolicitudAmistad } from '../models/solicitud.model';
import { Amigo } from '../models/amigo.model';
import { EquipoDetalle } from '../models/equipo.model';
import { Pagina } from '../models/pagina.model';

/** Datos que se usan SOLO dentro de las pruebas automáticas; la aplicación nunca los importa. */
export function equipoDePrueba(cambios: Partial<EquipoDetalle> = {}): EquipoDetalle {
  return {
    id: 1,
    nombre: 'Los Halcones',
    descripcion: 'Jugamos los jueves',
    tipo: 'FUTBOL_5',
    cupo: 5,
    cantidadMiembros: 2,
    miembros: [
      { id: 3, nombre: 'juan' },
      { id: 4, nombre: 'pedro' },
    ],
    ...cambios,
  };
}

export function paginaDePrueba<T>(contenido: T[], cambios: Partial<Pagina<T>> = {}): Pagina<T> {
  return { contenido, pagina: 0, tamanio: 12, totalElementos: contenido.length, totalPaginas: 1, ...cambios };
}

export function amigoDePrueba(cambios: Partial<Amigo> = {}): Amigo {
  return { id: 9, nombre: 'lucas', equipoId: null, ...cambios };
}

export function solicitudDePrueba(cambios: Partial<SolicitudAmistad> = {}): SolicitudAmistad {
  return {
    id: 1,
    remitente: { id: 20, nombre: 'ana' },
    destinatario: { id: 3, nombre: 'juan' },
    estado: 'PENDIENTE',
    ...cambios,
  };
}
