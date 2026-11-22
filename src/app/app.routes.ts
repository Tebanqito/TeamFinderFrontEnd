import { Routes } from '@angular/router';

import { authGuard, sinSesionGuard } from './core/guards/auth.guard';
import { soloOwnerGuard } from './core/guards/owner.guard';
import { soloUsuarioGuard } from './core/guards/usuario.guard';
import { AmigosComponent } from './features/amigos/amigos/amigos.component';
import { TorneoHistorialComponent } from './features/torneos/torneo-historial/torneo-historial.component';
import { TorneosComponent } from './features/torneos/torneos/torneos.component';
import { UsuariosComponent } from './features/usuarios/usuarios/usuarios.component';
import { EquiposComponent } from './features/equipos/equipos/equipos.component';
import { AuthLayoutComponent } from './features/auth/auth-layout/auth-layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegistroComponent } from './features/auth/registro/registro.component';
import { MainLayoutComponent } from './features/layout/main-layout/main-layout.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'equipos' },

  // Pantallas públicas: ingreso y registro
  {
    path: '',
    component: AuthLayoutComponent,
    canActivate: [sinSesionGuard],
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'registro', component: RegistroComponent },
    ],
  },

  // Pantallas internas: requieren sesión iniciada
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'equipos', component: EquiposComponent },
      { path: 'amigos', component: AmigosComponent, canActivate: [soloUsuarioGuard] },
      { path: 'torneo', component: TorneosComponent },
      { path: 'torneo/historial/:id', component: TorneoHistorialComponent },
      { path: 'usuarios', component: UsuariosComponent, canActivate: [soloOwnerGuard] },
    ],
  },

  { path: '**', redirectTo: 'equipos' },
];
