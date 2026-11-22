import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { EquipoCrearRequest, EquipoDetalle } from '../models/equipo.model';

@Injectable({
  providedIn: 'root',
})
export class EquipoService {
  private readonly http = inject(HttpClient);
  private readonly equiposUrl = `${environment.apiUrl}/equipos`;

  /** POST /equipos. El usuario que lo crea queda como primer integrante. */
  crear(datos: EquipoCrearRequest): Observable<EquipoDetalle> {
    return this.http.post<EquipoDetalle>(this.equiposUrl, datos);
  }

  /** GET /equipos/mio. La API responde 200 con el equipo, o 204 si el usuario todavía no pertenece a ninguno. */
  obtenerMio(): Observable<EquipoDetalle | null> {
    return this.http
      .get<EquipoDetalle>(`${this.equiposUrl}/mio`, { observe: 'response' })
      .pipe(map((respuesta) => respuesta.body));
  }
}
