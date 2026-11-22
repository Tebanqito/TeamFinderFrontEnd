import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { NotificacionesComponent } from '../notificaciones/notificaciones.component';

/** Navbar con el logo, la navegación y la sesión; abajo se muestra la pantalla activa. */
@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NotificacionesComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected salir(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
