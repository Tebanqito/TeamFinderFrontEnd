import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Pagina } from '../models/pagina.model';
import { EstadoTorneo, Llave, Torneo, TorneoCrearRequest, TorneoResumen } from '../models/torneo.model';

@Injectable({
  providedIn: 'root',
})
export class TorneoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/torneos`;

  /** POST /torneos (solo owner). La API sortea los equipos completos del tipo elegido. */
  crear(datos: TorneoCrearRequest): Observable<Torneo> {
    return this.http.post<Torneo>(this.url, datos);
  }

  /** GET /torneos/activo. La API responde 404 si no hay uno: acá eso se convierte en null. */
  obtenerActivo(): Observable<Torneo | null> {
    return this.http.get<Torneo>(`${this.url}/activo`).pipe(
      catchError((err: HttpErrorResponse) => (err.status === 404 ? of(null) : throwError(() => err))),
    );
  }

  /** GET /torneos/{id}. */
  obtener(id: number): Observable<Torneo> {
    return this.http.get<Torneo>(`${this.url}/${id}`);
  }

  /** GET /torneos/{id}/llaves: rondas y cruces ya calculados, con el campeón si lo hay. */
  obtenerLlaves(id: number): Observable<Llave> {
    return this.http.get<Llave>(`${this.url}/${id}/llaves`);
  }

  /** GET /torneos, los más recientes primero (la página empieza en 0). */
  listar(estado: EstadoTorneo | null, pagina: number, tamanio: number): Observable<Pagina<TorneoResumen>> {
    let params = new HttpParams().set('page', pagina).set('size', tamanio);
    if (estado) {
      params = params.set('estado', estado);
    }
    return this.http.get<Pagina<TorneoResumen>>(this.url, { params });
  }

  /** PATCH /torneos/{id} (solo owner). Lo único que se puede hacer es finalizarlo. */
  finalizar(id: number): Observable<Torneo> {
    return this.http.patch<Torneo>(`${this.url}/${id}`, { estado: 'FINALIZADO' });
  }
}
