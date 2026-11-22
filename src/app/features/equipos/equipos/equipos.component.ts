import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { EquipoDetalle } from '../../../core/models/equipo.model';
import { AuthService } from '../../../core/services/auth.service';
import { EquipoService } from '../../../core/services/equipo.service';
import { MENSAJE_SIN_CONEXION, leerProblema } from '../../../core/utils/problema-api';
import { EquipoCrearComponent } from '../equipo-crear/equipo-crear.component';
import { MiEquipoComponent } from '../mi-equipo/mi-equipo.component';

/**
 * Pantalla de equipos. Al abrirse le pregunta a la API a qué equipo pertenece el usuario:
 * si tiene uno muestra "Mi equipo"; si no, el formulario para crearlo.
 */
@Component({
  selector: 'app-equipos',
  imports: [EquipoCrearComponent, MiEquipoComponent],
  templateUrl: './equipos.component.html',
  styleUrl: './equipos.component.css',
})
export class EquiposComponent implements OnInit {
  private readonly equipoService = inject(EquipoService);
  private readonly authService = inject(AuthService);

  /** El owner administra los equipos pero no pertenece a ninguno: la API le responde 403. */
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
        const problema = leerProblema(err);
        this.errorCarga.set(problema.sinConexion ? MENSAJE_SIN_CONEXION : problema.detalle);
      },
    });
  }

  protected alCrear(equipo: EquipoDetalle): void {
    this.miEquipo.set(equipo);
    this.recienCreado.set(true);
  }
}
