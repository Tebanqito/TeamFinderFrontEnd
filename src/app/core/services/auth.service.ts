import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthResponse, RegistroRequest } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authUrl = `${environment.apiUrl}/auth`;

  /**
   * POST /auth/registro. La API devuelve el token del usuario recién creado
   * (siempre con rol USUARIO) y se guarda para que el interceptor lo envíe en cada petición.
   */
  registrar(datos: RegistroRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authUrl}/registro`, datos).pipe(
      tap((respuesta) => {
        localStorage.setItem('token', respuesta.accessToken);
      }),
    );
  }
}
