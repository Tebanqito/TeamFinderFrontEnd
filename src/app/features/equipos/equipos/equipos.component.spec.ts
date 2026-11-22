import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { EquipoDetalle } from '../../../core/models/equipo.model';
import { AuthService } from '../../../core/services/auth.service';
import { equipoDePrueba, paginaDePrueba } from '../../../core/testing/datos-prueba';
import { EquiposComponent } from './equipos.component';

describe('EquiposComponent', () => {
  const urlMio = `${environment.apiUrl}/equipos/mio`;
  const urlEquipos = `${environment.apiUrl}/equipos`;
  let fixture: ComponentFixture<EquiposComponent>;
  let http: HttpTestingController;
  let raiz: HTMLElement;

  const miEquipo = equipoDePrueba({ cantidadMiembros: 3, miembros: [{ id: 3, nombre: 'juan' }, { id: 4, nombre: 'pedro' }, { id: 5, nombre: 'lucas' }] });
  const otro = equipoDePrueba({ id: 2, nombre: 'Los Cóndores' });

  const abrirPantalla = async (rol = 'USUARIO') => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [EquiposComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    TestBed.inject(AuthService).sesion.set({ token: 'abc123', email: 'juan@mail.com', rol });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(EquiposComponent);
    raiz = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  };

  const responder = async (cuerpo: EquipoDetalle | null) => {
    http.expectOne(urlMio).flush(cuerpo, cuerpo ? { status: 200, statusText: 'OK' } : { status: 204, statusText: 'No Content' });
    await fixture.whenStable();
  };

  const pedidoLista = () => http.expectOne((r) => r.url === urlEquipos && r.method === 'GET');
  const responderLista = async (equipos: EquipoDetalle[]) => {
    pedidoLista().flush(paginaDePrueba(equipos));
    await fixture.whenStable();
  };
  const boton = (texto: string) =>
    Array.from(raiz.querySelectorAll('button')).find((b) => b.textContent?.trim() === texto) as HTMLButtonElement;

  afterEach(() => http.verify());

  describe('como usuario', () => {
    beforeEach(() => abrirPantalla());

    it('le pregunta a la API por su equipo y muestra "Cargando" mientras espera', () => {
      expect(http.expectOne(urlMio).request.method).toBe('GET');
      expect(raiz.textContent).toContain('Cargando tu equipo');
      expect(raiz.querySelector('form')).toBeNull();
    });

    it('sin equipo (204) muestra el formulario para crearlo y el listado con "Unirme"', async () => {
      await responder(null);
      await responderLista([otro]);

      expect(raiz.textContent).not.toContain('Cargando tu equipo');
      expect(raiz.textContent).toContain('Crear mi equipo');
      expect(raiz.querySelector('app-mi-equipo')).toBeNull();
      expect(boton('Unirme')).toBeTruthy();
      expect(boton('Eliminar')).toBeUndefined();
    });

    it('con equipo (200) muestra Mi equipo y el listado sin botón "Unirme"', async () => {
      await responder(miEquipo);
      await responderLista([otro]);

      expect(raiz.querySelector('app-mi-equipo')).not.toBeNull();
      expect(raiz.textContent).toContain('3/5 integrantes');
      expect(raiz.textContent).not.toContain('Crear mi equipo');
      expect(raiz.querySelector('.aviso')).toBeNull();
      expect(boton('Unirme')).toBeUndefined();
    });

    it('al crear un equipo lo muestra con un aviso y recarga el listado', async () => {
      await responder(null);
      await responderLista([]);

      const escribir = async (selector: string, valor: string) => {
        const campo = raiz.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
        campo.value = valor;
        campo.dispatchEvent(new Event('input'));
        await fixture.whenStable();
      };
      await escribir('input[name="nombre"]', 'Los Halcones');
      await escribir('textarea[name="descripcion"]', 'Jugamos los jueves');
      raiz.querySelector('form')!.dispatchEvent(new Event('submit'));
      await fixture.whenStable();

      http
        .expectOne((r) => r.url === urlEquipos && r.method === 'POST')
        .flush(equipoDePrueba({ cantidadMiembros: 1, miembros: [{ id: 3, nombre: 'juan' }] }), { status: 201, statusText: 'Created' });
      await fixture.whenStable();
      await responderLista([equipoDePrueba({ cantidadMiembros: 1 })]);

      expect(raiz.querySelector('.aviso')!.textContent).toContain('Equipo creado correctamente');
      expect(raiz.textContent).toContain('1/5 integrantes');
      expect(boton('Unirme')).toBeUndefined();
    });

    it('al unirse a un equipo del listado pasa a verlo como "Mi equipo"', async () => {
      await responder(null);
      await responderLista([otro]);

      boton('Unirme').click();
      await fixture.whenStable();
      http.expectOne(`${urlEquipos}/2/miembros`).flush(equipoDePrueba({ id: 2, nombre: 'Los Cóndores', cantidadMiembros: 3 }));
      await fixture.whenStable();
      await responderLista([equipoDePrueba({ id: 2, nombre: 'Los Cóndores', cantidadMiembros: 3 })]);

      expect(raiz.querySelector('app-mi-equipo')).not.toBeNull();
      expect(raiz.querySelector('app-mi-equipo h3')!.textContent).toContain('Los Cóndores');
      expect(raiz.textContent).not.toContain('Crear mi equipo');
      expect(boton('Unirme')).toBeUndefined();
    });

    it('al abandonar vuelve el formulario de creación y "Unirme", y se recarga el listado', async () => {
      await responder(miEquipo);
      await responderLista([miEquipo, otro]);

      boton('Abandonar equipo').click();
      await fixture.whenStable();
      boton('Sí, abandonar').click();
      await fixture.whenStable();
      http.expectOne(`${urlEquipos}/1/miembros/me`).flush(null, { status: 204, statusText: 'No Content' });
      await fixture.whenStable();
      await responderLista([otro]);

      expect(raiz.querySelector('app-mi-equipo')).toBeNull();
      expect(raiz.textContent).toContain('Crear mi equipo');
      expect(boton('Unirme')).toBeTruthy();
    });

    it('al editar su equipo se actualiza la tarjeta y el listado', async () => {
      await responder(miEquipo);
      await responderLista([miEquipo]);

      boton('Editar').click();
      await fixture.whenStable();
      const nombre = raiz.querySelector<HTMLInputElement>('app-mi-equipo input[name="nombre"]')!;
      nombre.value = 'Halcones FC';
      nombre.dispatchEvent(new Event('input'));
      await fixture.whenStable();
      raiz.querySelector('app-mi-equipo form')!.dispatchEvent(new Event('submit'));
      await fixture.whenStable();
      http.expectOne(`${urlEquipos}/1`).flush({ ...miEquipo, nombre: 'Halcones FC' });
      await fixture.whenStable();
      await responderLista([{ ...miEquipo, nombre: 'Halcones FC' }]);

      expect(raiz.querySelector('app-mi-equipo h3')!.textContent).toContain('Halcones FC');
    });

    it('muestra el error y permite reintentar si la API falla', async () => {
      http.expectOne(urlMio).flush({ detail: 'Ocurrió un error inesperado' }, { status: 500, statusText: 'Server Error' });
      await fixture.whenStable();

      expect(raiz.querySelector('.error.general')!.textContent).toContain('Ocurrió un error inesperado');
      expect(raiz.querySelector('form')).toBeNull();

      raiz.querySelector<HTMLButtonElement>('.reintentar')!.click();
      await fixture.whenStable();
      await responder(miEquipo);
      await responderLista([]);

      expect(raiz.querySelector('.error')).toBeNull();
      expect(raiz.textContent).toContain('Los Halcones');
    });

    it('avisa si no hay conexión con el servidor', async () => {
      http.expectOne(urlMio).error(new ProgressEvent('error'));
      await fixture.whenStable();

      expect(raiz.querySelector('.error.general')!.textContent).toContain('No se pudo conectar con el servidor');
    });
  });

  describe('como owner', () => {
    beforeEach(() => abrirPantalla('OWNER'));

    it('no consulta "mi equipo", no ofrece crear y puede eliminar equipos del listado', async () => {
      http.expectNone(urlMio);
      await responderLista([otro]);

      expect(raiz.querySelector('form.formulario')).toBeNull();
      expect(raiz.textContent).toContain('no puede crear uno propio');
      expect(boton('Eliminar')).toBeTruthy();
      expect(boton('Unirme')).toBeUndefined();
    });
  });
});
