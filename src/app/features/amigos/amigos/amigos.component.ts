import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import { Amigo } from '../../../core/models/amigo.model';
import { SolicitudAmistad } from '../../../core/models/solicitud.model';
import { AmigoService } from '../../../core/services/amigo.service';
import { SolicitudService } from '../../../core/services/solicitud.service';
import { mensajeDeError } from '../../../core/utils/problema-api';
import { AmigoAgregarComponent } from '../amigo-agregar/amigo-agregar.component';
import { AmigosListaComponent } from '../amigos-lista/amigos-lista.component';
import { SolicitudesEnviadasComponent } from '../solicitudes-enviadas/solicitudes-enviadas.component';
import { SolicitudesRecibidasComponent } from '../solicitudes-recibidas/solicitudes-recibidas.component';

/** Pantalla de amigos: agregar por nombre, solicitudes recibidas y enviadas, y la lista de amigos. */
@Component({
  selector: 'app-amigos',
  imports: [AmigoAgregarComponent, SolicitudesRecibidasComponent, SolicitudesEnviadasComponent, AmigosListaComponent],
  templateUrl: './amigos.component.html',
})
export class AmigosComponent implements OnInit {
  private readonly solicitudService = inject(SolicitudService);
  private readonly amigoService = inject(AmigoService);

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly recibidas = signal<SolicitudAmistad[]>([]);
  protected readonly enviadas = signal<SolicitudAmistad[]>([]);
  protected readonly amigos = signal<Amigo[]>([]);

  ngOnInit(): void {
    this.cargar();
  }

  /** Trae de la API las tres listas juntas. Se llama al abrir y después de cada cambio. */
  protected cargar(): void {
    this.errorCarga.set(null);

    forkJoin({
      recibidas: this.solicitudService.recibidas(),
      enviadas: this.solicitudService.enviadas(),
      amigos: this.amigoService.listar(),
    }).subscribe({
      next: (datos) => {
        this.recibidas.set(datos.recibidas);
        this.enviadas.set(datos.enviadas);
        this.amigos.set(datos.amigos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.errorCarga.set(mensajeDeError(err));
      },
    });
  }
}
