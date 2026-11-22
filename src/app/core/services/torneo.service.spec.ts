import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { Torneo } from '../models/torneo.model';
import { llaveDePrueba, paginaDePrueba, torneoDePrueba } from '../testing/datos-prueba';
import { TorneoService } from './torneo.service';

describe('TorneoService', () => {
  const base = `${environment.apiUrl}/torneos`;
  let servicio: TorneoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(TorneoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('crear envía POST /torneos con nombre, tipo y cantidad', () => {
    const datos = { nombre: 'Copa', tipo: 'FUTBOL_5' as const, cantidadEquipos: 8 };
    servicio.crear(datos).subscribe();

    const req = http.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(datos);
    req.flush(torneoDePrueba(), { status: 201, statusText: 'Created' });
  });

  it('obtenerActivo devuelve el torneo activo', () => {
    let recibido: Torneo | null | undefined;
    servicio.obtenerActivo().subscribe((t) => (recibido = t));

    http.expectOne(`${base}/activo`).flush(torneoDePrueba());

    expect(recibido!.nombre).toBe('Copa Apertura');
  });

  it('obtenerActivo devuelve null si la API responde 404 (no hay torneo activo)', () => {
    let recibido: Torneo | null | undefined;
    servicio.obtenerActivo().subscribe((t) => (recibido = t));

    http.expectOne(`${base}/activo`).flush({ detail: 'No hay un torneo activo' }, { status: 404, statusText: 'Not Found' });

    expect(recibido).toBeNull();
  });

  it('obtenerActivo deja pasar los demás errores', () => {
    let status = 0;
    servicio.obtenerActivo().subscribe({ error: (e) => (status = e.status) });

    http.expectOne(`${base}/activo`).flush({ detail: 'x' }, { status: 500, statusText: 'Server Error' });

    expect(status).toBe(500);
  });

  it('obtener y obtenerLlaves piden GET por id', () => {
    servicio.obtener(3).subscribe();
    servicio.obtenerLlaves(3).subscribe();

    http.expectOne(`${base}/3`).flush(torneoDePrueba());
    const llaves = http.expectOne(`${base}/3/llaves`);
    expect(llaves.request.method).toBe('GET');
    llaves.flush(llaveDePrueba());
  });

  it('listar manda estado, page y size', () => {
    servicio.listar('FINALIZADO', 1, 10).subscribe();

    const req = http.expectOne((r) => r.url === base);
    expect(req.request.params.get('estado')).toBe('FINALIZADO');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('10');
    req.flush(paginaDePrueba([]));
  });

  it('listar sin estado no manda el parámetro', () => {
    servicio.listar(null, 0, 10).subscribe();

    const req = http.expectOne((r) => r.url === base);
    expect(req.request.params.has('estado')).toBe(false);
    req.flush(paginaDePrueba([]));
  });

  it('finalizar envía PATCH con estado FINALIZADO', () => {
    servicio.finalizar(3).subscribe();

    const req = http.expectOne(`${base}/3`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ estado: 'FINALIZADO' });
    req.flush(torneoDePrueba({ estado: 'FINALIZADO' }));
  });
});
