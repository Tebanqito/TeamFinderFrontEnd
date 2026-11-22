import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { EstadoSolicitud, ResultadoEnvio, SolicitudAmistad } from '../models/solicitud.model';

@Injectable({
  providedIn: 'root',
})
export class SolicitudService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/solicitudes-amistad`;

  /** POST /solicitudes-amistad. Se identifica al destinatario por su nombre de usuario. */
  enviar(nombreDestinatario: string): Observable<ResultadoEnvio> {
    return this.http.post<SolicitudAmistad>(this.url, { nombreDestinatario }, { observe: 'response' }).pipe(
      map((respuesta) => ({
        solicitud: respuesta.body as SolicitudAmistad,
        aceptadaAutomaticamente: respuesta.status === 200,
      })),
    );
  }

  /** GET /solicitudes-amistad/recibidas: por defecto, las pendientes de respuesta. */
  recibidas(): Observable<SolicitudAmistad[]> {
    return this.http.get<SolicitudAmistad[]>(`${this.url}/recibidas`);
  }

  /** GET /solicitudes-amistad/enviadas: todas, con su estado. */
  enviadas(): Observable<SolicitudAmistad[]> {
    return this.http.get<SolicitudAmistad[]>(`${this.url}/enviadas`);
  }

  /** PATCH /solicitudes-amistad/{id}. Solo el destinatario puede aceptar o rechazar. */
  responder(id: number, estado: Exclude<EstadoSolicitud, 'PENDIENTE'>): Observable<SolicitudAmistad> {
    return this.http.patch<SolicitudAmistad>(`${this.url}/${id}`, { estado });
  }
}
