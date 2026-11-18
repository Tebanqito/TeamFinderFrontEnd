import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm, NgModel } from '@angular/forms';

import { LoginRequest } from '../../../core/models/auth.model';
import { AuthService } from '../../../core/services/auth.service';
import { MENSAJE_SIN_CONEXION, leerProblema } from '../../../core/utils/problema-api';
import { mensajeDeValidacion } from '../../../core/utils/validacion';

type ErroresPorCampo = Partial<Record<keyof LoginRequest, string>>;

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);

  protected readonly datos: LoginRequest = { email: '', password: '' };

  protected readonly enviando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);
  protected readonly erroresApi = signal<ErroresPorCampo>({});

  /** Si las credenciales son correctas, el servicio guarda la sesión y el layout muestra la confirmación. */
  protected enviar(formulario: NgForm): void {
    this.errorGeneral.set(null);
    this.erroresApi.set({});

    if (formulario.invalid) {
      formulario.control.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.authService.login({ email: this.datos.email.trim(), password: this.datos.password }).subscribe({
      next: () => this.enviando.set(false),
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        this.mostrarError(err);
      },
    });
  }

  protected errorDe(campo: keyof LoginRequest, control: NgModel, enviado: boolean): string | null {
    return this.erroresApi()[campo] ?? mensajeDeValidacion(control, enviado);
  }

  protected limpiarErrorApi(campo: keyof LoginRequest): void {
    this.erroresApi.update((errores) => ({ ...errores, [campo]: undefined }));
  }

  private mostrarError(err: HttpErrorResponse): void {
    const problema = leerProblema(err);

    if (problema.sinConexion) {
      this.errorGeneral.set(MENSAJE_SIN_CONEXION);
      return;
    }

    if (problema.status === 400 && problema.errores) {
      this.erroresApi.set(problema.errores as ErroresPorCampo);
      return;
    }

    // 401: "Credenciales inválidas" (email o contraseña incorrectos)
    this.errorGeneral.set(problema.detalle);
  }
}
