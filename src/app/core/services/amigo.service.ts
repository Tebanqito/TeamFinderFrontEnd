import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Amigo } from '../models/amigo.model';

@Injectable({
  providedIn: 'root',
})
export class AmigoService {
  private readonly http = inject(HttpClient);

  /** GET /amigos: los amigos del usuario con el equipo al que pertenece cada uno. */
  listar(): Observable<Amigo[]> {
    return this.http.get<Amigo[]>(`${environment.apiUrl}/amigos`);
  }
}
