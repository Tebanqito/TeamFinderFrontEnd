import { UsuarioResumen } from './equipo.model';

export type EstadoSolicitud = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';

/** Solicitud de amistad (SolicitudAmistadResponse). */
export interface SolicitudAmistad {
  id: number;
  remitente: UsuarioResumen;
  destinatario: UsuarioResumen;
  estado: EstadoSolicitud;
}

/** Resultado de enviar una solicitud: la API responde 201 si queda pendiente, o 200 si la otra persona ya te había enviado una y se aceptó sola. */
export interface ResultadoEnvio {
  solicitud: SolicitudAmistad;
  aceptadaAutomaticamente: boolean;
}
