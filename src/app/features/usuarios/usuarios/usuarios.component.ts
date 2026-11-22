import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { UsuarioDetalle } from '../../../core/models/usuario.model';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { mensajeDeError } from '../../../core/utils/problema-api';
import { UsuarioFilaComponent } from '../usuario-fila/usuario-fila.component';

const USUARIOS_POR_PAGINA = 20;
const ESPERA_BUSQUEDA_MS = 300;

/** Pantalla "Usuarios" (solo owner): búsqueda por nombre, "Ver más" de a 20 y eliminación. */
@Component({
  selector: 'app-usuarios',
  imports: [FormsModule, UsuarioFilaComponent],
  templateUrl: './usuarios.component.html',
})
export class UsuariosComponent implements OnInit, OnDestroy {
  private readonly usuarioService = inject(UsuarioService);
  private readonly authService = inject(AuthService);
  private readonly notificaciones = inject(NotificacionService);

  protected texto = '';
  protected readonly usuarios = signal<UsuarioDetalle[]>([]);
  protected readonly total = signal(0);
  protected readonly cargando = signal(true);
  protected readonly cargandoMas = signal(false);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly eliminandoId = signal<number | null>(null);

  protected readonly hayMas = computed(() => this.usuarios().length < this.total());
  private readonly miEmail = computed(() => this.authService.sesion()?.email);

  private paginasCargadas = 0;
  private temporizador: ReturnType<typeof setTimeout> | undefined;
  /** Número de la última búsqueda: una respuesta vieja que llega tarde se descarta. */
  private busqueda = 0;

  ngOnInit(): void {
    this.buscar();
  }

  ngOnDestroy(): void {
    clearTimeout(this.temporizador);
  }

  /** Se busca mientras se escribe, esperando un instante para no pedir en cada tecla. */
  protected alEscribir(): void {
    clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.buscar(), ESPERA_BUSQUEDA_MS);
  }

  protected puedeEliminar(usuario: UsuarioDetalle): boolean {
    return usuario.email !== this.miEmail();
  }

  /** Empieza de nuevo desde la primera página con el texto actual. */
  protected buscar(): void {
    const numero = ++this.busqueda;
    this.errorCarga.set(null);
    this.cargando.set(true);

    this.usuarioService.listar(this.texto, 0, USUARIOS_POR_PAGINA).subscribe({
      next: (pagina) => {
        if (numero !== this.busqueda) {
          return;
        }
        this.usuarios.set(pagina.contenido);
        this.total.set(pagina.totalElementos);
        this.paginasCargadas = 1;
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        if (numero !== this.busqueda) {
          return;
        }
        this.cargando.set(false);
        this.errorCarga.set(mensajeDeError(err));
      },
    });
  }

  protected verMas(): void {
    const numero = this.busqueda;
    this.cargandoMas.set(true);

    this.usuarioService.listar(this.texto, this.paginasCargadas, USUARIOS_POR_PAGINA).subscribe({
      next: (pagina) => {
        this.cargandoMas.set(false);
        if (numero !== this.busqueda) {
          return;
        }
        this.usuarios.update((actuales) => [...actuales, ...pagina.contenido]);
        this.total.set(pagina.totalElementos);
        this.paginasCargadas++;
      },
      error: (err: HttpErrorResponse) => {
        this.cargandoMas.set(false);
        this.notificaciones.error(mensajeDeError(err));
      },
    });
  }

  protected eliminar(usuario: UsuarioDetalle): void {
    this.eliminandoId.set(usuario.id);
    this.usuarioService.eliminar(usuario.id).subscribe({
      next: () => {
        this.eliminandoId.set(null);
        this.notificaciones.exito(`Se eliminó a ${usuario.nombre}.`);
        this.recargar();
      },
      error: (err: HttpErrorResponse) => {
        this.eliminandoId.set(null);
        this.notificaciones.error(mensajeDeError(err));
      },
    });
  }

  /** Vuelve a pedir todas las páginas que ya se estaban mostrando, para que no se corra ningún usuario. */
  private recargar(): void {
    const numero = ++this.busqueda;
    const paginas = Math.max(this.paginasCargadas, 1);
    const pedidos = Array.from({ length: paginas }, (_, i) => this.usuarioService.listar(this.texto, i, USUARIOS_POR_PAGINA));

    forkJoin(pedidos).subscribe({
      next: (resultados) => {
        if (numero !== this.busqueda) {
          return;
        }
        this.usuarios.set(resultados.flatMap((r) => r.contenido));
        this.total.set(resultados[resultados.length - 1].totalElementos);
      },
      error: (err: HttpErrorResponse) => this.notificaciones.error(mensajeDeError(err)),
    });
  }
}
