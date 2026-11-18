import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm, NgModel } from '@angular/forms';

import { RegistroRequest } from '../../../core/models/auth.model';
import { AuthService } from '../../../core/services/auth.service';

type ErroresPorCampo = Partial<Record<keyof RegistroRequest, string>>;

/** Forma del error que devuelve la API (Problem Details). */
interface ProblemaApi {
  detail?: string;
  errores?: ErroresPorCampo;
}

@Component({
  selector: 'app-registro',
  imports: [FormsModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css',
})
export class RegistroComponent {
  private readonly authService = inject(AuthService);

  protected readonly datos: RegistroRequest = { nombre: '', email: '', password: '' };

  protected readonly enviando = signal(false);
  /** Nombre del usuario recién registrado; mientras sea null se muestra el formulario. */
  protected readonly registrado = signal<string | null>(null);
  protected readonly errorGeneral = signal<string | null>(null);
  protected readonly erroresApi = signal<ErroresPorCampo>({});

  protected enviar(formulario: NgForm): void {
    this.errorGeneral.set(null);
    this.erroresApi.set({});

    if (formulario.invalid) {
      formulario.control.markAllAsTouched();
      return;
    }

    const nombre = this.datos.nombre.trim();
    this.enviando.set(true);

    this.authService
      .registrar({ nombre, email: this.datos.email.trim(), password: this.datos.password })
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.registrado.set(nombre);
        },
        error: (err: HttpErrorResponse) => {
          this.enviando.set(false);
          this.mostrarError(err);
        },
      });
  }

  /** Mensaje de un campo: primero el que mandó la API, después las validaciones del formulario. */
  protected errorDe(campo: keyof RegistroRequest, control: NgModel, enviado: boolean): string | null {
    const deLaApi = this.erroresApi()[campo];
    if (deLaApi) {
      return deLaApi;
    }
    if (!(control.touched || enviado) || !control.errors) {
      return null;
    }
    if (control.errors['required']) {
      return 'Este campo es obligatorio';
    }
    if (control.errors['email']) {
      return 'Ingresá un email válido';
    }
    if (control.errors['minlength']) {
      return 'La contraseña debe tener entre 8 y 20 caracteres';
    }
    return 'El valor ingresado no es válido';
  }

  /** Al editar un campo se saca el error que había mandado la API para ese campo. */
  protected limpiarErrorApi(campo: keyof RegistroRequest): void {
    this.erroresApi.update((errores) => ({ ...errores, [campo]: undefined }));
  }

  private mostrarError(err: HttpErrorResponse): void {
    if (err.status === 0) {
      this.errorGeneral.set('No se pudo conectar con el servidor. Revisá que la API esté encendida.');
      return;
    }

    const problema = (err.error ?? {}) as ProblemaApi;

    // 400: la API detalla qué campo falló
    if (err.status === 400 && problema.errores) {
      this.erroresApi.set(problema.errores);
      return;
    }

    const detalle = problema.detail ?? 'Ocurrió un error inesperado. Probá de nuevo más tarde.';

    // 409: el email o el nombre ya existen; se muestra debajo del campo que corresponde
    if (err.status === 409) {
      const texto = detalle.toLowerCase();
      if (texto.includes('email')) {
        this.erroresApi.set({ email: detalle });
        return;
      }
      if (texto.includes('nombre')) {
        this.erroresApi.set({ nombre: detalle });
        return;
      }
    }

    this.errorGeneral.set(detalle);
  }
}
