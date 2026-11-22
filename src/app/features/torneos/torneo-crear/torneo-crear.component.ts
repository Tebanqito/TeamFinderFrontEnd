import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, output, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

import { TIPOS_EQUIPO, TipoEquipo } from '../../../core/models/equipo.model';
import { Torneo } from '../../../core/models/torneo.model';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { TorneoService } from '../../../core/services/torneo.service';
import { mensajeDeError } from '../../../core/utils/problema-api';

/** Formulario "Crear torneo" (solo owner). La API sortea los equipos completos del tipo elegido. */
@Component({
  selector: 'app-torneo-crear',
  imports: [FormsModule],
  templateUrl: './torneo-crear.component.html',
  styleUrl: './torneo-crear.component.css',
})
export class TorneoCrearComponent {
  private readonly torneoService = inject(TorneoService);
  private readonly notificaciones = inject(NotificacionService);

  readonly creado = output<Torneo>();

  protected readonly tipos = TIPOS_EQUIPO;
  protected readonly datos: { nombre: string; tipo: TipoEquipo; cantidadEquipos: number | null } = {
    nombre: '',
    tipo: 'FUTBOL_5',
    cantidadEquipos: 4,
  };
  protected readonly enviando = signal(false);

  protected cantidadValida(): boolean {
    const c = this.datos.cantidadEquipos;
    return typeof c === 'number' && Number.isInteger(c) && c >= 2;
  }

  protected enviar(formulario: NgForm): void {
    if (!this.datos.nombre.trim() || !this.cantidadValida()) {
      formulario.control.markAllAsTouched();
      // Marca el envío para que se vean los mensajes de cada campo
      return;
    }

    this.enviando.set(true);
    this.torneoService
      .crear({
        nombre: this.datos.nombre.trim(),
        tipo: this.datos.tipo,
        cantidadEquipos: this.datos.cantidadEquipos as number,
      })
      .subscribe({
        next: (torneo) => {
          this.enviando.set(false);
          this.notificaciones.exito(`Torneo "${torneo.nombre}" creado y sorteado.`);
          this.creado.emit(torneo);
        },
        error: (err: HttpErrorResponse) => {
          this.enviando.set(false);
          // Ej.: 409 "Ya existe un torneo activo" o "No hay suficientes equipos elegibles"
          this.notificaciones.error(mensajeDeError(err));
        },
      });
  }
}
