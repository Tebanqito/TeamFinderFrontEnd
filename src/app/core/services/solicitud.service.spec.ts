import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { ResultadoEnvio } from '../models/solicitud.model';
import { solicitudDePrueba } from '../testing/datos-prueba';
import { SolicitudService } from './solicitud.service';

describe('SolicitudService', () => {
  const base = `${environment.apiUrl}/solicitudes-amistad`;
  let servicio: SolicitudService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(SolicitudService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('enviar manda POST con el nombre del destinatario; 201 queda pendiente', () => {
    let resultado: ResultadoEnvio | undefined;
    servicio.enviar('ana').subscribe((r) => (resultado = r));

    const req = http.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nombreDestinatario: 'ana' });
    req.flush(solicitudDePrueba(), { status: 201, statusText: 'Created' });

    expect(resultado!.aceptadaAutomaticamente).toBe(false);
    expect(resultado!.solicitud.estado).toBe('PENDIENTE');
  });

  it('enviar: un 200 significa que se aceptó sola (la otra persona ya había enviado una)', () => {
    let resultado: ResultadoEnvio | undefined;
    servicio.enviar('ana').subscribe((r) => (resultado = r));

    http.expectOne(base).flush(solicitudDePrueba({ estado: 'ACEPTADA' }), { status: 200, statusText: 'OK' });

    expect(resultado!.aceptadaAutomaticamente).toBe(true);
  });

  it('recibidas y enviadas piden GET a su endpoint', () => {
    servicio.recibidas().subscribe();
    servicio.enviadas().subscribe();

    const recibidas = http.expectOne(`${base}/recibidas`);
    const enviadas = http.expectOne(`${base}/enviadas`);
    expect(recibidas.request.method).toBe('GET');
    expect(enviadas.request.method).toBe('GET');
    recibidas.flush([]);
    enviadas.flush([]);
  });

  it('responder manda PATCH /{id} con el estado', () => {
    servicio.responder(5, 'RECHAZADA').subscribe();

    const req = http.expectOne(`${base}/5`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ estado: 'RECHAZADA' });
    req.flush(solicitudDePrueba({ estado: 'RECHAZADA' }));
  });
});
