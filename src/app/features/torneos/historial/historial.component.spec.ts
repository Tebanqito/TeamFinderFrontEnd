import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { paginaDePrueba, torneoResumenDePrueba } from '../../../core/testing/datos-prueba';
import { HistorialComponent } from './historial.component';

describe('HistorialComponent', () => {
  const url = `${environment.apiUrl}/torneos`;
  let fixture: ComponentFixture<HistorialComponent>;
  let http: HttpTestingController;
  let raiz: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(HistorialComponent);
    raiz = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  const pedido = () => http.expectOne((r) => r.url === url && r.method === 'GET');
  const boton = (texto: string) =>
    Array.from(raiz.querySelectorAll('button')).find((b) => b.textContent?.trim() === texto) as HTMLButtonElement;

  it('pide solo los torneos FINALIZADOS, 10 por página', () => {
    const req = pedido();

    expect(req.request.params.get('estado')).toBe('FINALIZADO');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('10');
    expect(raiz.textContent).toContain('Cargando el historial');
  });

  it('sin torneos finalizados muestra el mensaje vacío', async () => {
    pedido().flush(paginaDePrueba([]));
    await fixture.whenStable();

    expect(raiz.textContent).toContain('Todavía no hay torneos finalizados.');
  });

  it('muestra nombre, tipo, cantidad de equipos y campeón de cada torneo', async () => {
    pedido().flush(
      paginaDePrueba([
        torneoResumenDePrueba({ id: 2, nombre: 'Copa Clausura', tipo: 'FUTBOL_11', cantidadEquipos: 8, campeon: { id: 1, nombre: 'Halcones' } }),
        torneoResumenDePrueba({ id: 1, nombre: 'Copa Apertura' }),
      ]),
    );
    await fixture.whenStable();

    const celdas = (fila: Element) => Array.from(fila.children).map((c) => c.textContent?.trim());
    const filas = Array.from(raiz.querySelectorAll('.ur'));
    expect(celdas(filas[0])).toEqual(['Copa Clausura', 'Fútbol 11', '8 equipos', 'Campeón: Halcones', 'Ver llaves']);
    expect(celdas(filas[1])).toEqual(['Copa Apertura', 'Fútbol 5', '4 equipos', 'Sin campeón definido', 'Ver llaves']);
  });

  it('"Ver llaves" navega a las llaves de ese torneo', async () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    pedido().flush(paginaDePrueba([torneoResumenDePrueba({ id: 7 })]));
    await fixture.whenStable();

    boton('Ver llaves').click();

    expect(navegar).toHaveBeenCalledWith(['/torneo', 'historial', 7]);
  });

  it('pagina con Anterior y Siguiente', async () => {
    pedido().flush(paginaDePrueba([torneoResumenDePrueba()], { pagina: 0, totalPaginas: 2, totalElementos: 11 }));
    await fixture.whenStable();
    expect(raiz.textContent).toContain('Página 1 de 2');
    expect(boton('Anterior').disabled).toBe(true);

    boton('Siguiente').click();
    await fixture.whenStable();
    const req = pedido();
    expect(req.request.params.get('page')).toBe('1');
    req.flush(paginaDePrueba([torneoResumenDePrueba({ id: 2 })], { pagina: 1, totalPaginas: 2, totalElementos: 11 }));
    await fixture.whenStable();

    expect(raiz.textContent).toContain('Página 2 de 2');
    expect(boton('Siguiente').disabled).toBe(true);
  });

  it('sin una sola página no muestra la paginación', async () => {
    pedido().flush(paginaDePrueba([torneoResumenDePrueba()]));
    await fixture.whenStable();

    expect(raiz.querySelector('.paginacion')).toBeNull();
  });

  it('muestra el error y permite reintentar', async () => {
    pedido().flush({ detail: 'Ocurrió un error inesperado' }, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    expect(raiz.querySelector('.error.general')!.textContent).toContain('Ocurrió un error inesperado');

    boton('Reintentar').click();
    await fixture.whenStable();
    pedido().flush(paginaDePrueba([torneoResumenDePrueba()]));
    await fixture.whenStable();

    expect(raiz.querySelector('.error')).toBeNull();
    expect(raiz.querySelectorAll('.ur').length).toBe(1);
  });

  it('recargar vuelve a pedir la página actual', async () => {
    pedido().flush(paginaDePrueba([]));
    await fixture.whenStable();

    fixture.componentInstance.recargar();
    pedido().flush(paginaDePrueba([torneoResumenDePrueba()]));
    await fixture.whenStable();

    expect(raiz.querySelectorAll('.ur').length).toBe(1);
  });
});
