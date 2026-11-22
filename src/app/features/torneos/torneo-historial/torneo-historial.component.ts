import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { nombreDeTipo } from '../../../core/models/equipo.model';
import { Llave, Torneo } from '../../../core/models/torneo.model';
import { TorneoService } from '../../../core/services/torneo.service';
import { mensajeDeError } from '../../../core/utils/problema-api';
import { LlavesComponent } from '../llaves/llaves.component';

/** Llaves de un torneo del historial (solo lectura). */
@Component({
  selector: 'app-torneo-historial',
  imports: [LlavesComponent],
  templateUrl: './torneo-historial.component.html',
})
export class TorneoHistorialComponent implements OnInit {
  private readonly torneoService = inject(TorneoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly torneo = signal<Torneo | null>(null);
  protected readonly llave = signal<Llave | null>(null);

  protected readonly tipo = nombreDeTipo;

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargando.set(true);
    this.errorCarga.set(null);

    forkJoin({ torneo: this.torneoService.obtener(id), llave: this.torneoService.obtenerLlaves(id) }).subscribe({
      next: (datos) => {
        this.torneo.set(datos.torneo);
        this.llave.set(datos.llave);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.errorCarga.set(mensajeDeError(err));
      },
    });
  }

  protected volver(): void {
    void this.router.navigate(['/torneo']);
  }
}
