import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { SolicitudAmistad } from '../../../core/models/solicitud.model';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { solicitudDePrueba } from '../../../core/testing/datos-prueba';
import { SolicitudesRecibidasComponent } from './solicitudes-recibidas.component';

describe('SolicitudesRecibidasComponent', () => {
  const url = `${environment.apiUrl}/solicitudes-amistad`;
  let fixture: ComponentFixture<SolicitudesRecibidasComponent>;
  let http: HttpTestingController;
  let raiz: HTMLElement;
  let avisos: NotificacionService;
  let respondidas = 0;

  const abrir = async (solicitudes: SolicitudAmistad[]) => {
    respondidas = 0;
    await TestBed.configureTestingModule({
      imports: [SolicitudesRecibidasComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    avisos = TestBed.inject(NotificacionService);
    fixture = TestBed.createComponent(SolicitudesRecibidasComponent);
    fixture.componentRef.setInput('solicitudes', solicitudes);
    fixture.componentInstance.respondida.subscribe(() => respondidas++);
    raiz = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  };

  const boton = (texto: string) =>
    Array.from(raiz.querySelectorAll('button')).find((b) => b.textContent?.trim() === texto) as HTMLButtonElement;

  afterEach(() => http.verify());

  it('sin solicitudes muestra el mensaje vacío', async () => {
    await abrir([]);

    expect(raiz.textContent).toContain('No tenés solicitudes pendientes.');
    expect(raiz.querySelectorAll('button').length).toBe(0);
  });

  it('lista el remitente de cada solicitud con Aceptar y Rechazar', async () => {
    await abrir([solicitudDePrueba(), solicitudDePrueba({ id: 2, remitente: { id: 21, nombre: 'beto' } })]);

    const filas = Array.from(raiz.querySelectorAll('p')).map((p) => p.textContent);
    expect(filas[0]).toContain('ana');
    expect(filas[1]).toContain('beto');
    expect(raiz.querySelectorAll('button').length).toBe(4);
  });

  it('Aceptar manda PATCH ACEPTADA, avisa y pide refrescar', async () => {
    await abrir([solicitudDePrueba()]);

    boton('Aceptar').click();
    await fixture.whenStable();
    const req = http.expectOne(`${url}/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ estado: 'ACEPTADA' });
    req.flush(solicitudDePrueba({ estado: 'ACEPTADA' }));
    await fixture.whenStable();

    expect(avisos.actual()).toEqual({ tipo: 'exito', texto: 'Ahora ana es tu amigo.' });
    expect(respondidas).toBe(1);
  });

  it('Rechazar manda PATCH RECHAZADA', async () => {
    await abrir([solicitudDePrueba()]);

    boton('Rechazar').click();
    await fixture.whenStable();
    const req = http.expectOne(`${url}/1`);
    expect(req.request.body).toEqual({ estado: 'RECHAZADA' });
    req.flush(solicitudDePrueba({ estado: 'RECHAZADA' }));
    await fixture.whenStable();

    expect(avisos.actual()!.texto).toBe('Rechazaste la solicitud de ana.');
    expect(respondidas).toBe(1);
  });

  it('mientras se responde una solicitud se bloquean los botones', async () => {
    await abrir([solicitudDePrueba()]);

    boton('Aceptar').click();
    await fixture.whenStable();

    expect(boton('Aceptar').disabled).toBe(true);
    expect(boton('Rechazar').disabled).toBe(true);
    http.expectOne(`${url}/1`).flush(solicitudDePrueba());
  });

  it('si la API rechaza (ya respondida) muestra el motivo y pide refrescar igual', async () => {
    await abrir([solicitudDePrueba()]);

    boton('Aceptar').click();
    await fixture.whenStable();
    http.expectOne(`${url}/1`).flush({ detail: 'La solicitud ya fue respondida' }, { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();

    expect(avisos.actual()).toEqual({ tipo: 'error', texto: 'La solicitud ya fue respondida' });
    expect(respondidas).toBe(1);
  });
});
