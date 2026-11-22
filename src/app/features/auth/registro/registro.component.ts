import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { Router } from '@angular/router';

import { RegistroRequest } from '../../../core/models/auth.model';
import { AuthService } from '../../../core/services/auth.service';
import { MENSAJE_SIN_CONEXION, leerProblema } from '../../../core/utils/problema-api';
import { mensajeDeValidacion } from '../../../core/utils/validacion';

type ErroresPorCampo = Partial<Record<keyof RegistroRequest, string>>;

@Component({
  selector: 'app-registro',
  imports: [FormsModule],
  templateUrl: './registro.component.html',
})
export class RegistroComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly datos: RegistroRequest = { nombre: '', email: '', password: '' };

  protected readonly enviando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);
  protected readonly erroresApi = signal<ErroresPorCampo>({});

  /** Al registrarse, el servicio guarda la sesión y se pasa a la pantalla de equipos. */
  protected enviar(formulario: NgForm): void {
    this.errorGeneral.set(null);
    this.erroresApi.set({});

    if (formulario.invalid) {
      formulario.control.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.authService
      .registrar({
        nombre: this.datos.nombre.trim(),
        email: this.datos.email.trim(),
        password: this.datos.password,
      })
      .subscribe({
        next: () => {
          this.enviando.set(false);
          void this.router.navigate(['/equipos']);
        },
        error: (err: HttpErrorResponse) => {
          this.enviando.set(false);
          this.mostrarError(err);
        },
      });
  }

  /** Mensaje de un campo: primero el que mandó la API, después las validaciones del formulario. */
  protected errorDe(campo: keyof RegistroRequest, control: NgModel, enviado: boolean): string | null {
    return (
      this.erroresApi()[campo] ??
      mensajeDeValidacion(control, enviado, 'La contraseña debe tener entre 8 y 20 caracteres')
    );
  }

  /** Al editar un campo se saca el error que había mandado la API para ese campo. */
  protected limpiarErrorApi(campo: keyof RegistroRequest): void {
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

    // 409: el email o el nombre ya existen; se muestra debajo del campo que corresponde
    if (problema.status === 409) {
      const texto = problema.detalle.toLowerCase();
      if (texto.includes('email')) {
        this.erroresApi.set({ email: problema.detalle });
        return;
      }
      if (texto.includes('nombre')) {
        this.erroresApi.set({ nombre: problema.detalle });
        return;
      }
    }

    this.errorGeneral.set(problema.detalle);
  }
}
