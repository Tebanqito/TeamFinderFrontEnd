import { Component, viewChild } from '@angular/core';

import { HistorialComponent } from '../historial/historial.component';
import { TorneoActivoComponent } from '../torneo-activo/torneo-activo.component';

/** Pantalla "Torneo": el torneo activo (con sus llaves) y debajo el historial de los finalizados. */
@Component({
  selector: 'app-torneos',
  imports: [TorneoActivoComponent, HistorialComponent],
  template: `
    <div class="pagina">
      <app-torneo-activo (cambio)="historial()?.recargar()" />
      <app-historial />
    </div>
  `,
})
export class TorneosComponent {
  protected readonly historial = viewChild(HistorialComponent);
}
