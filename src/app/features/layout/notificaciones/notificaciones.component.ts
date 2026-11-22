import { Component, inject } from '@angular/core';

import { NotificacionService } from '../../../core/services/notificacion.service';

/** Muestra el aviso actual del NotificacionService en una esquina de la pantalla. */
@Component({
  selector: 'app-notificaciones',
  template: `
    @if (servicio.actual(); as aviso) {
      <div class="notificacion" [class.exito]="aviso.tipo === 'exito'" [class.error]="aviso.tipo === 'error'"
           [attr.role]="aviso.tipo === 'error' ? 'alert' : 'status'">
        <span>{{ aviso.texto }}</span>
        <button type="button" class="cerrar" aria-label="Cerrar aviso" (click)="servicio.cerrar()">×</button>
      </div>
    }
  `,
  styles: `
    .notificacion {
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      z-index: 20;
      display: flex;
      align-items: center;
      gap: 0.8rem;
      max-width: min(420px, calc(100vw - 2rem));
      padding: 0.7rem 1rem;
      border: 1px solid var(--ok);
      border-radius: 8px;
      background: var(--card, #fff);
      color: var(--ok);
      box-shadow: 0 4px 16px rgb(0 0 0 / 0.2);
    }
    .notificacion.error {
      border-color: var(--bad, #c0392b);
      color: var(--bad, #c0392b);
    }
    .cerrar {
      border: 0;
      background: none;
      color: inherit;
      font-size: 1.3rem;
      line-height: 1;
      cursor: pointer;
    }
  `,
})
export class NotificacionesComponent {
  protected readonly servicio = inject(NotificacionService);
}
