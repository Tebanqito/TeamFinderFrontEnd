import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/** Solo deja entrar a las rutas internas si hay una sesión iniciada; si no, manda a /login. */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  return authService.estaLogueado() ? true : inject(Router).createUrlTree(['/login']);
};

/** Las pantallas de ingreso y registro no tienen sentido con la sesión iniciada: manda a /equipos. */
export const sinSesionGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  return authService.estaLogueado() ? inject(Router).createUrlTree(['/equipos']) : true;
};
