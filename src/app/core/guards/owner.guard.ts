import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/** La administración de usuarios es solo del owner: un usuario común vuelve a /equipos. */
export const soloOwnerGuard: CanActivateFn = () => {
  const rol = inject(AuthService).sesion()?.rol;
  return rol === 'OWNER' ? true : inject(Router).createUrlTree(['/equipos']);
};
