import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { EquipoDetalle } from '../../../core/models/equipo.model';
import { AuthService } from '../../../core/services/auth.service';
import { EquiposComponent } from './equipos.component';

describe('EquiposComponent', () => {
  const urlMio = `${environment.apiUrl}/equipos/mio`;
  const urlCrear = `${environment.apiUrl}/equipos`;
  let fixture: ComponentFixture<EquiposComponent>;
  let http: HttpTestingController;
  let raiz: HTMLElement;

  const equipo: EquipoDetalle = {
    id: 1,
    nombre: 'Los Halcones',
    descripcion: 'Jugamos los jueves',
    tipo: 'FUTBOL_5',
    cupo: 5,
    cantidadMiembros: 3,
    miembros: [
      { id: 3, nombre: 'juan' },
      { id: 4, nombre: 'pedro' },
      { id: 5, nombre: 'lucas' },
    ],
  };

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

  afterEach(() => http.verify());

  describe('como usuario', () => {
    beforeEach(() => abrirPantalla());

    it('le pregunta a la API por su equipo y muestra "Cargando" mientras espera', () => {
      expect(http.expectOne(urlMio).request.method).toBe('GET');
      expect(raiz.textContent).toContain('Cargando tu equipo');
      expect(raiz.querySelector('form')).toBeNull();
    });

    it('muestra el formulario para crear un equipo si todavía no pertenece a ninguno (204)', async () => {
      await responder(null);

      expect(raiz.textContent).not.toContain('Cargando');
      expect(raiz.querySelector('form')).not.toBeNull();
      expect(raiz.textContent).toContain('Crear mi equipo');
      expect(raiz.querySelector('app-mi-equipo')).toBeNull();
    });

    it('muestra su equipo y no el formulario si ya pertenece a uno (200)', async () => {
      await responder(equipo);

      expect(raiz.querySelector('form')).toBeNull();
      expect(raiz.textContent).toContain('Mi equipo');
      expect(raiz.textContent).toContain('Los Halcones');
      expect(raiz.textContent).toContain('3/5 integrantes');
      expect(raiz.querySelector('.aviso')).toBeNull();
    });

    it('al crear un equipo pasa a mostrarlo con un aviso, sin volver a consultar la API', async () => {
      await responder(null);

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
        .expectOne(urlCrear)
        .flush({ ...equipo, cantidadMiembros: 1, miembros: [equipo.miembros[0]] }, { status: 201, statusText: 'Created' });
      await fixture.whenStable();

      expect(raiz.querySelector('form')).toBeNull();
      expect(raiz.querySelector('.aviso')!.textContent).toContain('Equipo creado correctamente');
      expect(raiz.textContent).toContain('Mi equipo');
      expect(raiz.textContent).toContain('1/5 integrantes');
    });

    it('muestra el error y permite reintentar si la API falla', async () => {
      http.expectOne(urlMio).flush({ detail: 'Ocurrió un error inesperado' }, { status: 500, statusText: 'Server Error' });
      await fixture.whenStable();

      expect(raiz.querySelector('.error.general')!.textContent).toContain('Ocurrió un error inesperado');
      expect(raiz.querySelector('form')).toBeNull();

      raiz.querySelector<HTMLButtonElement>('.reintentar')!.click();
      await fixture.whenStable();
      await responder(equipo);

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

    it('no consulta ningún equipo y explica que no puede crear uno', () => {
      http.expectNone(urlMio);
      expect(raiz.querySelector('form')).toBeNull();
      expect(raiz.textContent).toContain('no puede crear uno propio');
    });
  });
});
