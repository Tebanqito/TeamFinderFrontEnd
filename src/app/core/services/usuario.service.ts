import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Pagina } from '../models/pagina.model';
import { UsuarioDetalle } from '../models/usuario.model';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/usuarios`;

  /** GET /usuarios (solo owner): búsqueda por nombre, sin importar mayúsculas, con paginación desde 0. */
  listar(nombre: string, pagina: number, tamanio: number): Observable<Pagina<UsuarioDetalle>> {
    let params = new HttpParams().set('page', pagina).set('size', tamanio);
    if (nombre.trim()) {
      params = params.set('nombre', nombre.trim());
    }
    return this.http.get<Pagina<UsuarioDetalle>>(this.url, { params });
  }

  /** DELETE /usuarios/{id} (solo owner). Si tenía equipo, lo deja; sus amistades y solicitudes se borran. */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
