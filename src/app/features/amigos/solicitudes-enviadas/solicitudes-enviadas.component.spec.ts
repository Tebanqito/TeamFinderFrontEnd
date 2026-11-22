import { TestBed } from '@angular/core/testing';

import { solicitudDePrueba } from '../../../core/testing/datos-prueba';
import { SolicitudesEnviadasComponent } from './solicitudes-enviadas.component';

describe('SolicitudesEnviadasComponent', () => {
  const abrir = async (solicitudes: ReturnType<typeof solicitudDePrueba>[]) => {
    await TestBed.configureTestingModule({ imports: [SolicitudesEnviadasComponent] }).compileComponents();
    const fixture = TestBed.createComponent(SolicitudesEnviadasComponent);
    fixture.componentRef.setInput('solicitudes', solicitudes);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  it('sin solicitudes muestra el mensaje vacío', async () => {
    const raiz = await abrir([]);

    expect(raiz.textContent).toContain('Todavía no enviaste solicitudes.');
  });

  it('muestra el destinatario y el estado de cada solicitud', async () => {
    const raiz = await abrir([
      solicitudDePrueba({ destinatario: { id: 20, nombre: 'ana' }, estado: 'PENDIENTE' }),
      solicitudDePrueba({ id: 2, destinatario: { id: 21, nombre: 'beto' }, estado: 'RECHAZADA' }),
    ]);

    const filas = Array.from(raiz.querySelectorAll('p')).map((p) => p.textContent!.replace(/\s+/g, ' ').trim());
    expect(filas).toEqual(['ana PENDIENTE', 'beto RECHAZADA']);
  });
});
