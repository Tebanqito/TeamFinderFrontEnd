import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { llaveDePrueba, paginaDePrueba, torneoDePrueba, torneoResumenDePrueba } from '../../../core/testing/datos-prueba';
import { TorneosComponent } from './torneos.component';

describe('TorneosComponent', () => {
  const url = `${environment.apiUrl}/torneos`;

  it('muestra el torneo activo y el historial, y al finalizar el torneo actualiza el historial', async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [TorneosComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    TestBed.inject(AuthService).sesion.set({ token: 't', email: 'o@mail.com', rol: 'OWNER' });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(TorneosComponent);
    const raiz = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();

    http.expectOne(`${url}/activo`).flush(torneoDePrueba());
    http.expectOne((r) => r.url === url && r.params.get('estado') === 'FINALIZADO').flush(paginaDePrueba([]));
    await fixture.whenStable();
    http.expectOne(`${url}/1/llaves`).flush(llaveDePrueba());
    await fixture.whenStable();

    expect(raiz.textContent).toContain('Copa Apertura');
    expect(raiz.textContent).toContain('Todavía no hay torneos finalizados.');

    Array.from(raiz.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Finalizar torneo')!.click();
    await fixture.whenStable();
    Array.from(raiz.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Sí, finalizar')!.click();
    await fixture.whenStable();
    http.expectOne(`${url}/1`).flush(torneoDePrueba({ estado: 'FINALIZADO' }));
    await fixture.whenStable();

    // El historial se vuelve a pedir y ahora incluye el torneo finalizado
    http.expectOne((r) => r.url === url && r.params.get('estado') === 'FINALIZADO').flush(paginaDePrueba([torneoResumenDePrueba()]));
    http.expectOne(`${url}/activo`).flush({ detail: 'No hay un torneo activo' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();

    expect(raiz.textContent).toContain('No hay un torneo activo.');
    expect(raiz.querySelectorAll('.ur').length).toBe(1);
    http.verify();
  });
});
