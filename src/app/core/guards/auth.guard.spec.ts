import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, provideRouter } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { authGuard, sinSesionGuard } from './auth.guard';

describe('guards de sesión', () => {
  const ruta = {} as ActivatedRouteSnapshot;
  const estado = {} as RouterStateSnapshot;

  const iniciarSesion = () =>
    TestBed.inject(AuthService).sesion.set({ token: 'abc123', email: 'juan@mail.com', rol: 'USUARIO' });

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('authGuard deja pasar si hay sesión iniciada', () => {
    iniciarSesion();

    expect(TestBed.runInInjectionContext(() => authGuard(ruta, estado))).toBe(true);
  });

  it('authGuard manda a /login si no hay sesión', () => {
    const resultado = TestBed.runInInjectionContext(() => authGuard(ruta, estado));

    expect(String(resultado)).toBe('/login');
  });

  it('sinSesionGuard deja pasar si no hay sesión', () => {
    expect(TestBed.runInInjectionContext(() => sinSesionGuard(ruta, estado))).toBe(true);
  });

  it('sinSesionGuard manda a /equipos si ya hay sesión iniciada', () => {
    iniciarSesion();

    const resultado = TestBed.runInInjectionContext(() => sinSesionGuard(ruta, estado));

    expect(String(resultado)).toBe('/equipos');
  });
});
