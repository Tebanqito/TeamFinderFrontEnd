import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { EquipoDetalle } from '../models/equipo.model';
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
});
