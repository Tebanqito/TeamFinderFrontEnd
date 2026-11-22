import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { UsuarioDetalle } from '../../../core/models/usuario.model';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { paginaDePrueba, usuarioDePrueba } from '../../../core/testing/datos-prueba';
import { UsuariosComponent } from './usuarios.component';

describe('UsuariosComponent', () => {
  const url = `${environment.apiUrl}/usuarios`;
  let fixture: ComponentFixture<UsuariosComponent>;
  let http: HttpTestingController;
  let raiz: HTMLElement;
  let avisos: NotificacionService;

  const owner = usuarioDePrueba({ id: 1, nombre: 'owner', email: 'owner@mail.com', rol: 'OWNER' });
  const ana = usuarioDePrueba({ id: 2, nombre: 'ana', email: 'ana@mail.com', equipoId: 4, equipoNombre: 'Halcones' });
  const beto = usuarioDePrueba({ id: 3, nombre: 'beto', email: 'beto@mail.com' });

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [UsuariosComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    TestBed.inject(AuthService).sesion.set({ token: 't', email: 'owner@mail.com', rol: 'OWNER' });
    http = TestBed.inject(HttpTestingController);
    avisos = TestBed.inject(NotificacionService);
    fixture = TestBed.createComponent(UsuariosComponent);
    raiz = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  const pedido = () => http.expectOne((r) => r.url === url && r.method === 'GET');
  const listar = async (usuarios: UsuarioDetalle[], extra: Partial<{ totalElementos: number; pagina: number }> = {}) => {
    pedido().flush(paginaDePrueba(usuarios, { tamanio: 20, ...extra }));
    await fixture.whenStable();
  };
  const boton = (texto: string) =>
    Array.from(raiz.querySelectorAll('button')).find((b) => b.textContent?.trim() === texto) as HTMLButtonElement;

  it('al abrirse pide la primera página (20) sin filtro y muestra "Cargando"', () => {
    expect(raiz.textContent).toContain('Cargando usuarios');
    const req = pedido();
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    expect(req.request.params.has('nombre')).toBe(false);
  });

  it('muestra "Mostrando X de Y" y una fila por usuario', async () => {
    await listar([owner, ana, beto], { totalElementos: 3 });

    expect(raiz.textContent).toContain('Mostrando 3 de 3');
    expect(raiz.querySelectorAll('app-usuario-fila').length).toBe(3);
    expect(raiz.querySelector('app-usuario-fila:nth-of-type(2) .chip')!.textContent).toBe('Halcones');
    expect(boton('Ver más')).toBeUndefined();
  });

  it('el owner no ve el botón Eliminar en su propia fila pero sí en las demás', async () => {
    await listar([owner, ana], { totalElementos: 2 });

    const filas = Array.from(raiz.querySelectorAll('app-usuario-fila'));
    expect(filas[0].querySelector('button')).toBeNull();
    expect(filas[1].querySelector('button')!.textContent).toContain('Eliminar');
  });

  it('sin resultados muestra el mensaje', async () => {
    await listar([], { totalElementos: 0 });

    expect(raiz.textContent).toContain('Mostrando 0 de 0');
    expect(raiz.textContent).toContain('No se encontraron usuarios con ese nombre.');
  });

  it('busca mientras se escribe, esperando un instante, y vuelve a la primera página', async () => {
    await listar([ana, beto], { totalElementos: 2 });
    vi.useFakeTimers();

    const campo = raiz.querySelector<HTMLInputElement>('input[type="search"]')!;
    campo.value = 'an';
    campo.dispatchEvent(new Event('input'));
    campo.value = 'ana';
    campo.dispatchEvent(new Event('input'));
    http.expectNone((r) => r.url === url);

    vi.advanceTimersByTime(300);
    const req = pedido();
    expect(req.request.params.get('nombre')).toBe('ana');
    expect(req.request.params.get('page')).toBe('0');
    req.flush(paginaDePrueba([ana], { totalElementos: 1 }));
    await fixture.whenStable();

    expect(raiz.textContent).toContain('Mostrando 1 de 1');
    expect(raiz.querySelectorAll('app-usuario-fila').length).toBe(1);
  });

  it('una respuesta vieja que llega después de una búsqueda nueva se descarta', async () => {
    await listar([ana, beto], { totalElementos: 2 });
    vi.useFakeTimers();
    const campo = raiz.querySelector<HTMLInputElement>('input[type="search"]')!;

    campo.value = 'a';
    campo.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(300);
    const primera = pedido();
    campo.value = 'beto';
    campo.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(300);
    const segunda = pedido();

    segunda.flush(paginaDePrueba([beto], { totalElementos: 1 }));
    primera.flush(paginaDePrueba([ana, beto, owner], { totalElementos: 3 }));
    await fixture.whenStable();

    expect(raiz.textContent).toContain('Mostrando 1 de 1');
  });

  it('"Ver más" pide la página siguiente y la suma a la lista; desaparece cuando se mostró todo', async () => {
    await listar([ana, beto], { totalElementos: 3 });
    expect(raiz.textContent).toContain('Mostrando 2 de 3');

    boton('Ver más').click();
    await fixture.whenStable();
    const req = pedido();
    expect(req.request.params.get('page')).toBe('1');
    req.flush(paginaDePrueba([owner], { totalElementos: 3, pagina: 1 }));
    await fixture.whenStable();

    expect(raiz.textContent).toContain('Mostrando 3 de 3');
    expect(raiz.querySelectorAll('app-usuario-fila').length).toBe(3);
    expect(boton('Ver más')).toBeUndefined();
  });

  it('eliminar manda DELETE, avisa y vuelve a pedir la lista', async () => {
    await listar([owner, ana], { totalElementos: 2 });

    const fila = raiz.querySelectorAll('app-usuario-fila')[1];
    (Array.from(fila.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Eliminar') as HTMLButtonElement).click();
    await fixture.whenStable();
    (Array.from(fila.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Sí, eliminar') as HTMLButtonElement).click();
    await fixture.whenStable();

    const req = http.expectOne(`${url}/2`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();

    expect(avisos.actual()).toEqual({ tipo: 'exito', texto: 'Se eliminó a ana.' });
    await listar([owner], { totalElementos: 1 });
    expect(raiz.textContent).toContain('Mostrando 1 de 1');
    expect(raiz.querySelectorAll('app-usuario-fila').length).toBe(1);
  });

  it('al eliminar con varias páginas abiertas se vuelven a pedir todas, para que no se corra ningún usuario', async () => {
    await listar([owner, ana], { totalElementos: 3 });
    boton('Ver más').click();
    await fixture.whenStable();
    pedido().flush(paginaDePrueba([beto], { totalElementos: 3, pagina: 1 }));
    await fixture.whenStable();

    const fila = raiz.querySelectorAll('app-usuario-fila')[1];
    (Array.from(fila.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Eliminar') as HTMLButtonElement).click();
    await fixture.whenStable();
    (Array.from(fila.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Sí, eliminar') as HTMLButtonElement).click();
    await fixture.whenStable();
    http.expectOne(`${url}/2`).flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();

    const pedidos = http.match((r) => r.url === url && r.method === 'GET');
    expect(pedidos.map((p) => p.request.params.get('page'))).toEqual(['0', '1']);
    pedidos[0].flush(paginaDePrueba([owner, beto], { totalElementos: 2 }));
    pedidos[1].flush(paginaDePrueba([], { totalElementos: 2, pagina: 1 }));
    await fixture.whenStable();

    expect(raiz.textContent).toContain('Mostrando 2 de 2');
  });

  it('si la API rechaza la eliminación muestra el motivo y no recarga', async () => {
    await listar([owner, ana], { totalElementos: 2 });

    const fila = raiz.querySelectorAll('app-usuario-fila')[1];
    (Array.from(fila.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Eliminar') as HTMLButtonElement).click();
    await fixture.whenStable();
    (Array.from(fila.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Sí, eliminar') as HTMLButtonElement).click();
    await fixture.whenStable();
    http.expectOne(`${url}/2`).flush({ detail: 'Usuario con id 2 no encontrado' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();

    expect(avisos.actual()).toEqual({ tipo: 'error', texto: 'Usuario con id 2 no encontrado' });
  });

  it('muestra el error de carga y permite reintentar', async () => {
    pedido().flush({ detail: 'Ocurrió un error inesperado' }, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    expect(raiz.querySelector('.error.general')!.textContent).toContain('Ocurrió un error inesperado');

    boton('Reintentar').click();
    await fixture.whenStable();
    await listar([ana], { totalElementos: 1 });

    expect(raiz.querySelector('.error')).toBeNull();
    expect(raiz.querySelectorAll('app-usuario-fila').length).toBe(1);
  });
});
