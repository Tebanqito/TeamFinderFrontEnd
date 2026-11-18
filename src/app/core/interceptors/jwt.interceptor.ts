import { HttpInterceptorFn } from '@angular/common/http';

/** Agrega el header Authorization: Bearer <token> a cada petición si hay un token guardado. */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  if (token) {
    const conToken = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(conToken);
  }

  return next(req);
};
