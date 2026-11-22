import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { paginaDePrueba, usuarioDePrueba } from '../testing/datos-prueba';
import { UsuarioService } from './usuario.service';

describe('UsuarioService', () => {
  const base = `${environment.apiUrl}/usuarios`;
  let servicio: UsuarioService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(UsuarioService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar manda page, size y el nombre sin espacios', () => {
    servicio.listar('  ana ', 2, 20).subscribe();

    const req = http.expectOne((r) => r.url === base);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('20');
    expect(req.request.params.get('nombre')).toBe('ana');
    req.flush(paginaDePrueba([usuarioDePrueba()]));
  });

  it('listar sin texto no manda el parámetro nombre', () => {
    servicio.listar('   ', 0, 20).subscribe();

    const req = http.expectOne((r) => r.url === base);
    expect(req.request.params.has('nombre')).toBe(false);
    req.flush(paginaDePrueba([]));
  });

  it('eliminar envía DELETE /usuarios/{id}', () => {
    servicio.eliminar(5).subscribe();

    const req = http.expectOne(`${base}/5`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
