import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PartidoCrearRequest } from '../models/torneo.model';

@Injectable({
  providedIn: 'root',
})
export class PartidoService {
  private readonly http = inject(HttpClient);

  /** POST /torneos/{id}/partidos (solo owner): carga quién ganó un cruce. */
  registrar(torneoId: number, resultado: PartidoCrearRequest): Observable<unknown> {
    return this.http.post(`${environment.apiUrl}/torneos/${torneoId}/partidos`, resultado);
  }

  /** DELETE /torneos/{id}/partidos/{partidoId} (solo owner). También borra los resultados de rondas posteriores que dependían de este. */
  eliminar(torneoId: number, partidoId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/torneos/${torneoId}/partidos/${partidoId}`);
  }
}
