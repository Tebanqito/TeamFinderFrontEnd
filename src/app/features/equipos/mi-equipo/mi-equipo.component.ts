import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

import { Amigo } from '../../../core/models/amigo.model';
import { EquipoDetalle, EquipoEditarRequest, nombreDeTipo } from '../../../core/models/equipo.model';
import { AmigoService } from '../../../core/services/amigo.service';
import { EquipoService } from '../../../core/services/equipo.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { leerProblema, mensajeDeError } from '../../../core/utils/problema-api';

/**
 * Tarjeta del equipo del usuario. Cualquier integrante puede editar nombre y descripción,
 * sumar a un amigo (entra directo, sin aceptar) o abandonar el equipo.
 */
@Component({
  selector: 'app-mi-equipo',
  imports: [FormsModule],
  templateUrl: './mi-equipo.component.html',
  styleUrl: './mi-equipo.component.css',
})
export class MiEquipoComponent {
  private readonly equipoService = inject(EquipoService);
  private readonly amigoService = inject(AmigoService);
  private readonly notificaciones = inject(NotificacionService);

  readonly equipo = input.required<EquipoDetalle>();

  /** El equipo cambió (edición o nuevo integrante): trae la versión actualizada. */
  readonly actualizado = output<EquipoDetalle>();
  /** El usuario dejó el equipo. */
  readonly abandonado = output<void>();

  protected readonly tipo = computed(() => nombreDeTipo(this.equipo().tipo));
  protected readonly porcentajeCupo = computed(() => (this.equipo().cantidadMiembros / this.equipo().cupo) * 100);
  protected readonly completo = computed(() => this.equipo().cantidadMiembros >= this.equipo().cupo);

  // Edición
  protected readonly editando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly errorNombre = signal<string | null>(null);
  protected readonly errorEdicion = signal<string | null>(null);
  protected readonly cambios = { nombre: '', descripcion: '' };

  // Abandonar
  protected readonly confirmandoSalida = signal(false);
  protected readonly saliendo = signal(false);
  protected readonly errorSalida = signal<string | null>(null);

  // Agregar amigo
  protected readonly agregando = signal(false);
  protected readonly cargandoAmigos = signal(false);
  protected readonly amigosDisponibles = signal<Amigo[]>([]);
  protected readonly errorAmigos = signal<string | null>(null);
  protected readonly sumando = signal(false);
  protected amigoElegido: number | null = null;

  protected empezarEdicion(): void {
    this.cambios.nombre = this.equipo().nombre;
    this.cambios.descripcion = this.equipo().descripcion;
    this.errorNombre.set(null);
    this.errorEdicion.set(null);
    this.editando.set(true);
  }

  protected guardar(formulario: NgForm): void {
    this.errorNombre.set(null);
    this.errorEdicion.set(null);
    // "required" deja pasar un texto de solo espacios: se valida con el texto recortado
    if (formulario.invalid || !this.cambios.nombre.trim() || !this.cambios.descripcion.trim()) {
      formulario.control.markAllAsTouched();
      return;
    }

    // Solo se envía lo que cambió
    const nombre = this.cambios.nombre.trim();
    const descripcion = this.cambios.descripcion.trim();
    const pedido: EquipoEditarRequest = {};
    if (nombre !== this.equipo().nombre) {
      pedido.nombre = nombre;
    }
    if (descripcion !== this.equipo().descripcion) {
      pedido.descripcion = descripcion;
    }
    if (Object.keys(pedido).length === 0) {
      this.editando.set(false);
      return;
    }

    this.guardando.set(true);
    this.equipoService.editar(this.equipo().id, pedido).subscribe({
      next: (equipo) => {
        this.guardando.set(false);
        this.editando.set(false);
        this.notificaciones.exito('Equipo actualizado.');
        this.actualizado.emit(equipo);
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        const problema = leerProblema(err);
        if (problema.status === 409 && problema.detalle.toLowerCase().includes('nombre')) {
          this.errorNombre.set(problema.detalle);
        } else if (problema.status === 400 && problema.errores) {
          this.errorNombre.set(problema.errores['nombre'] ?? null);
          this.errorEdicion.set(problema.errores['descripcion'] ?? null);
        } else {
          this.errorEdicion.set(mensajeDeError(err));
        }
      },
    });
  }

  protected abandonar(): void {
    this.saliendo.set(true);
    this.errorSalida.set(null);
    this.equipoService.abandonar(this.equipo().id).subscribe({
      next: () => {
        this.saliendo.set(false);
        this.confirmandoSalida.set(false);
        this.notificaciones.exito('Abandonaste el equipo.');
        this.abandonado.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.saliendo.set(false);
        // Ej.: 409 si el equipo juega el torneo activo
        this.errorSalida.set(mensajeDeError(err));
      },
    });
  }

  protected abrirAgregarAmigo(): void {
    this.agregando.set(true);
    this.cargandoAmigos.set(true);
    this.errorAmigos.set(null);
    this.amigoElegido = null;

    this.amigoService.listar().subscribe({
      next: (amigos) => {
        // Solo se pueden sumar amigos que todavía no tienen equipo
        this.amigosDisponibles.set(amigos.filter((a) => a.equipoId === null));
        this.cargandoAmigos.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.cargandoAmigos.set(false);
        this.errorAmigos.set(mensajeDeError(err));
      },
    });
  }

  protected sumarAmigo(): void {
    if (this.amigoElegido === null) {
      return;
    }
    this.sumando.set(true);
    this.errorAmigos.set(null);
    this.equipoService.agregarAmigo(this.equipo().id, this.amigoElegido).subscribe({
      next: (equipo) => {
        this.sumando.set(false);
        this.agregando.set(false);
        this.notificaciones.exito('Tu amigo se sumó al equipo.');
        this.actualizado.emit(equipo);
      },
      error: (err: HttpErrorResponse) => {
        this.sumando.set(false);
        this.errorAmigos.set(mensajeDeError(err));
      },
    });
  }
}
