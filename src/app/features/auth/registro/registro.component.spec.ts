import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { RegistroComponent } from './registro.component';

describe('RegistroComponent', () => {
  const url = `${environment.apiUrl}/auth/registro`;
  let fixture: ComponentFixture<RegistroComponent>;
  let http: HttpTestingController;
  let raiz: HTMLElement;

  const escribir = async (campo: string, valor: string) => {
    const input = raiz.querySelector<HTMLInputElement>(`input[name="${campo}"]`)!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };

  const completarValido = async () => {
    await escribir('nombre', 'juan');
    await escribir('email', 'juan@mail.com');
    await escribir('password', 'clave12345');
  };

  const enviar = async () => {
    raiz.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [RegistroComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RegistroComponent);
    raiz = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('muestra el logo y el formulario de registro', () => {
    expect(raiz.querySelector('img.logo')).not.toBeNull();
    expect(raiz.querySelectorAll('input').length).toBe(3);
  });

  it('no llama a la API y marca los campos obligatorios si el formulario está vacío', async () => {
    await enviar();

    http.expectNone(url);
    expect(raiz.textContent).toContain('Este campo es obligatorio');
  });

  it('rechaza un email con caracteres que la API no acepta, como la ñ', async () => {
    await escribir('nombre', 'juan');
    await escribir('email', 'araña@gmail.com');
    await escribir('password', 'clave12345');
    await enviar();

    http.expectNone(url);
    expect(raiz.textContent).toContain('Ingresá un email válido');
  });

  it('rechaza una contraseña de menos de 8 caracteres', async () => {
    await escribir('nombre', 'juan');
    await escribir('email', 'juan@mail.com');
    await escribir('password', 'corta');
    await enviar();

    http.expectNone(url);
    expect(raiz.textContent).toContain('entre 8 y 20 caracteres');
  });

  it('envía los datos a la API, guarda el token y muestra la confirmación', async () => {
    await completarValido();
    await enviar();

    const req = http.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nombre: 'juan', email: 'juan@mail.com', password: 'clave12345' });
    req.flush(
      { accessToken: 'abc123', tokenType: 'Bearer', email: 'juan@mail.com', rol: 'USUARIO' },
      { status: 201, statusText: 'Created' },
    );
    await fixture.whenStable();

    expect(localStorage.getItem('token')).toBe('abc123');
    expect(raiz.textContent).toContain('Cuenta creada');
    expect(raiz.textContent).toContain('Bienvenido, juan');
    expect(raiz.querySelector('form')).toBeNull();
  });

  it('muestra debajo del email el 409 de email repetido', async () => {
    await completarValido();
    await enviar();

    http
      .expectOne(url)
      .flush({ detail: 'Ya existe un usuario registrado con ese email' }, { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();

    expect(raiz.textContent).toContain('Ya existe un usuario registrado con ese email');
    expect(raiz.querySelector('form')).not.toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('muestra debajo del nombre el 409 de nombre repetido', async () => {
    await completarValido();
    await enviar();

    http
      .expectOne(url)
      .flush({ detail: 'Ya existe un usuario con ese nombre' }, { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();

    const errores = Array.from(raiz.querySelectorAll('.error')).map((e) => e.textContent);
    expect(errores).toContain('Ya existe un usuario con ese nombre');
  });

  it('muestra los errores por campo del 400 de la API', async () => {
    await completarValido();
    await enviar();

    http.expectOne(url).flush(
      { detail: 'Hay errores de validación en la petición', errores: { password: 'el tamaño debe estar entre 8 y 20' } },
      { status: 400, statusText: 'Bad Request' },
    );
    await fixture.whenStable();

    expect(raiz.textContent).toContain('el tamaño debe estar entre 8 y 20');
  });

  it('avisa si no hay conexión con el servidor', async () => {
    await completarValido();
    await enviar();

    http.expectOne(url).error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(raiz.textContent).toContain('No se pudo conectar con el servidor');
  });

  it('vuelve a habilitar el botón después de un error', async () => {
    await completarValido();
    await enviar();
    http.expectOne(url).flush({ detail: 'Error' }, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    expect(raiz.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(false);
    expect(raiz.textContent).toContain('Error');
  });
});
