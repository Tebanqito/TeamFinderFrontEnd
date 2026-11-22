import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, output, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

import { SolicitudService } from '../../../core/services/solicitud.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { mensajeDeError } from '../../../core/utils/problema-api';

/** Formulario "Agregar amigo": se envía la solicitud por nombre de usuario. */
@Component({
  selector: 'app-amigo-agregar',
  imports: [FormsModule],
  templateUrl: './amigo-agregar.component.html',
  styleUrl: './amigo-agregar.component.css',
})
export class AmigoAgregarComponent {
  private readonly solicitudService = inject(SolicitudService);
  private readonly notificaciones = inject(NotificacionService);

  /** Se envió una solicitud (o se aceptó sola): hay que refrescar las listas. */
  readonly enviada = output<void>();

  protected nombre = '';
  protected readonly enviando = signal(false);

  protected enviar(formulario: NgForm): void {
    const destinatario = this.nombre.trim();
    if (formulario.invalid || !destinatario) {
      formulario.control.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.solicitudService.enviar(destinatario).subscribe({
      next: (resultado) => {
        this.enviando.set(false);
        this.notificaciones.exito(
          resultado.aceptadaAutomaticamente
            ? `${destinatario} ya te había enviado una solicitud: ahora son amigos.`
            : `Solicitud enviada a ${destinatario}.`,
        );
        this.nombre = '';
        formulario.resetForm({ nombre: '' });
        this.enviada.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        // Ej.: 404 "No existe un usuario con ese nombre", 409 "Ya son amigos"
        this.notificaciones.error(mensajeDeError(err));
      },
    });
  }
}
