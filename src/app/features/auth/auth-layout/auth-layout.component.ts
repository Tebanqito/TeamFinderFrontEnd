import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

/** Tarjeta con el logo y las pestañas Ingresar / Registrarme; adentro se muestra la pantalla activa. */
@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.css',
})
export class AuthLayoutComponent {
  protected readonly authService = inject(AuthService);

  protected cerrarSesion(): void {
    this.authService.logout();
  }
}
