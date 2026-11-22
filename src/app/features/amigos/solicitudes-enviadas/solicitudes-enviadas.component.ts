import { Component, input } from '@angular/core';

import { SolicitudAmistad } from '../../../core/models/solicitud.model';

/** Solicitudes que envió el usuario, con su estado (pendiente, aceptada o rechazada). */
@Component({
  selector: 'app-solicitudes-enviadas',
  styles: `
    p .badge {
      margin-left: 0.5rem;
    }
  `,
  templateUrl: './solicitudes-enviadas.component.html',
})
export class SolicitudesEnviadasComponent {
  readonly solicitudes = input.required<SolicitudAmistad[]>();
}
