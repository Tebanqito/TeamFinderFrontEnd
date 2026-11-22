import { Component, input, output } from '@angular/core';

import { Cruce, EquipoResumen } from '../../../core/models/torneo.model';
import { Llave } from '../../../core/models/torneo.model';

/** El owner eligió quién ganó un cruce. */
export interface GanadorElegido {
  cruce: Cruce;
  ganador: EquipoResumen;
}

/**
 * Llaves de eliminación directa: una columna por ronda, con líneas que conectan cada cruce con el siguiente.
 * Los cruces los calcula la API; acá solo se dibujan. El owner puede cargar o borrar resultados si hay permiso.
 */
@Component({
  selector: 'app-llaves',
  templateUrl: './llaves.component.html',
  styleUrl: './llaves.component.css',
})
export class LlavesComponent {
  readonly llave = input.required<Llave>();
  /** Solo el owner, y solo con el torneo activo, puede cargar o borrar resultados. */
  readonly editable = input(false);

  readonly ganador = output<GanadorElegido>();
  readonly borrar = output<Cruce>();

  protected readonly potenciaDeDos = (k: number) => 2 ** k;

  /** Estilo de cada equipo de un cruce: ganó, perdió o todavía no se sabe. */
  protected estado(cruce: Cruce, equipo: EquipoResumen | null): 'w' | 'l' | '' {
    if (!cruce.ganador || cruce.paseDirecto || !equipo) {
      return '';
    }
    return equipo.id === cruce.ganador.id ? 'w' : 'l';
  }

  protected textoVacio(cruce: Cruce): string {
    return cruce.paseDirecto ? 'Pasa directo' : 'Por definir';
  }

  /** Se pueden cargar resultados solo cuando ya se conocen los dos equipos del cruce. */
  protected puedeEditar(cruce: Cruce): boolean {
    return this.editable() && !!cruce.equipoUno && !!cruce.equipoDos;
  }
}
