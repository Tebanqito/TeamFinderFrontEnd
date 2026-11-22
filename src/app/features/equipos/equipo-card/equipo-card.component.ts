import { Component, computed, input, output, signal } from '@angular/core';

import { EquipoDetalle, nombreDeTipo } from '../../../core/models/equipo.model';

/** Tarjeta de un equipo del listado. Los botones aparecen según lo que el usuario puede hacer. */
@Component({
  selector: 'app-equipo-card',
  templateUrl: './equipo-card.component.html',
})
export class EquipoCardComponent {
  readonly equipo = input.required<EquipoDetalle>();
  readonly puedeUnirse = input(false);
  readonly puedeEliminar = input(false);
  /** Mientras la API responde se bloquean los botones. */
  readonly ocupado = input(false);

  readonly unirse = output<EquipoDetalle>();
  readonly eliminar = output<EquipoDetalle>();

  protected readonly confirmando = signal(false);

  protected readonly tipo = computed(() => nombreDeTipo(this.equipo().tipo));
  protected readonly porcentajeCupo = computed(() => (this.equipo().cantidadMiembros / this.equipo().cupo) * 100);
  protected readonly completo = computed(() => this.equipo().cantidadMiembros >= this.equipo().cupo);

  protected confirmarEliminar(): void {
    this.confirmando.set(false);
    this.eliminar.emit(this.equipo());
  }
}
