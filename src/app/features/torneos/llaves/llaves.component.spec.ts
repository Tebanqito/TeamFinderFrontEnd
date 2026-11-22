import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Cruce, Llave } from '../../../core/models/torneo.model';
import { llaveDePrueba } from '../../../core/testing/datos-prueba';
import { GanadorElegido, LlavesComponent } from './llaves.component';

describe('LlavesComponent', () => {
  let fixture: ComponentFixture<LlavesComponent>;
  let raiz: HTMLElement;

  const abrir = async (llave: Llave = llaveDePrueba(), editable = false) => {
    await TestBed.configureTestingModule({ imports: [LlavesComponent] }).compileComponents();
    fixture = TestBed.createComponent(LlavesComponent);
    fixture.componentRef.setInput('llave', llave);
    fixture.componentRef.setInput('editable', editable);
    raiz = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  };

  const textos = (selector: string) => Array.from(raiz.querySelectorAll(selector)).map((e) => e.textContent?.trim());

  it('dibuja una columna por ronda con su nombre', async () => {
    await abrir();

    expect(textos('.rt')).toEqual(['Semifinales', 'Final']);
    expect(raiz.querySelectorAll('.col').length).toBe(2);
    expect(raiz.querySelectorAll('.mw').length).toBe(3);
  });

  it('muestra los equipos de cada cruce y "Por definir" donde todavía no se sabe', async () => {
    await abrir();

    expect(textos('.t')).toEqual(['Halcones', 'Leones', 'Tigres', 'Pumas', 'Por definir', 'Por definir']);
    expect(raiz.querySelectorAll('.t.x').length).toBe(2);
  });

  it('las rondas anteriores a la final tienen línea hacia la siguiente y la final no', async () => {
    await abrir();

    const cruces = Array.from(raiz.querySelectorAll('.mw'));
    expect(cruces.map((c) => c.classList.contains('n'))).toEqual([true, true, false]);
    expect(cruces.map((c) => c.classList.contains('k'))).toEqual([false, false, true]);
    // Conectores: el primer cruce baja y el segundo sube
    expect(raiz.querySelectorAll('.v.d').length).toBe(1);
    expect(raiz.querySelectorAll('.v.u').length).toBe(1);
  });

  it('cada ronda ocupa el doble de filas que la anterior para quedar centrada', async () => {
    await abrir();

    const filas = Array.from(raiz.querySelectorAll<HTMLElement>('.mw')).map((c) => c.style.gridRow);
    expect(filas).toEqual(['span 1', 'span 1', 'span 2']);
  });

  it('marca al ganador y tacha al perdedor cuando el cruce tiene resultado', async () => {
    const llave = llaveDePrueba();
    llave.rondas[0].cruces[0].partidoId = 5;
    llave.rondas[0].cruces[0].ganador = llave.rondas[0].cruces[0].equipoUno;
    await abrir(llave);

    const [uno, dos] = Array.from(raiz.querySelectorAll('.mw')[0].querySelectorAll('.t'));
    expect(uno.classList.contains('w')).toBe(true);
    expect(dos.classList.contains('l')).toBe(true);
  });

  it('un pase directo muestra "Pasa directo" y no marca ganador ni perdedor', async () => {
    const llave = llaveDePrueba();
    const cruce = llave.rondas[0].cruces[1];
    cruce.equipoDos = null;
    cruce.paseDirecto = true;
    cruce.ganador = cruce.equipoUno;
    await abrir(llave);

    expect(textos('.mw:nth-child(2) .t')).toEqual(['Tigres', 'Pasa directo']);
    expect(raiz.querySelectorAll('.t.w, .t.l').length).toBe(0);
  });

  it('sin permiso de edición no hay botones', async () => {
    await abrir();

    expect(raiz.querySelectorAll('button').length).toBe(0);
  });

  it('editable: cada cruce con los dos equipos conocidos ofrece un botón por equipo; la final aún no', async () => {
    await abrir(llaveDePrueba(), true);

    expect(textos('.acc button')).toEqual(['Halcones', 'Leones', 'Tigres', 'Pumas']);
    expect(raiz.querySelectorAll('.mw')[2].querySelector('.acc')).toBeNull();
  });

  it('elegir un equipo emite el cruce y el ganador', async () => {
    await abrir(llaveDePrueba(), true);
    let elegido: GanadorElegido | undefined;
    fixture.componentInstance.ganador.subscribe((e) => (elegido = e));

    (raiz.querySelectorAll('.acc button')[1] as HTMLButtonElement).click();

    expect(elegido!.ganador.nombre).toBe('Leones');
    expect(elegido!.cruce.equipoUno!.nombre).toBe('Halcones');
  });

  it('con resultado cargado ofrece "Borrar resultado" en lugar de los equipos', async () => {
    const llave = llaveDePrueba();
    const cruce = llave.rondas[0].cruces[0];
    cruce.partidoId = 5;
    cruce.ganador = cruce.equipoUno;
    await abrir(llave, true);
    let borrado: Cruce | undefined;
    fixture.componentInstance.borrar.subscribe((c) => (borrado = c));

    const botones = Array.from(raiz.querySelectorAll('.mw')[0].querySelectorAll('.acc button'));
    expect(botones.map((b) => b.textContent?.trim())).toEqual(['Borrar resultado']);
    (botones[0] as HTMLButtonElement).click();

    expect(borrado!.partidoId).toBe(5);
  });
});
