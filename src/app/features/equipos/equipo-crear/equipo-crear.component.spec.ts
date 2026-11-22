import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { EquipoDetalle } from '../../../core/models/equipo.model';
import { EquipoCrearComponent } from './equipo-crear.component';

describe('EquipoCrearComponent', () => {
  const url = `${environment.apiUrl}/equipos`;
  let fixture: ComponentFixture<EquipoCrearComponent>;
  let http: HttpTestingController;
  let raiz: HTMLElement;
  const creado = vi.fn();

  const escribir = async (selector: string, valor: string) => {
    const campo = raiz.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };

  const elegirTipo = async (indice: number) => {
    const select = raiz.querySelector<HTMLSelectElement>('select[name="tipo"]')!;
    select.selectedIndex = indice;
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
  };

  const completarValido = async () => {
    await escribir('input[name="nombre"]', 'Los Halcones');
    await escribir('textarea[name="descripcion"]', 'Jugamos los jueves');
  };

  const enviar = async () => {
    raiz.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  };

  const equipoCreado = (sobre: Partial<EquipoDetalle> = {}): EquipoDetalle => ({
    id: 1,
    nombre: 'Los Halcones',
    descripcion: 'Jugamos los jueves',
    tipo: 'FUTBOL_5',
    cupo: 5,
    cantidadMiembros: 1,
    miembros: [{ id: 3, nombre: 'juan' }],
    ...sobre,
  });

  beforeEach(async () => {
    creado.mockReset();
    await TestBed.configureTestingModule({
      imports: [EquipoCrearComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(EquipoCrearComponent);
    fixture.componentInstance.creado.subscribe(creado);
    raiz = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('muestra el formulario con nombre, tipo y descripción', () => {
    expect(raiz.querySelector('input[name="nombre"]')).not.toBeNull();
    expect(raiz.querySelector('select[name="tipo"]')).not.toBeNull();
    expect(raiz.querySelector('textarea[name="descripcion"]')).not.toBeNull();
    expect(raiz.querySelectorAll('select option').length).toBe(2);
  });

  it('no llama a la API y marca los campos obligatorios si el formulario está vacío', async () => {
    await enviar();

    http.expectNone(url);
    expect(raiz.querySelectorAll('.error').length).toBe(2);
    expect(raiz.textContent).toContain('Este campo es obligatorio');
    expect(creado).not.toHaveBeenCalled();
  });

  it('crea un equipo de fútbol 5 y avisa con el evento "creado"', async () => {
    await completarValido();
    await enviar();

    const req = http.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nombre: 'Los Halcones', descripcion: 'Jugamos los jueves', tipo: 'FUTBOL_5' });
    req.flush(equipoCreado(), { status: 201, statusText: 'Created' });
    await fixture.whenStable();

    expect(creado).toHaveBeenCalledWith(equipoCreado());
  });

  it('crea un equipo de fútbol 11 cuando se elige ese tipo', async () => {
    await completarValido();
    await elegirTipo(1);
    await enviar();

    const req = http.expectOne(url);
    expect(req.request.body.tipo).toBe('FUTBOL_11');
    req.flush(equipoCreado({ tipo: 'FUTBOL_11', cupo: 11 }), { status: 201, statusText: 'Created' });
    await fixture.whenStable();

    expect(creado).toHaveBeenCalledOnce();
  });

  it('muestra debajo del nombre el 409 de nombre repetido', async () => {
    await completarValido();
    await enviar();

    http
      .expectOne(url)
      .flush({ detail: 'Ya existe un equipo con ese nombre' }, { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();

    const errores = Array.from(raiz.querySelectorAll('.error:not(.general)')).map((e) => e.textContent);
    expect(errores).toContain('Ya existe un equipo con ese nombre');
    expect(raiz.querySelector('.error.general')).toBeNull();
    expect(creado).not.toHaveBeenCalled();
  });

  it('avisa si el usuario ya pertenece a un equipo', async () => {
    await completarValido();
    await enviar();

    http
      .expectOne(url)
      .flush(
        { detail: 'Ya pertenecés a un equipo: abandonalo antes de crear uno nuevo' },
        { status: 409, statusText: 'Conflict' },
      );
    await fixture.whenStable();

    expect(raiz.querySelector('.error.general')!.textContent).toContain('Ya pertenecés a un equipo');
  });

  it('muestra los errores por campo del 400 de la API', async () => {
    await completarValido();
    await enviar();

    http.expectOne(url).flush(
      { detail: 'Hay errores de validación en la petición', errores: { descripcion: 'no debe estar vacío' } },
      { status: 400, statusText: 'Bad Request' },
    );
    await fixture.whenStable();

    expect(raiz.textContent).toContain('no debe estar vacío');
  });

  it('avisa si no hay conexión con el servidor', async () => {
    await completarValido();
    await enviar();

    http.expectOne(url).error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(raiz.querySelector('.error.general')!.textContent).toContain('No se pudo conectar con el servidor');
  });

  it('vuelve a habilitar el botón después de un error', async () => {
    await completarValido();
    await enviar();
    http.expectOne(url).flush({ detail: 'Error' }, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    expect(raiz.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(false);
  });
});
