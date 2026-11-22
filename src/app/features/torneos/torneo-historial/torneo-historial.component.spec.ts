import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { llaveDePrueba, torneoDePrueba } from '../../../core/testing/datos-prueba';
import { TorneoHistorialComponent } from './torneo-historial.component';

describe('TorneoHistorialComponent', () => {
  const url = `${environment.apiUrl}/torneos`;
  let fixture: ComponentFixture<TorneoHistorialComponent>;
  let http: HttpTestingController;
  let raiz: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TorneoHistorialComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '3' }) } } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(TorneoHistorialComponent);
    raiz = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  const responder = async (campeon: { id: number; nombre: string } | null = null) => {
    http.expectOne(`${url}/3`).flush(torneoDePrueba({ id: 3, estado: 'FINALIZADO' }));
    http.expectOne(`${url}/3/llaves`).flush(llaveDePrueba({ torneoId: 3, estado: 'FINALIZADO', campeon }));
    await fixture.whenStable();
  };
  const boton = (texto: string) =>
    Array.from(raiz.querySelectorAll('button')).find((b) => b.textContent?.trim() === texto) as HTMLButtonElement;

  it('pide el torneo y sus llaves por el id de la URL', async () => {
    expect(raiz.textContent).toContain('Cargando las llaves');
    await responder();
  });

  it('muestra nombre, estado, tipo y cantidad de equipos, y las llaves sin botones de edición', async () => {
    await responder();

    expect(raiz.querySelector('h2')!.textContent).toContain('Copa Apertura');
    expect(raiz.querySelector('h2 .badge')!.textContent).toContain('Finalizado');
    expect(raiz.textContent).toContain('Fútbol 5 · 4 equipos');
    expect(raiz.querySelector('app-llaves')).not.toBeNull();
    expect(raiz.querySelectorAll('.acc').length).toBe(0);
  });

  it('muestra el campeón si lo hay', async () => {
    await responder({ id: 1, nombre: 'Halcones' });

    expect(raiz.textContent).toContain('Campeón');
    expect(raiz.querySelector('b')!.textContent).toContain('Halcones');
  });

  it('no muestra campeón si la final no tiene resultado', async () => {
    await responder();

    expect(raiz.textContent).not.toContain('Campeón');
  });

  it('"← Volver al historial" navega a /torneo', async () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await responder();

    boton('← Volver al historial').click();

    expect(navegar).toHaveBeenCalledWith(['/torneo']);
  });

  it('si el torneo no existe muestra el error de la API y permite volver', async () => {
    http.expectOne(`${url}/3`).flush({ detail: 'Torneo con id 3 no encontrado' }, { status: 404, statusText: 'Not Found' });
    http.match(`${url}/3/llaves`);
    await fixture.whenStable();

    expect(raiz.querySelector('.error.general')!.textContent).toContain('Torneo con id 3 no encontrado');
    expect(boton('← Volver al historial')).toBeTruthy();
  });
});
