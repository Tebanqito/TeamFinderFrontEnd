import { ComponentFixture, TestBed } from '@angular/core/testing';

import { usuarioDePrueba } from '../../../core/testing/datos-prueba';
import { UsuarioFilaComponent } from './usuario-fila.component';

describe('UsuarioFilaComponent', () => {
  let fixture: ComponentFixture<UsuarioFilaComponent>;
  let raiz: HTMLElement;

  const abrir = async (entradas: Record<string, unknown> = {}) => {
    await TestBed.configureTestingModule({ imports: [UsuarioFilaComponent] }).compileComponents();
    fixture = TestBed.createComponent(UsuarioFilaComponent);
    fixture.componentRef.setInput('usuario', usuarioDePrueba());
    for (const [nombre, valor] of Object.entries(entradas)) {
      fixture.componentRef.setInput(nombre, valor);
    }
    raiz = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  };

  const boton = (texto: string) =>
    Array.from(raiz.querySelectorAll('button')).find((b) => b.textContent?.trim() === texto) as HTMLButtonElement | undefined;

  it('muestra nombre, email y rol', async () => {
    await abrir();

    expect(raiz.querySelector('b')!.textContent).toBe('juan');
    expect(raiz.querySelector('.muted')!.textContent).toBe('juan@mail.com');
    expect(raiz.querySelector('.badge')!.textContent).toBe('USUARIO');
  });

  it('muestra el equipo solo si el usuario tiene uno', async () => {
    await abrir();
    expect(raiz.querySelector('.chip')).toBeNull();

    fixture.componentRef.setInput('usuario', usuarioDePrueba({ equipoId: 2, equipoNombre: 'Halcones' }));
    await fixture.whenStable();
    expect(raiz.querySelector('.chip')!.textContent).toBe('Halcones');
  });

  it('sin permiso no muestra el botón Eliminar (el owner no se elimina a sí mismo)', async () => {
    await abrir({ puedeEliminar: false });

    expect(boton('Eliminar')).toBeUndefined();
  });

  it('Eliminar pide confirmación y recién al confirmar emite el usuario', async () => {
    await abrir({ puedeEliminar: true });
    let emitido: unknown;
    fixture.componentInstance.eliminar.subscribe((u) => (emitido = u));

    boton('Eliminar')!.click();
    await fixture.whenStable();
    expect(emitido).toBeUndefined();
    expect(raiz.textContent).toContain('Se borran también sus amistades y solicitudes');

    boton('Sí, eliminar')!.click();
    await fixture.whenStable();
    expect(emitido).toEqual(usuarioDePrueba());
    expect(raiz.querySelector('.confirmacion')).toBeNull();
  });

  it('Cancelar no elimina nada', async () => {
    await abrir({ puedeEliminar: true });
    let emitido = false;
    fixture.componentInstance.eliminar.subscribe(() => (emitido = true));

    boton('Eliminar')!.click();
    await fixture.whenStable();
    boton('Cancelar')!.click();
    await fixture.whenStable();

    expect(emitido).toBe(false);
    expect(boton('Eliminar')).toBeDefined();
  });

  it('con una operación en curso bloquea el botón', async () => {
    await abrir({ puedeEliminar: true, ocupado: true });

    expect(boton('Eliminar')!.disabled).toBe(true);
  });
});
