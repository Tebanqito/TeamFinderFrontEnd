import { UsuarioDetalle } from '../models/usuario.model';
import { Llave, Torneo, TorneoResumen } from '../models/torneo.model';
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

export function torneoDePrueba(cambios: Partial<Torneo> = {}): Torneo {
  return {
    id: 1,
    nombre: 'Copa Apertura',
    tipo: 'FUTBOL_5',
    cantidadEquipos: 4,
    estado: 'ACTIVO',
    equipos: [
      { id: 1, nombre: 'Halcones' },
      { id: 2, nombre: 'Tigres' },
      { id: 3, nombre: 'Pumas' },
      { id: 4, nombre: 'Leones' },
    ],
    ...cambios,
  };
}

/** Llave de 4 equipos sin resultados: semifinales Halcones-Leones y Tigres-Pumas. */
export function llaveDePrueba(cambios: Partial<Llave> = {}): Llave {
  const [halcones, tigres, pumas, leones] = torneoDePrueba().equipos;
  return {
    torneoId: 1,
    nombre: 'Copa Apertura',
    tipo: 'FUTBOL_5',
    estado: 'ACTIVO',
    campeon: null,
    rondas: [
      {
        numero: 1,
        nombre: 'Semifinales',
        cruces: [
          { posicion: 1, equipoUno: halcones, equipoDos: leones, paseDirecto: false, partidoId: null, ganador: null },
          { posicion: 2, equipoUno: tigres, equipoDos: pumas, paseDirecto: false, partidoId: null, ganador: null },
        ],
      },
      {
        numero: 2,
        nombre: 'Final',
        cruces: [{ posicion: 1, equipoUno: null, equipoDos: null, paseDirecto: false, partidoId: null, ganador: null }],
      },
    ],
    ...cambios,
  };
}

export function torneoResumenDePrueba(cambios: Partial<TorneoResumen> = {}): TorneoResumen {
  return { id: 1, nombre: 'Copa Apertura', tipo: 'FUTBOL_5', cantidadEquipos: 4, estado: 'FINALIZADO', campeon: null, ...cambios };
}

export function usuarioDePrueba(cambios: Partial<UsuarioDetalle> = {}): UsuarioDetalle {
  return { id: 3, nombre: 'juan', email: 'juan@mail.com', rol: 'USUARIO', equipoId: null, equipoNombre: null, ...cambios };
}
