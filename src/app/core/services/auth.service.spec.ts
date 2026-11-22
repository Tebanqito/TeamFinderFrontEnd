import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

const respuesta = { accessToken: 'abc123', tokenType: 'Bearer', email: 'juan@mail.com', nombre: 'juan', rol: 'USUARIO' };

/** Arma un JWT de prueba con la fecha de vencimiento indicada (en segundos). */
const jwtConVencimiento = (exp: number) => `cabecera.${btoa(JSON.stringify({ sub: 'juan@mail.com', exp }))}.firma`;
const enUnaHora = () => Math.floor(Date.now() / 1000) + 3600;
const haceUnaHora = () => Math.floor(Date.now() / 1000) - 3600;

describe('AuthService', () => {
  let http: HttpTestingController;

  const crearServicio = (): AuthService => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    return TestBed.inject(AuthService);
  };

  beforeEach(() => localStorage.clear());

  afterEach(() => http.verify());

  it('registrar envía POST /auth/registro y guarda la sesión', () => {
    const servicio = crearServicio();
    const datos = { nombre: 'juan', email: 'juan@mail.com', password: 'clave12345' };
    let recibida: unknown;

    servicio.registrar(datos).subscribe((r) => (recibida = r));

    const req = http.expectOne(`${environment.apiUrl}/auth/registro`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(datos);
    req.flush(respuesta, { status: 201, statusText: 'Created' });

    expect(recibida).toEqual(respuesta);
    expect(localStorage.getItem('token')).toBe('abc123');
    expect(servicio.sesion()).toEqual({ token: 'abc123', email: 'juan@mail.com', nombre: 'juan', rol: 'USUARIO' });
    expect(localStorage.getItem('nombre')).toBe('juan');
    expect(servicio.estaLogueado()).toBe(true);
  });

  it('login envía POST /auth/login y guarda token, email, nombre y rol', () => {
    const servicio = crearServicio();
    const credenciales = { email: 'juan@mail.com', password: 'clave12345' };

    servicio.login(credenciales).subscribe();

    const req = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(credenciales);
    req.flush(respuesta);

    expect(localStorage.getItem('token')).toBe('abc123');
    expect(localStorage.getItem('email')).toBe('juan@mail.com');
    expect(localStorage.getItem('nombre')).toBe('juan');
    expect(localStorage.getItem('rol')).toBe('USUARIO');
    expect(servicio.sesion()?.rol).toBe('USUARIO');
  });

  it('no guarda ninguna sesión si la API responde con error', () => {
    const servicio = crearServicio();
    servicio.login({ email: 'juan@mail.com', password: 'mala' }).subscribe({ error: () => undefined });

    http
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush({ detail: 'Credenciales inválidas' }, { status: 401, statusText: 'Unauthorized' });

    expect(localStorage.getItem('token')).toBeNull();
    expect(servicio.sesion()).toBeNull();
    expect(servicio.estaLogueado()).toBe(false);
  });

  it('logout borra la sesión del navegador', () => {
    const servicio = crearServicio();
    servicio.login({ email: 'juan@mail.com', password: 'clave12345' }).subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush(respuesta);

    servicio.logout();

    expect(servicio.sesion()).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('email')).toBeNull();
    expect(localStorage.getItem('rol')).toBeNull();
  });

  it('recupera la sesión guardada al abrir la página', () => {
    localStorage.setItem('token', jwtConVencimiento(enUnaHora()));
    localStorage.setItem('email', 'owner@matchfinder.com');
    localStorage.setItem('nombre', 'owner');
    localStorage.setItem('rol', 'OWNER');

    const servicio = crearServicio();

    expect(servicio.sesion()?.email).toBe('owner@matchfinder.com');
    expect(servicio.sesion()?.nombre).toBe('owner');
    expect(servicio.sesion()?.rol).toBe('OWNER');
  });

  it('descarta la sesión guardada si el token ya venció', () => {
    localStorage.setItem('token', jwtConVencimiento(haceUnaHora()));
    localStorage.setItem('email', 'owner@matchfinder.com');
    localStorage.setItem('rol', 'OWNER');

    const servicio = crearServicio();

    expect(servicio.sesion()).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('conserva la sesión si el token no se puede leer', () => {
    localStorage.setItem('token', 'no-es-un-jwt');
    localStorage.setItem('email', 'juan@mail.com');
    localStorage.setItem('rol', 'USUARIO');

    expect(crearServicio().sesion()?.token).toBe('no-es-un-jwt');
  });

  it('no hay sesión si falta alguno de los datos guardados', () => {
    localStorage.setItem('token', 'abc123');

    expect(crearServicio().sesion()).toBeNull();
  });
});
