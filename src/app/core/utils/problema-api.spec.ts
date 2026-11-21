import { HttpErrorResponse } from '@angular/common/http';

import { leerProblema } from './problema-api';

describe('leerProblema', () => {
  it('detecta que no hay conexión cuando el status es 0', () => {
    const problema = leerProblema(new HttpErrorResponse({ status: 0, error: new ProgressEvent('error') }));

    expect(problema.sinConexion).toBe(true);
  });

  it('lee el detalle y los errores por campo de un 400', () => {
    const problema = leerProblema(
      new HttpErrorResponse({
        status: 400,
        error: { detail: 'Hay errores de validación en la petición', errores: { email: 'inválido' } },
      }),
    );

    expect(problema.sinConexion).toBe(false);
    expect(problema.status).toBe(400);
    expect(problema.detalle).toBe('Hay errores de validación en la petición');
    expect(problema.errores).toEqual({ email: 'inválido' });
  });

  it('usa un mensaje genérico si la respuesta no trae el formato esperado', () => {
    const problema = leerProblema(new HttpErrorResponse({ status: 502, error: '<html>Bad Gateway</html>' }));

    expect(problema.detalle).toContain('error inesperado');
    expect(problema.errores).toBeNull();
  });
});
