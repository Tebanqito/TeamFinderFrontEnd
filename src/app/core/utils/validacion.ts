import { NgModel } from '@angular/forms';

/**
 * Mensaje de validación de un campo del formulario, o null si no hay nada que mostrar.
 * Solo aparece después de que el usuario tocó el campo o intentó enviar el formulario.
 */
export function mensajeDeValidacion(
  control: NgModel,
  enviado: boolean,
  mensajeMinlength = 'El valor ingresado es demasiado corto',
): string | null {
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
    return mensajeMinlength;
  }
  return 'El valor ingresado no es válido';
}
