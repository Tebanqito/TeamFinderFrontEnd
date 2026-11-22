import { Component, input, output, signal } from '@angular/core';

import { UsuarioDetalle } from '../../../core/models/usuario.model';

/** Una fila de la lista de usuarios: nombre, email, rol, equipo y (si corresponde) el botón Eliminar. */
@Component({
  selector: 'app-usuario-fila',
  templateUrl: './usuario-fila.component.html',
  styleUrl: './usuario-fila.component.css',
})
export class UsuarioFilaComponent {
  readonly usuario = input.required<UsuarioDetalle>();
  /** El owner no puede eliminarse a sí mismo. */
  readonly puedeEliminar = input(false);
  readonly ocupado = input(false);

  readonly eliminar = output<UsuarioDetalle>();

  protected readonly confirmando = signal(false);

  protected confirmar(): void {
    this.confirmando.set(false);
    this.eliminar.emit(this.usuario());
  }
}
