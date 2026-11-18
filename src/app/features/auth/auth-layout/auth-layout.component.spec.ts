import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { AuthLayoutComponent } from './auth-layout.component';

describe('AuthLayoutComponent', () => {
  let fixture: ComponentFixture<AuthLayoutComponent>;
  let raiz: HTMLElement;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AuthLayoutComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthLayoutComponent);
    raiz = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  it('muestra el logo, el nombre y las pestañas de acceso', () => {
    expect(raiz.querySelector('img.logo')).not.toBeNull();
    expect(raiz.querySelector('.marca')!.textContent).toContain('MatchFinder');

    const pestanias = Array.from(raiz.querySelectorAll('.pestanias a'));
    expect(pestanias.map((a) => a.textContent?.trim())).toEqual(['Ingresar', 'Registrarme']);
    expect(pestanias.map((a) => a.getAttribute('href'))).toEqual(['/login', '/registro']);
    expect(raiz.querySelector('.sesion')).toBeNull();
  });

  it('muestra la sesión iniciada y oculta las pestañas', async () => {
    TestBed.inject(AuthService).sesion.set({ token: 'abc123', email: 'owner@matchfinder.com', rol: 'OWNER' });
    await fixture.whenStable();

    expect(raiz.querySelector('.sesion')!.textContent).toContain('owner@matchfinder.com');
    expect(raiz.querySelector('.sesion')!.textContent).toContain('OWNER');
    expect(raiz.querySelector('.pestanias')).toBeNull();
  });

  it('cerrar sesión borra la sesión y vuelve a mostrar las pestañas', async () => {
    const servicio = TestBed.inject(AuthService);
    localStorage.setItem('token', 'abc123');
    servicio.sesion.set({ token: 'abc123', email: 'juan@mail.com', rol: 'USUARIO' });
    await fixture.whenStable();

    raiz.querySelector<HTMLButtonElement>('.sesion button')!.click();
    await fixture.whenStable();

    expect(servicio.sesion()).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(raiz.querySelector('.pestanias')).not.toBeNull();
  });
});
