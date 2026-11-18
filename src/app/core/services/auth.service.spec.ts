import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let servicio: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envía POST /auth/registro con los datos y guarda el token recibido', () => {
    const datos = { nombre: 'juan', email: 'juan@mail.com', password: 'clave12345' };
    const respuesta = { accessToken: 'abc123', tokenType: 'Bearer', email: 'juan@mail.com', rol: 'USUARIO' };
    let recibida: unknown;

    servicio.registrar(datos).subscribe((r) => (recibida = r));

    const req = http.expectOne(`${environment.apiUrl}/auth/registro`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(datos);
    req.flush(respuesta, { status: 201, statusText: 'Created' });

    expect(recibida).toEqual(respuesta);
    expect(localStorage.getItem('token')).toBe('abc123');
  });

  it('no guarda ningún token si la API responde con error', () => {
    servicio.registrar({ nombre: 'juan', email: 'juan@mail.com', password: 'clave12345' }).subscribe({
      error: () => undefined,
    });

    http
      .expectOne(`${environment.apiUrl}/auth/registro`)
      .flush({ detail: 'Ya existe un usuario registrado con ese email' }, { status: 409, statusText: 'Conflict' });

    expect(localStorage.getItem('token')).toBeNull();
  });
});
