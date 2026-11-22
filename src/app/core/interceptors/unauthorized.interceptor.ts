import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

/**
 * Si la API responde 401 en una ruta que no es de /auth, el token ya no sirve
 * (venció, o el usuario fue eliminado): se cierra la sesión y se vuelve a /login.
 * Los 401 de /auth/login son simplemente credenciales incorrectas y los maneja la pantalla.
 */
export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && !req.url.includes('/auth/')) {
        authService.logout();
        void router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
