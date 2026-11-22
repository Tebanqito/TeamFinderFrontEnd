import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { soloOwnerGuard } from './owner.guard';

describe('soloOwnerGuard', () => {
  const ruta = {} as ActivatedRouteSnapshot;
  const estado = {} as RouterStateSnapshot;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('deja pasar al owner', () => {
    TestBed.inject(AuthService).sesion.set({ token: 't', email: 'o@mail.com', rol: 'OWNER' });

    expect(TestBed.runInInjectionContext(() => soloOwnerGuard(ruta, estado))).toBe(true);
  });

  it('manda a un usuario común a /equipos', () => {
    TestBed.inject(AuthService).sesion.set({ token: 't', email: 'juan@mail.com', rol: 'USUARIO' });

    const resultado = TestBed.runInInjectionContext(() => soloOwnerGuard(ruta, estado));

    expect(TestBed.inject(Router).serializeUrl(resultado as UrlTree)).toBe('/equipos');
  });
});
