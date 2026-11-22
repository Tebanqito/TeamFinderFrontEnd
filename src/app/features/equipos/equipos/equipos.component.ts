import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';

import { EquipoDetalle } from '../../../core/models/equipo.model';
import { AuthService } from '../../../core/services/auth.service';
import { EquipoService } from '../../../core/services/equipo.service';
import { mensajeDeError } from '../../../core/utils/problema-api';
import { EquipoCrearComponent } from '../equipo-crear/equipo-crear.component';
import { EquipoListaComponent } from '../equipo-lista/equipo-lista.component';
import { MiEquipoComponent } from '../mi-equipo/mi-equipo.component';

/**
 * Pantalla de equipos.
 * - Usuario: su equipo (o el formulario para crearlo) y el listado de todos los equipos para unirse.
 * - Owner: el listado, donde puede eliminar equipos. No crea ni se une a ninguno.
 */
@Component({
  selector: 'app-equipos',
  imports: [EquipoCrearComponent, MiEquipoComponent, EquipoListaComponent],
  templateUrl: './equipos.component.html',
  styleUrl: './equipos.component.css',
})
export class EquiposComponent implements OnInit {
  private readonly equipoService = inject(EquipoService);
  private readonly authService = inject(AuthService);

  private readonly lista = viewChild(EquipoListaComponent);

  protected readonly esOwner = computed(() => this.authService.sesion()?.rol === 'OWNER');

  protected readonly cargando = signal(false);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly miEquipo = signal<EquipoDetalle | null>(null);
  protected readonly recienCreado = signal(false);

  ngOnInit(): void {
    if (!this.esOwner()) {
      this.cargarMiEquipo();
    }
  }

  protected cargarMiEquipo(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);

    this.equipoService.obtenerMio().subscribe({
      next: (equipo) => {
        this.miEquipo.set(equipo);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.errorCarga.set(mensajeDeError(err));
      },
    });
  }

  protected alCrear(equipo: EquipoDetalle): void {
    this.miEquipo.set(equipo);
    this.recienCreado.set(true);
    this.lista()?.recargar();
  }

  /** Se unió a un equipo o cambió el suyo: se actualiza "Mi equipo" y el listado. */
  protected alCambiarMiEquipo(equipo: EquipoDetalle): void {
    this.recienCreado.set(false);
    this.miEquipo.set(equipo);
    this.lista()?.recargar();
  }

  protected alAbandonar(): void {
    this.recienCreado.set(false);
    this.miEquipo.set(null);
    this.lista()?.recargar();
  }
}
