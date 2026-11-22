import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { MainLayoutComponent } from './main-layout.component';

describe('MainLayoutComponent', () => {
  let fixture: ComponentFixture<MainLayoutComponent>;
  let raiz: HTMLElement;
  let authService: AuthService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    authService.sesion.set({ token: 'abc123', email: 'owner@matchfinder.com', rol: 'OWNER' });
    fixture = TestBed.createComponent(MainLayoutComponent);
    raiz = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  it('muestra el logo, el nombre y el enlace a Equipos', () => {
    expect(raiz.querySelector('img.logo')).not.toBeNull();
    expect(raiz.querySelector('.nombre')!.textContent).toContain('MatchFinder');

    const enlace = raiz.querySelector('.tabs a')!;
    expect(enlace.textContent).toContain('Equipos');
    expect(enlace.getAttribute('href')).toBe('/equipos');
  });

  it('muestra el email y el rol de la sesión iniciada', () => {
    expect(raiz.querySelector('.usuario')!.textContent).toContain('owner@matchfinder.com');
    expect(raiz.querySelector('.usuario .badge')!.textContent).toContain('OWNER');
  });

  it('Salir cierra la sesión y vuelve a /login', async () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    raiz.querySelector<HTMLButtonElement>('header button')!.click();
    await fixture.whenStable();

    expect(authService.sesion()).toBeNull();
    expect(navegar).toHaveBeenCalledWith(['/login']);
  });

  it('el owner no ve la pestaña Amigos, pero sí Torneo', () => {
    const enlaces = Array.from(raiz.querySelectorAll('.tabs a')).map((a) => a.textContent?.trim());

    expect(enlaces).toEqual(['Equipos', 'Torneo']);
  });

  it('un usuario sí ve la pestaña Amigos', async () => {
    authService.sesion.set({ token: 'abc123', email: 'juan@mail.com', rol: 'USUARIO' });
    await fixture.whenStable();

    const enlaces = Array.from(raiz.querySelectorAll('.tabs a')).map((a) => a.getAttribute('href'));
    expect(enlaces).toEqual(['/equipos', '/amigos', '/torneo']);
  });
});
