import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { EquipoDetalle } from '../../../core/models/equipo.model';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { amigoDePrueba, equipoDePrueba } from '../../../core/testing/datos-prueba';
import { MiEquipoComponent } from './mi-equipo.component';

describe('MiEquipoComponent', () => {
  const url = `${environment.apiUrl}/equipos`;
  const urlAmigos = `${environment.apiUrl}/amigos`;
  let fixture: ComponentFixture<MiEquipoComponent>;
  let http: HttpTestingController;
  let raiz: HTMLElement;
  let avisos: NotificacionService;

  const equipo = equipoDePrueba({
    id: 7,
    nombre: 'Los Cóndores',
    descripcion: 'Jugamos los sábados',
    tipo: 'FUTBOL_11',
    cupo: 11,
    cantidadMiembros: 2,
  });

  const abrir = async (e: EquipoDetalle = equipo) => {
    await TestBed.configureTestingModule({
      imports: [MiEquipoComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    avisos = TestBed.inject(NotificacionService);
    fixture = TestBed.createComponent(MiEquipoComponent);
    fixture.componentRef.setInput('equipo', e);
    raiz = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  };

  const boton = (texto: string) =>
    Array.from(raiz.querySelectorAll('button')).find((b) => b.textContent?.trim() === texto) as HTMLButtonElement;
  const escribir = async (selector: string, valor: string) => {
    const campo = raiz.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };

  afterEach(() => http.verify());

  describe('datos', () => {
    beforeEach(() => abrir());

    it('muestra el nombre, el tipo y la descripción del equipo', () => {
      expect(raiz.querySelector('h2')!.textContent).toContain('Mi equipo');
      expect(raiz.querySelector('h3')!.textContent).toContain('Los Cóndores');
      expect(raiz.querySelector('.badge')!.textContent).toContain('Fútbol 11');
      expect(raiz.textContent).toContain('Jugamos los sábados');
    });

    it('muestra el cupo y los integrantes', () => {
      expect(raiz.textContent).toContain('2/11 integrantes');
      expect(Array.from(raiz.querySelectorAll('.chip')).map((c) => c.textContent?.trim())).toEqual(['juan', 'pedro']);
      expect(raiz.querySelector<HTMLElement>('.bar i')!.style.width.startsWith('18.18')).toBe(true);
    });
  });

  describe('editar', () => {
    beforeEach(async () => {
      await abrir();
      boton('Editar').click();
      await fixture.whenStable();
    });

    it('precarga el nombre y la descripción actuales', () => {
      expect(raiz.querySelector<HTMLInputElement>('input[name="nombre"]')!.value).toBe('Los Cóndores');
      expect(raiz.querySelector<HTMLTextAreaElement>('textarea[name="descripcion"]')!.value).toBe('Jugamos los sábados');
    });

    it('envía solo lo que cambió, avisa y emite el equipo actualizado', async () => {
      let emitido: EquipoDetalle | undefined;
      fixture.componentInstance.actualizado.subscribe((e) => (emitido = e));
      await escribir('input[name="nombre"]', '  Cóndores FC ');

      raiz.querySelector('form')!.dispatchEvent(new Event('submit'));
      await fixture.whenStable();
      const req = http.expectOne(`${url}/7`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ nombre: 'Cóndores FC' });
      const nuevo = { ...equipo, nombre: 'Cóndores FC' };
      req.flush(nuevo);
      await fixture.whenStable();

      expect(emitido).toEqual(nuevo);
      expect(avisos.actual()!.texto).toBe('Equipo actualizado.');
      expect(raiz.querySelector('form')).toBeNull();
    });

    it('si no cambió nada, cierra la edición sin llamar a la API', async () => {
      raiz.querySelector('form')!.dispatchEvent(new Event('submit'));
      await fixture.whenStable();

      http.expectNone(`${url}/7`);
      expect(raiz.querySelector('form')).toBeNull();
    });

    it('no envía si el nombre queda vacío', async () => {
      await escribir('input[name="nombre"]', '   ');
      raiz.querySelector('form')!.dispatchEvent(new Event('submit'));
      await fixture.whenStable();

      http.expectNone(`${url}/7`);
      expect(raiz.textContent).toContain('El nombre es obligatorio');
    });

    it('muestra bajo el campo el 409 de nombre repetido', async () => {
      await escribir('input[name="nombre"]', 'Los Halcones');
      raiz.querySelector('form')!.dispatchEvent(new Event('submit'));
      await fixture.whenStable();
      http.expectOne(`${url}/7`).flush({ detail: 'Ya existe un equipo con ese nombre' }, { status: 409, statusText: 'Conflict' });
      await fixture.whenStable();

      expect(raiz.querySelector('.error')!.textContent).toContain('Ya existe un equipo con ese nombre');
      expect(raiz.querySelector('form')).not.toBeNull();
    });

    it('Cancelar vuelve a la vista normal', async () => {
      boton('Cancelar').click();
      await fixture.whenStable();

      expect(raiz.querySelector('form')).toBeNull();
      expect(raiz.querySelector('h3')!.textContent).toContain('Los Cóndores');
    });
  });

  describe('abandonar', () => {
    beforeEach(() => abrir());

    it('pide confirmación y recién al confirmar envía DELETE /miembros/me', async () => {
      let salio = false;
      fixture.componentInstance.abandonado.subscribe(() => (salio = true));

      boton('Abandonar equipo').click();
      await fixture.whenStable();
      http.expectNone(`${url}/7/miembros/me`);

      boton('Sí, abandonar').click();
      await fixture.whenStable();
      const req = http.expectOne(`${url}/7/miembros/me`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
      await fixture.whenStable();

      expect(salio).toBe(true);
      expect(avisos.actual()!.texto).toBe('Abandonaste el equipo.');
    });

    it('si el equipo juega el torneo activo muestra el 409 y no emite', async () => {
      let salio = false;
      fixture.componentInstance.abandonado.subscribe(() => (salio = true));

      boton('Abandonar equipo').click();
      await fixture.whenStable();
      boton('Sí, abandonar').click();
      await fixture.whenStable();
      http
        .expectOne(`${url}/7/miembros/me`)
        .flush({ detail: 'No podés abandonar un equipo que participa del torneo activo' }, { status: 409, statusText: 'Conflict' });
      await fixture.whenStable();

      expect(salio).toBe(false);
      expect(raiz.querySelector('.error.general')!.textContent).toContain('torneo activo');
    });

    it('Cancelar no llama a la API', async () => {
      boton('Abandonar equipo').click();
      await fixture.whenStable();
      boton('Cancelar').click();
      await fixture.whenStable();

      expect(raiz.querySelector('.confirmacion')).toBeNull();
    });
  });

  describe('agregar amigo', () => {
    beforeEach(() => abrir());

    const abrirSelector = async (amigos = [amigoDePrueba(), amigoDePrueba({ id: 10, nombre: 'ana', equipoId: 3 })]) => {
      boton('Agregar amigo').click();
      await fixture.whenStable();
      http.expectOne(urlAmigos).flush(amigos);
      await fixture.whenStable();
    };

    it('ofrece solo los amigos que no tienen equipo', async () => {
      await abrirSelector();

      const opciones = Array.from(raiz.querySelectorAll('select[name="amigo"] option')).map((o) => o.textContent?.trim());
      expect(opciones).toEqual(['Elegí un amigo', 'lucas']);
    });

    it('suma al amigo elegido (POST /miembros/{id}), avisa y emite el equipo', async () => {
      let emitido: EquipoDetalle | undefined;
      fixture.componentInstance.actualizado.subscribe((e) => (emitido = e));
      await abrirSelector();
      expect(boton('Sumar al equipo').disabled).toBe(true);

      const select = raiz.querySelector<HTMLSelectElement>('select[name="amigo"]')!;
      select.value = select.options[1].value;
      select.dispatchEvent(new Event('change'));
      await fixture.whenStable();
      boton('Sumar al equipo').click();
      await fixture.whenStable();

      const req = http.expectOne(`${url}/7/miembros/9`);
      expect(req.request.method).toBe('POST');
      const nuevo = { ...equipo, cantidadMiembros: 3 };
      req.flush(nuevo);
      await fixture.whenStable();

      expect(emitido).toEqual(nuevo);
      expect(avisos.actual()!.texto).toBe('Tu amigo se sumó al equipo.');
      expect(raiz.querySelector('select[name="amigo"]')).toBeNull();
    });

    it('avisa si no tiene amigos sin equipo', async () => {
      await abrirSelector([amigoDePrueba({ equipoId: 3 })]);

      expect(raiz.textContent).toContain('No tenés amigos sin equipo para sumar');
    });

    it('muestra el error de la API al sumar (por ejemplo, sin cupo)', async () => {
      await abrirSelector();
      const select = raiz.querySelector<HTMLSelectElement>('select[name="amigo"]')!;
      select.value = select.options[1].value;
      select.dispatchEvent(new Event('change'));
      await fixture.whenStable();
      boton('Sumar al equipo').click();
      await fixture.whenStable();
      http.expectOne(`${url}/7/miembros/9`).flush({ detail: 'El equipo no tiene cupo disponible' }, { status: 409, statusText: 'Conflict' });
      await fixture.whenStable();

      expect(raiz.querySelector('.error.general')!.textContent).toContain('no tiene cupo');
    });

    it('si el equipo está completo no ofrece agregar amigos', async () => {
      TestBed.resetTestingModule();
      await abrir(equipoDePrueba({ cantidadMiembros: 5 }));

      expect(boton('Agregar amigo')).toBeUndefined();
    });
  });
});
