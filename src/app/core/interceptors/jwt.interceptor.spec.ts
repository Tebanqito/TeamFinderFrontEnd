import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { jwtInterceptor } from './jwt.interceptor';

describe('jwtInterceptor', () => {
  let cliente: HttpClient;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([jwtInterceptor])), provideHttpClientTesting()],
    });
    cliente = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('agrega el header Authorization cuando hay token guardado', () => {
    localStorage.setItem('token', 'abc123');
    cliente.get('/api/v1/equipos').subscribe();

    const req = http.expectOne('/api/v1/equipos');
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc123');
    req.flush({});
  });

  it('no agrega el header si no hay token', () => {
    cliente.get('/api/v1/equipos').subscribe();

    const req = http.expectOne('/api/v1/equipos');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
