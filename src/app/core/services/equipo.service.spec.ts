import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { EquipoDetalle } from '../models/equipo.model';
import { equipoDePrueba, paginaDePrueba } from '../testing/datos-prueba';
import { EquipoService } from './equipo.service';

describe('EquipoService', () => {
  let servicio: EquipoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(EquipoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('crear envía POST /equipos con los datos y devuelve el equipo creado', () => {
    const datos = { nombre: 'Los Halcones', descripcion: 'Jugamos los jueves', tipo: 'FUTBOL_5' as const };
    const creado: EquipoDetalle = {
      id: 1,
      ...datos,
      cupo: 5,
      cantidadMiembros: 1,
      miembros: [{ id: 3, nombre: 'juan' }],
    };
    let recibido: EquipoDetalle | undefined;

    servicio.crear(datos).subscribe((e) => (recibido = e));

    const req = http.expectOne(`${environment.apiUrl}/equipos`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(datos);
    req.flush(creado, { status: 201, statusText: 'Created' });

    expect(recibido).toEqual(creado);
  });

  it('obtenerMio devuelve el equipo del usuario cuando la API responde 200', () => {
    const equipo: EquipoDetalle = {
      id: 1,
      nombre: 'Los Halcones',
      descripcion: 'Jugamos los jueves',
      tipo: 'FUTBOL_5',
      cupo: 5,
      cantidadMiembros: 2,
      miembros: [
        { id: 3, nombre: 'juan' },
        { id: 4, nombre: 'pedro' },
      ],
    };
    let recibido: EquipoDetalle | null | undefined;

    servicio.obtenerMio().subscribe((e) => (recibido = e));

    const req = http.expectOne(`${environment.apiUrl}/equipos/mio`);
    expect(req.request.method).toBe('GET');
    req.flush(equipo);

    expect(recibido).toEqual(equipo);
  });

  it('obtenerMio devuelve null cuando la API responde 204 porque el usuario no tiene equipo', () => {
    let recibido: EquipoDetalle | null | undefined;

    servicio.obtenerMio().subscribe((e) => (recibido = e));

    http.expectOne(`${environment.apiUrl}/equipos/mio`).flush(null, { status: 204, statusText: 'No Content' });

    expect(recibido).toBeNull();
  });

  const base = `${environment.apiUrl}/equipos`;

  it('listar envía page y size, y solo los filtros que tienen valor', () => {
    servicio.listar({ tipo: 'FUTBOL_11', nombre: '  halcones ', conCupo: true }, 2, 12).subscribe();

    const req = http.expectOne((r) => r.url === base);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('12');
    expect(req.request.params.get('tipo')).toBe('FUTBOL_11');
    expect(req.request.params.get('nombre')).toBe('halcones');
    expect(req.request.params.get('conCupo')).toBe('true');
    req.flush(paginaDePrueba([equipoDePrueba()]));
  });

  it('listar sin filtros no manda tipo, nombre ni conCupo', () => {
    servicio.listar({ tipo: '', nombre: '  ', conCupo: false }, 0, 12).subscribe();

    const req = http.expectOne((r) => r.url === base);
    expect(req.request.params.keys().sort()).toEqual(['page', 'size']);
    req.flush(paginaDePrueba([]));
  });

  it('editar envía PATCH /equipos/{id} con los cambios', () => {
    servicio.editar(4, { nombre: 'Nuevo' }).subscribe();

    const req = http.expectOne(`${base}/4`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ nombre: 'Nuevo' });
    req.flush(equipoDePrueba());
  });

  it('unirse envía POST /equipos/{id}/miembros', () => {
    servicio.unirse(4).subscribe();

    const req = http.expectOne(`${base}/4/miembros`);
    expect(req.request.method).toBe('POST');
    req.flush(equipoDePrueba());
  });

  it('agregarAmigo envía POST /equipos/{id}/miembros/{usuarioId}', () => {
    servicio.agregarAmigo(4, 9).subscribe();

    const req = http.expectOne(`${base}/4/miembros/9`);
    expect(req.request.method).toBe('POST');
    req.flush(equipoDePrueba());
  });

  it('abandonar envía DELETE /equipos/{id}/miembros/me', () => {
    servicio.abandonar(4).subscribe();

    const req = http.expectOne(`${base}/4/miembros/me`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('eliminar envía DELETE /equipos/{id}', () => {
    servicio.eliminar(4).subscribe();

    const req = http.expectOne(`${base}/4`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
