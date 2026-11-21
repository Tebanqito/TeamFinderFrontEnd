import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquipoDetalle } from '../../../core/models/equipo.model';
import { MiEquipoComponent } from './mi-equipo.component';

describe('MiEquipoComponent', () => {
  let fixture: ComponentFixture<MiEquipoComponent>;
  let raiz: HTMLElement;

  const equipo: EquipoDetalle = {
    id: 7,
    nombre: 'Los Cóndores',
    descripcion: 'Jugamos los sábados',
    tipo: 'FUTBOL_11',
    cupo: 11,
    cantidadMiembros: 2,
    miembros: [
      { id: 3, nombre: 'juan' },
      { id: 4, nombre: 'pedro' },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MiEquipoComponent] }).compileComponents();
    fixture = TestBed.createComponent(MiEquipoComponent);
    fixture.componentRef.setInput('equipo', equipo);
    raiz = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  it('muestra el nombre, el tipo y la descripción del equipo', () => {
    expect(raiz.querySelector('h2')!.textContent).toContain('Mi equipo');
    expect(raiz.querySelector('h3')!.textContent).toContain('Los Cóndores');
    expect(raiz.querySelector('.badge')!.textContent).toContain('Fútbol 11');
    expect(raiz.textContent).toContain('Jugamos los sábados');
  });

  it('muestra el cupo y los integrantes', () => {
    expect(raiz.textContent).toContain('2/11 integrantes');
    expect(Array.from(raiz.querySelectorAll('.chip')).map((c) => c.textContent?.trim())).toEqual(['juan', 'pedro']);
    expect(raiz.querySelector<HTMLElement>('.bar i')!.style.width.startsWith('18.18')).toBe(true);
  });
});
