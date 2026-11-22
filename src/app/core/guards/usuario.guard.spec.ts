import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, provideRouter } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { soloUsuarioGuard } from './usuario.guard';

describe('soloUsuarioGuard', () => {
  const ruta = {} as ActivatedRouteSnapshot;
  const estado = {} as RouterStateSnapshot;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('deja pasar a un usuario', () => {
    TestBed.inject(AuthService).sesion.set({ token: 't', email: 'juan@mail.com', rol: 'USUARIO' });

    expect(TestBed.runInInjectionContext(() => soloUsuarioGuard(ruta, estado))).toBe(true);
  });

  it('manda al owner a /equipos', () => {
    TestBed.inject(AuthService).sesion.set({ token: 't', email: 'owner@mail.com', rol: 'OWNER' });

    const resultado = TestBed.runInInjectionContext(() => soloUsuarioGuard(ruta, estado));

    expect(TestBed.inject(Router).serializeUrl(resultado as ReturnType<Router['createUrlTree']>)).toBe('/equipos');
  });
});
