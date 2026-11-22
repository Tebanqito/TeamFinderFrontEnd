import { Component, computed, input } from '@angular/core';

import { EquipoDetalle, nombreDeTipo } from '../../../core/models/equipo.model';

/** Tarjeta con los datos del equipo del usuario: tipo, descripción, cupo e integrantes. */
@Component({
  selector: 'app-mi-equipo',
  templateUrl: './mi-equipo.component.html',
})
export class MiEquipoComponent {
  readonly equipo = input.required<EquipoDetalle>();

  protected readonly tipo = computed(() => nombreDeTipo(this.equipo().tipo));
  protected readonly porcentajeCupo = computed(() => (this.equipo().cantidadMiembros / this.equipo().cupo) * 100);
}
