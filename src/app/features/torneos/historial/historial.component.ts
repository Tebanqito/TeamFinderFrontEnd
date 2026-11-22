import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { Pagina } from '../../../core/models/pagina.model';
import { TorneoResumen } from '../../../core/models/torneo.model';
import { nombreDeTipo } from '../../../core/models/equipo.model';
import { TorneoService } from '../../../core/services/torneo.service';
import { mensajeDeError } from '../../../core/utils/problema-api';

const TORNEOS_POR_PAGINA = 10;

/** Historial: torneos finalizados, los más recientes primero, con su campeón y un acceso a sus llaves. */
@Component({
  selector: 'app-historial',
  templateUrl: './historial.component.html',
  styleUrl: './historial.component.css',
})
export class HistorialComponent implements OnInit {
  private readonly torneoService = inject(TorneoService);
  private readonly router = inject(Router);

  protected readonly pagina = signal<Pagina<TorneoResumen> | null>(null);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  private numeroPagina = 0;

  protected readonly tipo = nombreDeTipo;

  ngOnInit(): void {
    this.recargar();
  }

  protected irA(numero: number): void {
    this.numeroPagina = numero;
    this.recargar();
  }

  /** Vuelve a pedir la página actual (por ejemplo, después de finalizar un torneo). */
  recargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);

    this.torneoService.listar('FINALIZADO', this.numeroPagina, TORNEOS_POR_PAGINA).subscribe({
      next: (resultado) => {
        this.pagina.set(resultado);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.errorCarga.set(mensajeDeError(err));
      },
    });
  }

  protected verLlaves(torneo: TorneoResumen): void {
    void this.router.navigate(['/torneo', 'historial', torneo.id]);
  }
}
