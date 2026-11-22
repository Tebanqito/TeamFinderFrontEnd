import { ComponentFixture, TestBed } from '@angular/core/testing';

import { equipoDePrueba } from '../../../core/testing/datos-prueba';
import { EquipoCardComponent } from './equipo-card.component';

describe('EquipoCardComponent', () => {
  let fixture: ComponentFixture<EquipoCardComponent>;
  let raiz: HTMLElement;

  const abrir = async (entradas: Record<string, unknown> = {}) => {
    await TestBed.configureTestingModule({ imports: [EquipoCardComponent] }).compileComponents();
    fixture = TestBed.createComponent(EquipoCardComponent);
    fixture.componentRef.setInput('equipo', equipoDePrueba());
    for (const [nombre, valor] of Object.entries(entradas)) {
      fixture.componentRef.setInput(nombre, valor);
    }
    raiz = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  };

  const boton = (texto: string) =>
    Array.from(raiz.querySelectorAll('button')).find((b) => b.textContent?.includes(texto)) as HTMLButtonElement | undefined;

  it('muestra nombre, tipo, descripción, cupo e integrantes', async () => {
    await abrir();

    expect(raiz.querySelector('h3')!.textContent).toContain('Los Halcones');
    expect(raiz.querySelector('.badge')!.textContent).toContain('Fútbol 5');
    expect(raiz.textContent).toContain('Jugamos los jueves');
    expect(raiz.textContent).toContain('2/5 integrantes');
    expect(Array.from(raiz.querySelectorAll('.chip')).map((c) => c.textContent?.trim())).toEqual(['juan', 'pedro']);
  });

  it('sin permisos no muestra ningún botón', async () => {
    await abrir();
    expect(raiz.querySelectorAll('button').length).toBe(0);
  });

  it('"Unirme" emite el equipo', async () => {
    await abrir({ puedeUnirse: true });
    let emitido: unknown;
    fixture.componentInstance.unirse.subscribe((e) => (emitido = e));

    boton('Unirme')!.click();

    expect(emitido).toEqual(equipoDePrueba());
  });

  it('si el equipo está completo no deja unirse', async () => {
    await abrir({ puedeUnirse: true, equipo: equipoDePrueba({ cantidadMiembros: 5 }) });

    const b = boton('Equipo completo')!;
    expect(b.disabled).toBe(true);
    expect(boton('Unirme')).toBeUndefined();
  });

  it('mientras hay una operación en curso los botones quedan bloqueados', async () => {
    await abrir({ puedeUnirse: true, puedeEliminar: true, ocupado: true });

    expect(boton('Unirme')!.disabled).toBe(true);
    expect(boton('Eliminar')!.disabled).toBe(true);
  });

  it('eliminar pide confirmación y recién al confirmar emite', async () => {
    await abrir({ puedeEliminar: true });
    let emitido: unknown;
    fixture.componentInstance.eliminar.subscribe((e) => (emitido = e));

    boton('Eliminar')!.click();
    await fixture.whenStable();
    expect(emitido).toBeUndefined();
    expect(raiz.textContent).toContain('quedarán sin equipo');

    boton('Sí, eliminar')!.click();
    await fixture.whenStable();
    expect(emitido).toEqual(equipoDePrueba());
    expect(raiz.querySelector('.confirmacion')).toBeNull();
  });

  it('cancelar la confirmación no elimina nada', async () => {
    await abrir({ puedeEliminar: true });
    let emitido = false;
    fixture.componentInstance.eliminar.subscribe(() => (emitido = true));

    boton('Eliminar')!.click();
    await fixture.whenStable();
    boton('Cancelar')!.click();
    await fixture.whenStable();

    expect(emitido).toBe(false);
    expect(raiz.querySelector('.confirmacion')).toBeNull();
  });
});
