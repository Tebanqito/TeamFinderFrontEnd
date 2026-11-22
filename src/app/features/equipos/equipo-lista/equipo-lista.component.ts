import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { EquipoDetalle, FiltrosEquipos, TIPOS_EQUIPO } from '../../../core/models/equipo.model';
import { Pagina } from '../../../core/models/pagina.model';
import { EquipoService } from '../../../core/services/equipo.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { mensajeDeError } from '../../../core/utils/problema-api';
import { EquipoCardComponent } from '../equipo-card/equipo-card.component';

const EQUIPOS_POR_PAGINA = 12;

/** Listado de todos los equipos con filtros (tipo, nombre, con cupo) y paginación. */
@Component({
  selector: 'app-equipo-lista',
  imports: [FormsModule, EquipoCardComponent],
  templateUrl: './equipo-lista.component.html',
  styleUrl: './equipo-lista.component.css',
})
export class EquipoListaComponent implements OnInit {
  private readonly equipoService = inject(EquipoService);
  private readonly notificaciones = inject(NotificacionService);

  /** Un usuario sin equipo puede unirse; el owner y quien ya tiene equipo no. */
  readonly puedeUnirse = input(false);
  readonly puedeEliminar = input(false);

  readonly unido = output<EquipoDetalle>();
  readonly eliminado = output<EquipoDetalle>();

  protected readonly tipos = TIPOS_EQUIPO;
  /** Lo que se está escribiendo en el formulario; se aplica recién al apretar "Filtrar". */
  protected readonly formulario: FiltrosEquipos = { tipo: '', nombre: '', conCupo: false };
  private filtros: FiltrosEquipos = { ...this.formulario };

  protected readonly pagina = signal<Pagina<EquipoDetalle> | null>(null);
  protected readonly cargando = signal(false);
  protected readonly errorCarga = signal<string | null>(null);
  /** Id del equipo con una operación en curso. */
  protected readonly ocupadoId = signal<number | null>(null);
  private numeroPagina = 0;

  ngOnInit(): void {
    this.recargar();
  }

  protected filtrar(): void {
    this.filtros = { ...this.formulario };
    this.numeroPagina = 0;
    this.recargar();
  }

  protected irA(numero: number): void {
    this.numeroPagina = numero;
    this.recargar();
  }

  /** Vuelve a pedir la página actual a la API (por ejemplo, después de que cambió un equipo). */
  recargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);

    this.equipoService.listar(this.filtros, this.numeroPagina, EQUIPOS_POR_PAGINA).subscribe({
      next: (resultado) => {
        // Si la página quedó vacía (se eliminó el último equipo) se retrocede una
        if (resultado.contenido.length === 0 && this.numeroPagina > 0) {
          this.numeroPagina = Math.max(0, resultado.totalPaginas - 1);
          this.recargar();
          return;
        }
        this.pagina.set(resultado);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.errorCarga.set(mensajeDeError(err));
      },
    });
  }

  protected unirse(equipo: EquipoDetalle): void {
    this.ocupadoId.set(equipo.id);
    this.equipoService.unirse(equipo.id).subscribe({
      next: (actualizado) => {
        this.ocupadoId.set(null);
        this.notificaciones.exito(`Te uniste a "${actualizado.nombre}".`);
        this.unido.emit(actualizado);
      },
      error: (err: HttpErrorResponse) => {
        this.ocupadoId.set(null);
        this.notificaciones.error(mensajeDeError(err));
        // Puede haberse llenado mientras se miraba la lista
        this.recargar();
      },
    });
  }

  protected eliminar(equipo: EquipoDetalle): void {
    this.ocupadoId.set(equipo.id);
    this.equipoService.eliminar(equipo.id).subscribe({
      next: () => {
        this.ocupadoId.set(null);
        this.notificaciones.exito(`Se eliminó "${equipo.nombre}".`);
        this.eliminado.emit(equipo);
        this.recargar();
      },
      error: (err: HttpErrorResponse) => {
        this.ocupadoId.set(null);
        this.notificaciones.error(mensajeDeError(err));
      },
    });
  }
}
