import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, output, signal } from '@angular/core';

import { EstadoSolicitud, SolicitudAmistad } from '../../../core/models/solicitud.model';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { SolicitudService } from '../../../core/services/solicitud.service';
import { mensajeDeError } from '../../../core/utils/problema-api';

/** Solicitudes pendientes que recibió el usuario, con los botones Aceptar y Rechazar. */
@Component({
  selector: 'app-solicitudes-recibidas',
  styles: `
    p .btn {
      margin-left: 0.5rem;
    }
  `,
  templateUrl: './solicitudes-recibidas.component.html',
})
export class SolicitudesRecibidasComponent {
  private readonly solicitudService = inject(SolicitudService);
  private readonly notificaciones = inject(NotificacionService);

  readonly solicitudes = input.required<SolicitudAmistad[]>();

  /** Se respondió una solicitud (o ya estaba respondida): hay que refrescar las listas. */
  readonly respondida = output<void>();

  /** Id de la solicitud que se está respondiendo, para bloquear sus botones. */
  protected readonly respondiendoId = signal<number | null>(null);

  protected responder(solicitud: SolicitudAmistad, estado: Exclude<EstadoSolicitud, 'PENDIENTE'>): void {
    this.respondiendoId.set(solicitud.id);
    this.solicitudService.responder(solicitud.id, estado).subscribe({
      next: () => {
        this.respondiendoId.set(null);
        this.notificaciones.exito(
          estado === 'ACEPTADA'
            ? `Ahora ${solicitud.remitente.nombre} es tu amigo.`
            : `Rechazaste la solicitud de ${solicitud.remitente.nombre}.`,
        );
        this.respondida.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.respondiendoId.set(null);
        this.notificaciones.error(mensajeDeError(err));
        // Por ejemplo "La solicitud ya fue respondida": se refresca para que desaparezca
        this.respondida.emit();
      },
    });
  }
}
