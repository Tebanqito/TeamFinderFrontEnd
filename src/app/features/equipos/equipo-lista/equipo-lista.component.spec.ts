import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { EquipoDetalle } from '../../../core/models/equipo.model';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { equipoDePrueba, paginaDePrueba } from '../../../core/testing/datos-prueba';
import { EquipoListaComponent } from './equipo-lista.component';

describe('EquipoListaComponent', () => {
  const url = `${environment.apiUrl}/equipos`;
  let fixture: ComponentFixture<EquipoListaComponent>;
  let http: HttpTestingController;
  let raiz: HTMLElement;
  let avisos: NotificacionService;

  const abrir = async (entradas: Record<string, unknown> = {}) => {
    await TestBed.configureTestingModule({
      imports: [EquipoListaComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    avisos = TestBed.inject(NotificacionService);
    fixture = TestBed.createComponent(EquipoListaComponent);
    for (const [nombre, valor] of Object.entries(entradas)) {
      fixture.componentRef.setInput(nombre, valor);
    }
    raiz = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  };

  const pedido = () => http.expectOne((r) => r.url === url && r.method === 'GET');
  const boton = (texto: string) =>
    Array.from(raiz.querySelectorAll('button')).find((b) => b.textContent?.includes(texto)) as HTMLButtonElement;

  const halcones = equipoDePrueba();
  const condores = equipoDePrueba({ id: 2, nombre: 'Los Cóndores', tipo: 'FUTBOL_11', cupo: 11 });

  afterEach(() => http.verify());

  it('al abrirse pide la primera página (12 por página) y muestra los equipos', async () => {
    await abrir();
    expect(raiz.textContent).toContain('Cargando equipos');

    const req = pedido();
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('12');
    req.flush(paginaDePrueba([halcones, condores]));
    await fixture.whenStable();

    expect(raiz.querySelectorAll('app-equipo-card').length).toBe(2);
    expect(raiz.textContent).toContain('Los Cóndores');
    expect(raiz.querySelector('.paginacion')).toBeNull();
  });

  it('avisa si no hay equipos que coincidan', async () => {
    await abrir();
    pedido().flush(paginaDePrueba([]));
    await fixture.whenStable();

    expect(raiz.textContent).toContain('No hay equipos que coincidan');
  });

  it('Filtrar vuelve a la primera página con tipo, nombre y cupo', async () => {
    await abrir();
    pedido().flush(paginaDePrueba([halcones]));
    await fixture.whenStable();

    const tipo = raiz.querySelector<HTMLSelectElement>('select[name="tipo"]')!;
    tipo.value = 'FUTBOL_11';
    tipo.dispatchEvent(new Event('change'));
    const nombre = raiz.querySelector<HTMLInputElement>('input[name="nombre"]')!;
    nombre.value = 'cond';
    nombre.dispatchEvent(new Event('input'));
    raiz.querySelector<HTMLInputElement>('input[name="conCupo"]')!.click();
    await fixture.whenStable();

    raiz.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    const req = pedido();
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('tipo')).toBe('FUTBOL_11');
    expect(req.request.params.get('nombre')).toBe('cond');
    expect(req.request.params.get('conCupo')).toBe('true');
    req.flush(paginaDePrueba([condores]));
    await fixture.whenStable();

    expect(raiz.querySelectorAll('app-equipo-card').length).toBe(1);
  });

  it('pagina con Anterior y Siguiente', async () => {
    await abrir();
    pedido().flush(paginaDePrueba([halcones], { pagina: 0, totalPaginas: 3, totalElementos: 30 }));
    await fixture.whenStable();

    expect(raiz.textContent).toContain('Página 1 de 3');
    expect(boton('Anterior').disabled).toBe(true);

    boton('Siguiente').click();
    await fixture.whenStable();
    const req = pedido();
    expect(req.request.params.get('page')).toBe('1');
    req.flush(paginaDePrueba([condores], { pagina: 1, totalPaginas: 3, totalElementos: 30 }));
    await fixture.whenStable();

    expect(raiz.textContent).toContain('Página 2 de 3');
    expect(boton('Anterior').disabled).toBe(false);
  });

  it('muestra error y permite reintentar', async () => {
    await abrir();
    pedido().flush({ detail: 'Ocurrió un error inesperado' }, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    expect(raiz.querySelector('.error.general')!.textContent).toContain('Ocurrió un error inesperado');

    boton('Reintentar').click();
    await fixture.whenStable();
    pedido().flush(paginaDePrueba([halcones]));
    await fixture.whenStable();

    expect(raiz.querySelector('.error')).toBeNull();
    expect(raiz.querySelectorAll('app-equipo-card').length).toBe(1);
  });

  it('solo ofrece "Unirme" y "Eliminar" cuando corresponde', async () => {
    await abrir();
    pedido().flush(paginaDePrueba([halcones]));
    await fixture.whenStable();
    expect(raiz.querySelectorAll('.acciones').length).toBe(0);
  });

  describe('unirse', () => {
    beforeEach(async () => {
      await abrir({ puedeUnirse: true });
      pedido().flush(paginaDePrueba([halcones]));
      await fixture.whenStable();
    });

    it('envía POST /equipos/{id}/miembros, avisa y emite el equipo actualizado', async () => {
      let unido: EquipoDetalle | undefined;
      fixture.componentInstance.unido.subscribe((e) => (unido = e));

      boton('Unirme').click();
      await fixture.whenStable();
      const req = http.expectOne(`${url}/1/miembros`);
      expect(req.request.method).toBe('POST');
      const actualizado = equipoDePrueba({ cantidadMiembros: 3 });
      req.flush(actualizado);
      await fixture.whenStable();

      expect(unido).toEqual(actualizado);
      expect(avisos.actual()).toEqual({ tipo: 'exito', texto: 'Te uniste a "Los Halcones".' });
    });

    it('si la API rechaza (sin cupo), muestra el motivo y recarga el listado', async () => {
      boton('Unirme').click();
      await fixture.whenStable();
      http
        .expectOne(`${url}/1/miembros`)
        .flush({ detail: 'El equipo no tiene cupo disponible' }, { status: 409, statusText: 'Conflict' });
      await fixture.whenStable();

      expect(avisos.actual()).toEqual({ tipo: 'error', texto: 'El equipo no tiene cupo disponible' });
      pedido().flush(paginaDePrueba([equipoDePrueba({ cantidadMiembros: 5 })]));
      await fixture.whenStable();
      expect(boton('Equipo completo').disabled).toBe(true);
    });
  });

  describe('eliminar (owner)', () => {
    beforeEach(async () => {
      await abrir({ puedeEliminar: true });
      pedido().flush(paginaDePrueba([halcones]));
      await fixture.whenStable();
    });

    it('envía DELETE /equipos/{id}, avisa y recarga', async () => {
      let eliminado: EquipoDetalle | undefined;
      fixture.componentInstance.eliminado.subscribe((e) => (eliminado = e));

      boton('Eliminar').click();
      await fixture.whenStable();
      boton('Sí, eliminar').click();
      await fixture.whenStable();
      const req = http.expectOne(`${url}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
      await fixture.whenStable();

      expect(eliminado).toEqual(halcones);
      expect(avisos.actual()!.texto).toBe('Se eliminó "Los Halcones".');
      pedido().flush(paginaDePrueba([]));
      await fixture.whenStable();
      expect(raiz.textContent).toContain('No hay equipos que coincidan');
    });

    it('si el equipo juega el torneo activo muestra el 409 de la API', async () => {
      boton('Eliminar').click();
      await fixture.whenStable();
      boton('Sí, eliminar').click();
      await fixture.whenStable();
      http
        .expectOne(`${url}/1`)
        .flush({ detail: 'No se puede eliminar un equipo del torneo activo' }, { status: 409, statusText: 'Conflict' });
      await fixture.whenStable();

      expect(avisos.actual()).toEqual({ tipo: 'error', texto: 'No se puede eliminar un equipo del torneo activo' });
    });
  });

  it('si al eliminar queda vacía la última página, retrocede una', async () => {
    await abrir({ puedeEliminar: true });
    pedido().flush(paginaDePrueba([halcones], { pagina: 0, totalPaginas: 2, totalElementos: 13 }));
    await fixture.whenStable();
    boton('Siguiente').click();
    await fixture.whenStable();
    pedido().flush(paginaDePrueba([condores], { pagina: 1, totalPaginas: 2, totalElementos: 13 }));
    await fixture.whenStable();

    boton('Eliminar').click();
    await fixture.whenStable();
    boton('Sí, eliminar').click();
    await fixture.whenStable();
    http.expectOne(`${url}/2`).flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();

    // La página 1 ya no tiene equipos: vuelve a pedir la 0
    pedido().flush(paginaDePrueba([], { pagina: 1, totalPaginas: 1, totalElementos: 12 }));
    await fixture.whenStable();
    const req = pedido();
    expect(req.request.params.get('page')).toBe('0');
    req.flush(paginaDePrueba([halcones]));
  });
});
