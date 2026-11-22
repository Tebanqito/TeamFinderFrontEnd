import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  const url = `${environment.apiUrl}/auth/login`;
  let fixture: ComponentFixture<LoginComponent>;
  let http: HttpTestingController;
  let raiz: HTMLElement;
  const navegar = vi.fn();

  const escribir = async (campo: string, valor: string) => {
    const input = raiz.querySelector<HTMLInputElement>(`input[name="${campo}"]`)!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };

  const completarValido = async () => {
    await escribir('email', 'juan@mail.com');
    await escribir('password', 'clave12345');
  };

  const enviar = async () => {
    raiz.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  };

  beforeEach(async () => {
    localStorage.clear();
    navegar.mockReset();
    navegar.mockResolvedValue(true);
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: Router, useValue: { navigate: navegar } }],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(LoginComponent);
    raiz = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('muestra los campos de email y contraseña', () => {
    expect(raiz.querySelectorAll('input').length).toBe(2);
    expect(raiz.querySelector('button[type="submit"]')!.textContent).toContain('Ingresar');
  });

  it('no llama a la API y marca los campos obligatorios si el formulario está vacío', async () => {
    await enviar();

    http.expectNone(url);
    expect(raiz.textContent).toContain('Este campo es obligatorio');
  });

  it('rechaza un email con formato inválido', async () => {
    await escribir('email', 'araña@gmail.com');
    await escribir('password', 'clave12345');
    await enviar();

    http.expectNone(url);
    expect(raiz.textContent).toContain('Ingresá un email válido');
  });

  it('envía las credenciales a la API y guarda la sesión', async () => {
    await completarValido();
    await enviar();

    const req = http.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'juan@mail.com', password: 'clave12345' });
    req.flush({ accessToken: 'abc123', tokenType: 'Bearer', email: 'juan@mail.com', rol: 'OWNER' });
    await fixture.whenStable();

    const sesion = TestBed.inject(AuthService).sesion();
    expect(sesion?.email).toBe('juan@mail.com');
    expect(sesion?.rol).toBe('OWNER');
    expect(localStorage.getItem('token')).toBe('abc123');
    expect(navegar).toHaveBeenCalledWith(['/equipos']);
  });

  it('muestra "Credenciales inválidas" cuando la API responde 401', async () => {
    await completarValido();
    await enviar();

    http
      .expectOne(url)
      .flush({ detail: 'Credenciales inválidas' }, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();

    expect(raiz.querySelector('.error.general')!.textContent).toContain('Credenciales inválidas');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('muestra los errores por campo del 400 de la API', async () => {
    await completarValido();
    await enviar();

    http.expectOne(url).flush(
      { detail: 'Hay errores de validación en la petición', errores: { email: 'debe tener formato de correo' } },
      { status: 400, statusText: 'Bad Request' },
    );
    await fixture.whenStable();

    expect(raiz.textContent).toContain('debe tener formato de correo');
  });

  it('avisa si no hay conexión con el servidor', async () => {
    await completarValido();
    await enviar();

    http.expectOne(url).error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(raiz.textContent).toContain('No se pudo conectar con el servidor');
    expect(navegar).not.toHaveBeenCalled();
  });

  it('vuelve a habilitar el botón después de un error', async () => {
    await completarValido();
    await enviar();
    http.expectOne(url).flush({ detail: 'Credenciales inválidas' }, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();

    expect(raiz.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(false);
  });
});
