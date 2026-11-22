import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { Amigo } from '../../../core/models/amigo.model';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { amigoDePrueba } from '../../../core/testing/datos-prueba';
import { AmigosListaComponent } from './amigos-lista.component';

describe('AmigosListaComponent', () => {
  let fixture: ComponentFixture<AmigosListaComponent>;
  let http: HttpTestingController;
  let raiz: HTMLElement;
  let avisos: NotificacionService;
  let quitados = 0;

  const abrir = async (amigos: Amigo[]) => {
    quitados = 0;
    await TestBed.configureTestingModule({
      imports: [AmigosListaComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    avisos = TestBed.inject(NotificacionService);
    fixture = TestBed.createComponent(AmigosListaComponent);
    fixture.componentRef.setInput('amigos', amigos);
    fixture.componentInstance.quitado.subscribe(() => quitados++);
    raiz = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  };

  afterEach(() => http.verify());

  it('sin amigos muestra el mensaje vacío', async () => {
    await abrir([]);

    expect(raiz.textContent).toContain('Todavía no tenés amigos.');
  });

  it('lista los amigos con un botón Quitar cada uno', async () => {
    await abrir([amigoDePrueba(), amigoDePrueba({ id: 10, nombre: 'ana' })]);

    expect(raiz.querySelectorAll('p').length).toBe(2);
    expect(raiz.textContent).toContain('lucas');
    expect(raiz.textContent).toContain('ana');
    expect(raiz.querySelectorAll('button').length).toBe(2);
  });

  it('Quitar manda DELETE /amigos/{id}, avisa y pide refrescar', async () => {
    await abrir([amigoDePrueba()]);

    raiz.querySelector('button')!.click();
    await fixture.whenStable();
    const req = http.expectOne(`${environment.apiUrl}/amigos/9`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();

    expect(avisos.actual()).toEqual({ tipo: 'exito', texto: 'lucas ya no está en tu lista de amigos.' });
    expect(quitados).toBe(1);
  });

  it('si la API falla muestra el error', async () => {
    await abrir([amigoDePrueba()]);

    raiz.querySelector('button')!.click();
    await fixture.whenStable();
    http
      .expectOne(`${environment.apiUrl}/amigos/9`)
      .flush({ detail: 'Ese usuario no está en tu lista de amigos' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();

    expect(avisos.actual()).toEqual({ tipo: 'error', texto: 'Ese usuario no está en tu lista de amigos' });
  });
});
