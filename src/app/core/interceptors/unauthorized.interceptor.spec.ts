import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { unauthorizedInterceptor } from './unauthorized.interceptor';

describe('unauthorizedInterceptor', () => {
  const navegar = vi.fn();
  let cliente: HttpClient;
  let http: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    localStorage.clear();
    navegar.mockReset();
    navegar.mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([unauthorizedInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate: navegar } },
      ],
    });
    cliente = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    authService.sesion.set({ token: 'abc123', email: 'juan@mail.com', rol: 'USUARIO' });
  });

  afterEach(() => http.verify());

  it('cierra la sesión y vuelve a /login cuando la API responde 401', () => {
    let error: unknown;
    cliente.get('/api/v1/equipos').subscribe({ error: (e) => (error = e) });

    http.expectOne('/api/v1/equipos').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(authService.sesion()).toBeNull();
    expect(navegar).toHaveBeenCalledWith(['/login']);
    expect(error).toBeDefined();
  });

  it('no toca la sesión si el 401 viene de /auth (credenciales incorrectas)', () => {
    cliente.post('/api/v1/auth/login', {}).subscribe({ error: () => undefined });

    http.expectOne('/api/v1/auth/login').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(authService.sesion()).not.toBeNull();
    expect(navegar).not.toHaveBeenCalled();
  });

  it('no toca la sesión con otros errores, como un 403', () => {
    cliente.get('/api/v1/equipos').subscribe({ error: () => undefined });

    http.expectOne('/api/v1/equipos').flush({}, { status: 403, statusText: 'Forbidden' });

    expect(authService.sesion()).not.toBeNull();
    expect(navegar).not.toHaveBeenCalled();
  });
});
