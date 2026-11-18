import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegistroRequest, Sesion } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authUrl = `${environment.apiUrl}/auth`;

  /** Sesión actual; null si nadie inició sesión. Se recupera del navegador al abrir la página. */
  readonly sesion = signal<Sesion | null>(this.leerSesionGuardada());
  readonly estaLogueado = computed(() => this.sesion() !== null);

  /** POST /auth/registro. La API devuelve el token del usuario recién creado (siempre con rol USUARIO). */
  registrar(datos: RegistroRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.authUrl}/registro`, datos)
      .pipe(tap((respuesta) => this.guardarSesion(respuesta)));
  }

  /** POST /auth/login. Si las credenciales son correctas, la API devuelve el token JWT. */
  login(credenciales: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.authUrl}/login`, credenciales)
      .pipe(tap((respuesta) => this.guardarSesion(respuesta)));
  }

  logout(): void {
    this.borrarSesionGuardada();
    this.sesion.set(null);
  }

  /** El token se guarda con la clave "token", que es la que lee el jwtInterceptor. */
  private guardarSesion(respuesta: AuthResponse): void {
    localStorage.setItem('token', respuesta.accessToken);
    localStorage.setItem('email', respuesta.email);
    localStorage.setItem('rol', respuesta.rol);
    this.sesion.set({ token: respuesta.accessToken, email: respuesta.email, rol: respuesta.rol });
  }

  private leerSesionGuardada(): Sesion | null {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    const rol = localStorage.getItem('rol');
    if (!token || !email || !rol) {
      return null;
    }
    if (this.estaVencido(token)) {
      // Todavía se está armando la señal "sesion", por eso acá no se puede llamar a logout()
      this.borrarSesionGuardada();
      return null;
    }
    return { token, email, rol };
  }

  private borrarSesionGuardada(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('rol');
  }

  /** Mira la fecha de vencimiento (exp) del JWT. Si no se puede leer, se asume que sigue vigente. */
  private estaVencido(token: string): boolean {
    try {
      const payload = token.split('.')[1];
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      const exp = (JSON.parse(json) as { exp?: number }).exp;
      return typeof exp === 'number' && exp * 1000 <= Date.now();
    } catch {
      return false;
    }
  }
}
