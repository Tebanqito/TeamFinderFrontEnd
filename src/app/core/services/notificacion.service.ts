import { Injectable, signal } from '@angular/core';

export interface Notificacion {
  tipo: 'exito' | 'error';
  texto: string;
}

/** Aviso breve en pantalla ("Te uniste al equipo", "No hay cupo", ...). Se cierra solo a los 4 segundos. */
@Injectable({
  providedIn: 'root',
})
export class NotificacionService {
  readonly actual = signal<Notificacion | null>(null);
  private temporizador: ReturnType<typeof setTimeout> | undefined;

  exito(texto: string): void {
    this.mostrar({ tipo: 'exito', texto });
  }

  error(texto: string): void {
    this.mostrar({ tipo: 'error', texto });
  }

  cerrar(): void {
    clearTimeout(this.temporizador);
    this.actual.set(null);
  }

  private mostrar(notificacion: Notificacion): void {
    clearTimeout(this.temporizador);
    this.actual.set(notificacion);
    this.temporizador = setTimeout(() => this.actual.set(null), 4000);
  }
}
