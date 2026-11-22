import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { PartidoService } from './partido.service';

describe('PartidoService', () => {
  let servicio: PartidoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(PartidoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('registrar envía POST /torneos/{id}/partidos con los dos equipos y el ganador', () => {
    const resultado = { equipoUnoId: 1, equipoDosId: 4, ganadorId: 4 };
    servicio.registrar(2, resultado).subscribe();

    const req = http.expectOne(`${environment.apiUrl}/torneos/2/partidos`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(resultado);
    req.flush({}, { status: 201, statusText: 'Created' });
  });

  it('eliminar envía DELETE /torneos/{id}/partidos/{partidoId}', () => {
    servicio.eliminar(2, 9).subscribe();

    const req = http.expectOne(`${environment.apiUrl}/torneos/2/partidos/9`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
