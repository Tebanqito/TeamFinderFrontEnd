import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, output, signal } from '@angular/core';
import { FormsModule, NgForm, NgModel } from '@angular/forms';

import { EquipoCrearRequest, EquipoDetalle, TIPOS_EQUIPO } from '../../../core/models/equipo.model';
import { EquipoService } from '../../../core/services/equipo.service';
import { MENSAJE_SIN_CONEXION, leerProblema } from '../../../core/utils/problema-api';
import { mensajeDeValidacion } from '../../../core/utils/validacion';

type ErroresPorCampo = Partial<Record<keyof EquipoCrearRequest, string>>;

/** Formulario "Crear mi equipo". Cuando la API lo crea, avisa con el evento "creado". */
@Component({
  selector: 'app-equipo-crear',
  imports: [FormsModule],
  templateUrl: './equipo-crear.component.html',
  styleUrl: './equipo-crear.component.css',
})
export class EquipoCrearComponent {
  private readonly equipoService = inject(EquipoService);

  readonly creado = output<EquipoDetalle>();

  protected readonly tipos = TIPOS_EQUIPO;
  protected readonly datos: EquipoCrearRequest = { nombre: '', descripcion: '', tipo: 'FUTBOL_5' };

  protected readonly enviando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);
  protected readonly erroresApi = signal<ErroresPorCampo>({});

  protected enviar(formulario: NgForm): void {
    this.errorGeneral.set(null);
    this.erroresApi.set({});

    if (formulario.invalid) {
      formulario.control.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.equipoService
      .crear({
        nombre: this.datos.nombre.trim(),
        descripcion: this.datos.descripcion.trim(),
        tipo: this.datos.tipo,
      })
      .subscribe({
        next: (equipo) => {
          this.enviando.set(false);
          this.creado.emit(equipo);
        },
        error: (err: HttpErrorResponse) => {
          this.enviando.set(false);
          this.mostrarError(err);
        },
      });
  }

  /** Mensaje de un campo: primero el que mandó la API, después las validaciones del formulario. */
  protected errorDe(campo: keyof EquipoCrearRequest, control: NgModel, enviado: boolean): string | null {
    return this.erroresApi()[campo] ?? mensajeDeValidacion(control, enviado);
  }

  protected limpiarErrorApi(campo: keyof EquipoCrearRequest): void {
    this.erroresApi.update((errores) => ({ ...errores, [campo]: undefined }));
  }

  private mostrarError(err: HttpErrorResponse): void {
    const problema = leerProblema(err);

    if (problema.sinConexion) {
      this.errorGeneral.set(MENSAJE_SIN_CONEXION);
      return;
    }

    // 400: la API detalla qué campo falló
    if (problema.status === 400 && problema.errores) {
      this.erroresApi.set(problema.errores as ErroresPorCampo);
      return;
    }

    // 409 "Ya existe un equipo con ese nombre": se muestra debajo del campo nombre.
    // El otro 409 ("Ya pertenecés a un equipo...") y el 403 se muestran como aviso general.
    if (problema.status === 409 && problema.detalle.toLowerCase().includes('nombre')) {
      this.erroresApi.set({ nombre: problema.detalle });
      return;
    }

    this.errorGeneral.set(problema.detalle);
  }
}
