import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { llaveDePrueba, torneoDePrueba } from '../../../core/testing/datos-prueba';
import { TorneoActivoComponent } from './torneo-activo.component';

describe('TorneoActivoComponent', () => {
  const url = `${environment.apiUrl}/torneos`;
  let fixture: ComponentFixture<TorneoActivoComponent>;
  let http: HttpTestingController;
  let raiz: HTMLElement;
  let avisos: NotificacionService;
  let cambios = 0;

  const abrir = async (rol: string) => {
    localStorage.clear();
    cambios = 0;
    await TestBed.configureTestingModule({
      imports: [TorneoActivoComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    TestBed.inject(AuthService).sesion.set({ token: 't', email: 'x@mail.com', rol });
    http = TestBed.inject(HttpTestingController);
    avisos = TestBed.inject(NotificacionService);
    fixture = TestBed.createComponent(TorneoActivoComponent);
    fixture.componentInstance.cambio.subscribe(() => cambios++);
    raiz = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  };

  /** Responde "torneo activo" y sus llaves. */
  const cargarActivo = async (llave = llaveDePrueba()) => {
    http.expectOne(`${url}/activo`).flush(torneoDePrueba());
    await fixture.whenStable();
    http.expectOne(`${url}/1/llaves`).flush(llave);
    await fixture.whenStable();
  };
  const sinTorneo = async () => {
    http.expectOne(`${url}/activo`).flush({ detail: 'No hay un torneo activo' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
  };
  const boton = (texto: string) =>
    Array.from(raiz.querySelectorAll('button')).find((b) => b.textContent?.trim() === texto) as HTMLButtonElement;

  afterEach(() => http.verify());

  describe('como usuario', () => {
    beforeEach(() => abrir('USUARIO'));

    it('muestra "Cargando" mientras espera', () => {
      expect(raiz.textContent).toContain('Cargando el torneo');
      http.expectOne(`${url}/activo`);
    });

    it('sin torneo activo (404) avisa y no ofrece crear uno', async () => {
      await sinTorneo();

      expect(raiz.textContent).toContain('No hay un torneo activo.');
      expect(raiz.querySelector('form')).toBeNull();
    });

    it('con torneo activo muestra nombre, estado, tipo, equipos sorteados y llaves, sin botones de edición', async () => {
      await cargarActivo();

      expect(raiz.querySelector('h2')!.textContent).toContain('Copa Apertura');
      expect(raiz.querySelector('.badge.g')!.textContent).toContain('ACTIVO');
      expect(raiz.textContent).toContain('Fútbol 5 · 4 equipos sorteados');
      expect(Array.from(raiz.querySelectorAll('section .chip')).map((c) => c.textContent?.trim())).toEqual(['Halcones', 'Tigres', 'Pumas', 'Leones']);
      expect(raiz.querySelector('app-llaves')).not.toBeNull();
      expect(raiz.querySelectorAll('button').length).toBe(0);
    });

    it('muestra la tarjeta del campeón con su nombre cuando la final tiene ganador', async () => {
      await cargarActivo(llaveDePrueba({ campeon: { id: 1, nombre: 'Halcones' } }));

      const insignias = Array.from(raiz.querySelectorAll('h2 .badge.g')).map((b) => b.textContent?.trim());
      expect(insignias).toEqual(['ACTIVO', 'Campeón']);
      expect(Array.from(raiz.querySelectorAll('h2')).some((h) => h.textContent?.includes('Halcones'))).toBe(true);
    });

    it('muestra el error y permite reintentar', async () => {
      http.expectOne(`${url}/activo`).flush({ detail: 'Ocurrió un error inesperado' }, { status: 500, statusText: 'Server Error' });
      await fixture.whenStable();

      expect(raiz.querySelector('.error.general')!.textContent).toContain('Ocurrió un error inesperado');
      boton('Reintentar').click();
      await fixture.whenStable();
      await cargarActivo();

      expect(raiz.querySelector('.error')).toBeNull();
      expect(raiz.textContent).toContain('Copa Apertura');
    });

    it('avisa si no hay conexión con el servidor', async () => {
      http.expectOne(`${url}/activo`).error(new ProgressEvent('error'));
      await fixture.whenStable();

      expect(raiz.querySelector('.error.general')!.textContent).toContain('No se pudo conectar con el servidor');
    });
  });

  describe('como owner', () => {
    beforeEach(() => abrir('OWNER'));

    it('sin torneo activo ofrece el formulario para crear uno', async () => {
      await sinTorneo();

      expect(raiz.textContent).toContain('No hay un torneo activo.');
      expect(raiz.querySelector('app-torneo-crear')).not.toBeNull();
    });

    it('al crear un torneo recarga el activo y avisa al historial', async () => {
      await sinTorneo();
      const campo = raiz.querySelector<HTMLInputElement>('input[name="nombre"]')!;
      campo.value = 'Copa Apertura';
      campo.dispatchEvent(new Event('input'));
      await fixture.whenStable();
      raiz.querySelector('form')!.dispatchEvent(new Event('submit'));
      await fixture.whenStable();

      http.expectOne((r) => r.url === url && r.method === 'POST').flush(torneoDePrueba(), { status: 201, statusText: 'Created' });
      await fixture.whenStable();
      await cargarActivo();

      expect(raiz.querySelector('app-torneo-crear')).toBeNull();
      expect(raiz.textContent).toContain('Copa Apertura');
      expect(cambios).toBe(1);
    });

    it('con torneo activo ve "Finalizar torneo" y los botones de los cruces', async () => {
      await cargarActivo();

      expect(boton('Finalizar torneo')).toBeTruthy();
      expect(Array.from(raiz.querySelectorAll('.acc button')).map((b) => b.textContent?.trim())).toEqual(['Halcones', 'Leones', 'Tigres', 'Pumas']);
    });

    it('elegir un ganador manda el resultado, avisa y vuelve a pedir las llaves', async () => {
      await cargarActivo();

      boton('Leones').click();
      await fixture.whenStable();
      const req = http.expectOne(`${url}/1/partidos`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ equipoUnoId: 1, equipoDosId: 4, ganadorId: 4 });
      req.flush({}, { status: 201, statusText: 'Created' });
      await fixture.whenStable();

      expect(avisos.actual()).toEqual({ tipo: 'exito', texto: 'Resultado cargado: ganó Leones.' });
      const conResultado = llaveDePrueba();
      conResultado.rondas[0].cruces[0].partidoId = 7;
      conResultado.rondas[0].cruces[0].ganador = conResultado.rondas[0].cruces[0].equipoDos;
      conResultado.rondas[1].cruces[0].equipoUno = conResultado.rondas[0].cruces[0].equipoDos;
      http.expectOne(`${url}/1/llaves`).flush(conResultado);
      await fixture.whenStable();

      expect(raiz.querySelector('.t.w')!.textContent).toContain('Leones');
      expect(boton('Borrar resultado')).toBeTruthy();
    });

    it('si la API rechaza el resultado muestra el motivo y vuelve a cargar todo', async () => {
      await cargarActivo();

      boton('Halcones').click();
      await fixture.whenStable();
      http
        .expectOne(`${url}/1/partidos`)
        .flush({ detail: 'Ese cruce ya tiene un resultado cargado: borralo antes de cargar otro' }, { status: 409, statusText: 'Conflict' });
      await fixture.whenStable();

      expect(avisos.actual()!.texto).toContain('ya tiene un resultado cargado');
      await cargarActivo();
    });

    it('Borrar resultado manda DELETE del partido y vuelve a pedir las llaves', async () => {
      const llave = llaveDePrueba();
      llave.rondas[0].cruces[0].partidoId = 7;
      llave.rondas[0].cruces[0].ganador = llave.rondas[0].cruces[0].equipoUno;
      await cargarActivo(llave);

      boton('Borrar resultado').click();
      await fixture.whenStable();
      const req = http.expectOne(`${url}/1/partidos/7`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
      await fixture.whenStable();

      expect(avisos.actual()!.texto).toBe('Resultado borrado.');
      http.expectOne(`${url}/1/llaves`).flush(llaveDePrueba());
      await fixture.whenStable();
      expect(raiz.querySelector('.t.w')).toBeNull();
    });

    it('Finalizar pide confirmación y recién al confirmar envía PATCH', async () => {
      await cargarActivo();

      boton('Finalizar torneo').click();
      await fixture.whenStable();
      http.expectNone(`${url}/1`);
      expect(raiz.textContent).toContain('no se pueden cargar más resultados');

      boton('Sí, finalizar').click();
      await fixture.whenStable();
      const req = http.expectOne(`${url}/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ estado: 'FINALIZADO' });
      req.flush(torneoDePrueba({ estado: 'FINALIZADO' }));
      await fixture.whenStable();

      expect(avisos.actual()!.texto).toBe('Torneo "Copa Apertura" finalizado.');
      expect(cambios).toBe(1);
      // Ya no hay torneo activo: aparece el formulario para crear otro
      await sinTorneo();
      expect(raiz.querySelector('app-torneo-crear')).not.toBeNull();
    });

    it('Cancelar la finalización no llama a la API', async () => {
      await cargarActivo();

      boton('Finalizar torneo').click();
      await fixture.whenStable();
      boton('Cancelar').click();
      await fixture.whenStable();

      expect(raiz.querySelector('.confirmacion')).toBeNull();
      expect(boton('Finalizar torneo')).toBeTruthy();
    });
  });
});
