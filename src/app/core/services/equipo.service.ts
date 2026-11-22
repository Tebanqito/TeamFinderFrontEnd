import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { EquipoCrearRequest, EquipoDetalle, EquipoEditarRequest, FiltrosEquipos } from '../models/equipo.model';
import { Pagina } from '../models/pagina.model';

@Injectable({
  providedIn: 'root',
})
export class EquipoService {
  private readonly http = inject(HttpClient);
  private readonly equiposUrl = `${environment.apiUrl}/equipos`;

  /** GET /equipos con filtros opcionales y paginación (la página empieza en 0). */
  listar(filtros: FiltrosEquipos, pagina: number, tamanio: number): Observable<Pagina<EquipoDetalle>> {
    let params = new HttpParams().set('page', pagina).set('size', tamanio);
    if (filtros.tipo) {
      params = params.set('tipo', filtros.tipo);
    }
    if (filtros.nombre.trim()) {
      params = params.set('nombre', filtros.nombre.trim());
    }
    if (filtros.conCupo) {
      params = params.set('conCupo', true);
    }
    return this.http.get<Pagina<EquipoDetalle>>(this.equiposUrl, { params });
  }

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

  /** PATCH /equipos/{id}. Cualquier integrante puede editar nombre y descripción. */
  editar(id: number, cambios: EquipoEditarRequest): Observable<EquipoDetalle> {
    return this.http.patch<EquipoDetalle>(`${this.equiposUrl}/${id}`, cambios);
  }

  /** POST /equipos/{id}/miembros: el usuario se une al equipo si hay cupo. */
  unirse(id: number): Observable<EquipoDetalle> {
    return this.http.post<EquipoDetalle>(`${this.equiposUrl}/${id}/miembros`, {});
  }

  /** POST /equipos/{id}/miembros/{usuarioId}: suma directamente a un amigo, sin que tenga que aceptar. */
  agregarAmigo(id: number, usuarioId: number): Observable<EquipoDetalle> {
    return this.http.post<EquipoDetalle>(`${this.equiposUrl}/${id}/miembros/${usuarioId}`, {});
  }

  /** DELETE /equipos/{id}/miembros/me. Si el equipo queda vacío, la API lo elimina. */
  abandonar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.equiposUrl}/${id}/miembros/me`);
  }

  /** DELETE /equipos/{id}. Solo el owner; los integrantes quedan sin equipo. */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.equiposUrl}/${id}`);
  }
}
