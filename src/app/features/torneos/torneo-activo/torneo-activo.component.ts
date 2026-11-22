import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, output, signal } from '@angular/core';
import { switchMap, of, forkJoin } from 'rxjs';

import { Cruce, Llave, Torneo } from '../../../core/models/torneo.model';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { PartidoService } from '../../../core/services/partido.service';
import { TorneoService } from '../../../core/services/torneo.service';
import { mensajeDeError } from '../../../core/utils/problema-api';
import { GanadorElegido, LlavesComponent } from '../llaves/llaves.component';
import { TorneoCrearComponent } from '../torneo-crear/torneo-crear.component';

/**
 * Torneo activo: equipos sorteados, campeón y llaves.
 * Si no hay torneo, el owner ve el formulario para crear uno. El owner también carga resultados y finaliza.
 */
@Component({
  selector: 'app-torneo-activo',
  imports: [LlavesComponent, TorneoCrearComponent],
  templateUrl: './torneo-activo.component.html',
  // Las tarjetas son hijas directas del componente: se separan igual que en el resto de las pantallas
  styles: `
    :host {
      display: grid;
      gap: 1.2rem;
    }
  `,
})
export class TorneoActivoComponent implements OnInit {
  private readonly torneoService = inject(TorneoService);
  private readonly partidoService = inject(PartidoService);
  private readonly authService = inject(AuthService);
  private readonly notificaciones = inject(NotificacionService);

  /** Se creó o se finalizó un torneo: el historial tiene que actualizarse. */
  readonly cambio = output<void>();

  protected readonly esOwner = computed(() => this.authService.sesion()?.rol === 'OWNER');

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly torneo = signal<Torneo | null>(null);
  protected readonly llave = signal<Llave | null>(null);

  protected readonly confirmandoFin = signal(false);
  protected readonly finalizando = signal(false);
  /** Mientras la API guarda un resultado se bloquea el resto. */
  protected readonly guardando = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.errorCarga.set(null);

    this.torneoService
      .obtenerActivo()
      .pipe(
        switchMap((torneo) =>
          torneo ? forkJoin({ torneo: of(torneo), llave: this.torneoService.obtenerLlaves(torneo.id) }) : of(null),
        ),
      )
      .subscribe({
        next: (datos) => {
          this.torneo.set(datos?.torneo ?? null);
          this.llave.set(datos?.llave ?? null);
          this.cargando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.cargando.set(false);
          this.errorCarga.set(mensajeDeError(err));
        },
      });
  }

  protected alCrear(): void {
    this.cargar();
    this.cambio.emit();
  }

  protected finalizar(): void {
    const torneo = this.torneo();
    if (!torneo) {
      return;
    }
    this.finalizando.set(true);
    this.torneoService.finalizar(torneo.id).subscribe({
      next: () => {
        this.finalizando.set(false);
        this.confirmandoFin.set(false);
        this.notificaciones.exito(`Torneo "${torneo.nombre}" finalizado.`);
        this.cargar();
        this.cambio.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.finalizando.set(false);
        this.confirmandoFin.set(false);
        this.notificaciones.error(mensajeDeError(err));
        this.cargar();
      },
    });
  }

  protected cargarResultado(elegido: GanadorElegido): void {
    const torneo = this.torneo();
    if (!torneo || !elegido.cruce.equipoUno || !elegido.cruce.equipoDos) {
      return;
    }
    this.guardando.set(true);
    this.partidoService
      .registrar(torneo.id, {
        equipoUnoId: elegido.cruce.equipoUno.id,
        equipoDosId: elegido.cruce.equipoDos.id,
        ganadorId: elegido.ganador.id,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.notificaciones.exito(`Resultado cargado: ganó ${elegido.ganador.nombre}.`);
          this.recargarLlaves(torneo);
        },
        error: (err: HttpErrorResponse) => {
          this.guardando.set(false);
          this.notificaciones.error(mensajeDeError(err));
          this.cargar();
        },
      });
  }

  protected borrarResultado(cruce: Cruce): void {
    const torneo = this.torneo();
    if (!torneo || cruce.partidoId === null) {
      return;
    }
    this.guardando.set(true);
    this.partidoService.eliminar(torneo.id, cruce.partidoId).subscribe({
      next: () => {
        this.guardando.set(false);
        this.notificaciones.exito('Resultado borrado.');
        this.recargarLlaves(torneo);
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.notificaciones.error(mensajeDeError(err));
        this.cargar();
      },
    });
  }

  /** Después de un cambio de resultados solo hace falta volver a pedir las llaves (se borran en cascada los cruces siguientes). */
  private recargarLlaves(torneo: Torneo): void {
    this.torneoService.obtenerLlaves(torneo.id).subscribe({
      next: (llave) => this.llave.set(llave),
      error: (err: HttpErrorResponse) => this.notificaciones.error(mensajeDeError(err)),
    });
  }
}
