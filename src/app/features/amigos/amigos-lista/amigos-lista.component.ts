import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, output, signal } from '@angular/core';

import { Amigo } from '../../../core/models/amigo.model';
import { AmigoService } from '../../../core/services/amigo.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { mensajeDeError } from '../../../core/utils/problema-api';

/** Lista de amigos del usuario, con el botón Quitar. */
@Component({
  selector: 'app-amigos-lista',
  styles: `
    p .btn {
      margin-left: 0.5rem;
    }
  `,
  templateUrl: './amigos-lista.component.html',
})
export class AmigosListaComponent {
  private readonly amigoService = inject(AmigoService);
  private readonly notificaciones = inject(NotificacionService);

  readonly amigos = input.required<Amigo[]>();

  /** Se quitó un amigo: hay que refrescar las listas. */
  readonly quitado = output<void>();

  protected readonly quitandoId = signal<number | null>(null);

  protected quitar(amigo: Amigo): void {
    this.quitandoId.set(amigo.id);
    this.amigoService.eliminar(amigo.id).subscribe({
      next: () => {
        this.quitandoId.set(null);
        this.notificaciones.exito(`${amigo.nombre} ya no está en tu lista de amigos.`);
        this.quitado.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.quitandoId.set(null);
        this.notificaciones.error(mensajeDeError(err));
        this.quitado.emit();
      },
    });
  }
}
