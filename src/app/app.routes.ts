import { Routes } from '@angular/router';

import { authGuard, sinSesionGuard } from './core/guards/auth.guard';
import { soloUsuarioGuard } from './core/guards/usuario.guard';
import { AmigosComponent } from './features/amigos/amigos/amigos.component';
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
    ],
  },

  { path: '**', redirectTo: 'equipos' },
];
