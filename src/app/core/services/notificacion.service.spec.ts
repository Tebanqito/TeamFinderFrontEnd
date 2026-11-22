import { TestBed } from '@angular/core/testing';

import { NotificacionService } from './notificacion.service';

describe('NotificacionService', () => {
  let servicio: NotificacionService;

  beforeEach(() => {
    vi.useFakeTimers();
    servicio = TestBed.inject(NotificacionService);
  });

  afterEach(() => vi.useRealTimers());

  it('muestra un aviso de éxito o de error', () => {
    servicio.exito('Listo');
    expect(servicio.actual()).toEqual({ tipo: 'exito', texto: 'Listo' });

    servicio.error('Falló');
    expect(servicio.actual()).toEqual({ tipo: 'error', texto: 'Falló' });
  });

  it('se cierra solo a los 4 segundos', () => {
    servicio.exito('Listo');
    vi.advanceTimersByTime(3999);
    expect(servicio.actual()).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(servicio.actual()).toBeNull();
  });

  it('un aviso nuevo reinicia el tiempo del anterior', () => {
    servicio.exito('Uno');
    vi.advanceTimersByTime(3000);
    servicio.exito('Dos');
    vi.advanceTimersByTime(3000);
    expect(servicio.actual()?.texto).toBe('Dos');
  });

  it('cerrar lo quita enseguida', () => {
    servicio.exito('Listo');
    servicio.cerrar();
    expect(servicio.actual()).toBeNull();
  });
});
