import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { amigoDePrueba, solicitudDePrueba } from '../../../core/testing/datos-prueba';
import { AmigosComponent } from './amigos.component';

describe('AmigosComponent', () => {
  const url = `${environment.apiUrl}/solicitudes-amistad`;
  const urlAmigos = `${environment.apiUrl}/amigos`;
  let fixture: ComponentFixture<AmigosComponent>;
  let http: HttpTestingController;
  let raiz: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AmigosComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AmigosComponent);
    raiz = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  const responderTodo = async (datos: { recibidas?: unknown[]; enviadas?: unknown[]; amigos?: unknown[] } = {}) => {
    http.expectOne(`${url}/recibidas`).flush(datos.recibidas ?? []);
    http.expectOne(`${url}/enviadas`).flush(datos.enviadas ?? []);
    http.expectOne(urlAmigos).flush(datos.amigos ?? []);
    await fixture.whenStable();
  };

  const boton = (texto: string) =>
    Array.from(raiz.querySelectorAll('button')).find((b) => b.textContent?.trim() === texto) as HTMLButtonElement;

  it('al abrirse pide recibidas, enviadas y amigos, y muestra "Cargando" mientras espera', () => {
    expect(raiz.textContent).toContain('Cargando tus amigos');
    expect(raiz.textContent).toContain('Agregar amigo');

    http.expectOne(`${url}/recibidas`);
    http.expectOne(`${url}/enviadas`);
    http.expectOne(urlAmigos);
  });

  it('muestra las cuatro secciones con lo que devolvió la API', async () => {
    await responderTodo({
      recibidas: [solicitudDePrueba()],
      enviadas: [solicitudDePrueba({ id: 2, destinatario: { id: 21, nombre: 'beto' }, estado: 'ACEPTADA' })],
      amigos: [amigoDePrueba()],
    });

    expect(raiz.querySelector('app-amigo-agregar')).not.toBeNull();
    expect(raiz.querySelector('app-solicitudes-recibidas')!.textContent).toContain('ana');
    expect(raiz.querySelector('app-solicitudes-enviadas')!.textContent).toContain('beto');
    expect(raiz.querySelector('app-amigos-lista')!.textContent).toContain('lucas');
  });

  it('con todo vacío muestra los mensajes de cada sección', async () => {
    await responderTodo();

    expect(raiz.textContent).toContain('No tenés solicitudes pendientes.');
    expect(raiz.textContent).toContain('Todavía no enviaste solicitudes.');
    expect(raiz.textContent).toContain('Todavía no tenés amigos.');
  });

  it('al aceptar una solicitud vuelve a pedir las tres listas', async () => {
    await responderTodo({ recibidas: [solicitudDePrueba()] });

    boton('Aceptar').click();
    await fixture.whenStable();
    http.expectOne(`${url}/1`).flush(solicitudDePrueba({ estado: 'ACEPTADA' }));
    await fixture.whenStable();

    await responderTodo({ amigos: [amigoDePrueba({ id: 20, nombre: 'ana' })] });
    expect(raiz.querySelector('app-solicitudes-recibidas')!.textContent).toContain('No tenés solicitudes pendientes.');
    expect(raiz.querySelector('app-amigos-lista')!.textContent).toContain('ana');
  });

  it('muestra el error y permite reintentar si la API falla', async () => {
    http.expectOne(`${url}/recibidas`).flush({ detail: 'Ocurrió un error inesperado' }, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    http.match(`${url}/enviadas`);
    http.match(urlAmigos);
    await fixture.whenStable();

    expect(raiz.querySelector('.error.general')!.textContent).toContain('Ocurrió un error inesperado');

    boton('Reintentar').click();
    await fixture.whenStable();
    await responderTodo({ amigos: [amigoDePrueba()] });

    expect(raiz.querySelector('.error')).toBeNull();
    expect(raiz.textContent).toContain('lucas');
  });
});
