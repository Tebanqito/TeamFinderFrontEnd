import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthLayoutComponent } from './auth-layout.component';

describe('AuthLayoutComponent', () => {
  let fixture: ComponentFixture<AuthLayoutComponent>;
  let raiz: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthLayoutComponent],
      providers: [provideRouter([])],
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
  });
});
