import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { solicitudDePrueba } from '../../../core/testing/datos-prueba';
import { AmigoAgregarComponent } from './amigo-agregar.component';

describe('AmigoAgregarComponent', () => {
  const url = `${environment.apiUrl}/solicitudes-amistad`;
  let fixture: ComponentFixture<AmigoAgregarComponent>;
  let http: HttpTestingController;
  let raiz: HTMLElement;
  let avisos: NotificacionService;
  let enviadas = 0;

  beforeEach(async () => {
    enviadas = 0;
    await TestBed.configureTestingModule({
      imports: [AmigoAgregarComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    avisos = TestBed.inject(NotificacionService);
    fixture = TestBed.createComponent(AmigoAgregarComponent);
    fixture.componentInstance.enviada.subscribe(() => enviadas++);
    raiz = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  const escribirYEnviar = async (nombre: string) => {
    const campo = raiz.querySelector<HTMLInputElement>('input[name="nombre"]')!;
    campo.value = nombre;
    campo.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    raiz.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  };

  it('no envía nada si el nombre está vacío o son solo espacios', async () => {
    await escribirYEnviar('   ');

    http.expectNone(url);
    expect(raiz.textContent).toContain('Escribí el nombre del usuario');
  });

  it('envía la solicitud con el nombre sin espacios, avisa, limpia el campo y emite', async () => {
    await escribirYEnviar('  ana ');

    const req = http.expectOne(url);
    expect(req.request.body).toEqual({ nombreDestinatario: 'ana' });
    req.flush(solicitudDePrueba(), { status: 201, statusText: 'Created' });
    await fixture.whenStable();

    expect(avisos.actual()).toEqual({ tipo: 'exito', texto: 'Solicitud enviada a ana.' });
    expect(raiz.querySelector<HTMLInputElement>('input[name="nombre"]')!.value).toBe('');
    expect(enviadas).toBe(1);
  });

  it('avisa si la otra persona ya había enviado una solicitud y se aceptó sola', async () => {
    await escribirYEnviar('ana');
    http.expectOne(url).flush(solicitudDePrueba({ estado: 'ACEPTADA' }), { status: 200, statusText: 'OK' });
    await fixture.whenStable();

    expect(avisos.actual()!.texto).toContain('ahora son amigos');
    expect(enviadas).toBe(1);
  });

  it('muestra el error de la API (usuario inexistente) sin emitir', async () => {
    await escribirYEnviar('nadie');
    http.expectOne(url).flush({ detail: 'No existe un usuario con ese nombre' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();

    expect(avisos.actual()).toEqual({ tipo: 'error', texto: 'No existe un usuario con ese nombre' });
    expect(enviadas).toBe(0);
    expect(raiz.querySelector<HTMLInputElement>('input[name="nombre"]')!.value).toBe('nadie');
  });
});
