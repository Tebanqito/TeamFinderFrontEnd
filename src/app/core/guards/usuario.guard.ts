import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/** Las pantallas de amigos son solo para usuarios: el owner no tiene amigos y la API le respondería 403. */
export const soloUsuarioGuard: CanActivateFn = () => {
  const rol = inject(AuthService).sesion()?.rol;
  return rol === 'OWNER' ? inject(Router).createUrlTree(['/equipos']) : true;
};
