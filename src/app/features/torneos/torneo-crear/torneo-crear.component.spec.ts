import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { Torneo } from '../../../core/models/torneo.model';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { torneoDePrueba } from '../../../core/testing/datos-prueba';
import { TorneoCrearComponent } from './torneo-crear.component';

describe('TorneoCrearComponent', () => {
  const url = `${environment.apiUrl}/torneos`;
  let fixture: ComponentFixture<TorneoCrearComponent>;
  let http: HttpTestingController;
  let raiz: HTMLElement;
  let avisos: NotificacionService;
  let creado: Torneo | undefined;

  beforeEach(async () => {
    creado = undefined;
    await TestBed.configureTestingModule({
      imports: [TorneoCrearComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    avisos = TestBed.inject(NotificacionService);
    fixture = TestBed.createComponent(TorneoCrearComponent);
    fixture.componentInstance.creado.subscribe((t) => (creado = t));
    raiz = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  const escribir = async (selector: string, valor: string) => {
    const campo = raiz.querySelector<HTMLInputElement | HTMLSelectElement>(selector)!;
    campo.value = valor;
    campo.dispatchEvent(new Event(campo instanceof HTMLSelectElement ? 'change' : 'input'));
    await fixture.whenStable();
  };
  const enviar = async () => {
    raiz.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  };

  it('arranca con tipo Fútbol 5 y 4 equipos, como el prototipo', () => {
    expect(raiz.querySelector<HTMLInputElement>('input[name="cantidadEquipos"]')!.value).toBe('4');
    expect(raiz.querySelector<HTMLSelectElement>('select[name="tipo"]')!.selectedOptions[0].textContent).toContain('Fútbol 5');
    expect(raiz.querySelector('button[type="submit"]')!.textContent).toContain('Sortear y crear');
  });

  it('no envía sin nombre y muestra el mensaje', async () => {
    await enviar();

    http.expectNone(url);
    expect(raiz.textContent).toContain('El nombre es obligatorio');
  });

  it('no envía con menos de 2 equipos', async () => {
    await escribir('input[name="nombre"]', 'Copa');
    await escribir('input[name="cantidadEquipos"]', '1');
    await enviar();

    http.expectNone(url);
    expect(raiz.textContent).toContain('al menos 2 equipos');
  });

  it('envía nombre (sin espacios), tipo y cantidad, avisa y emite el torneo', async () => {
    await escribir('input[name="nombre"]', '  Copa Apertura ');
    await escribir('select[name="tipo"]', '1: FUTBOL_11');
    await escribir('input[name="cantidadEquipos"]', '8');
    await enviar();

    const req = http.expectOne(url);
    expect(req.request.body).toEqual({ nombre: 'Copa Apertura', tipo: 'FUTBOL_11', cantidadEquipos: 8 });
    req.flush(torneoDePrueba(), { status: 201, statusText: 'Created' });
    await fixture.whenStable();

    expect(creado).toEqual(torneoDePrueba());
    expect(avisos.actual()).toEqual({ tipo: 'exito', texto: 'Torneo "Copa Apertura" creado y sorteado.' });
  });

  it('si no hay equipos elegibles muestra el motivo que da la API y no emite', async () => {
    await escribir('input[name="nombre"]', 'Copa');
    await enviar();
    const motivo = 'No hay suficientes equipos elegibles: el torneo necesita 4 equipos completos de tipo FUTBOL_5 y hay 1';
    http.expectOne(url).flush({ detail: motivo }, { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();

    expect(avisos.actual()).toEqual({ tipo: 'error', texto: motivo });
    expect(creado).toBeUndefined();
    expect(raiz.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(false);
  });

  it('muestra el 409 de torneo activo existente', async () => {
    await escribir('input[name="nombre"]', 'Copa');
    await enviar();
    http
      .expectOne(url)
      .flush({ detail: 'Ya existe un torneo activo: finalizalo antes de crear otro' }, { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();

    expect(avisos.actual()!.texto).toContain('Ya existe un torneo activo');
  });
});
