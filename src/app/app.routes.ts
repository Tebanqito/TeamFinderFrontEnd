import { Routes } from '@angular/router';

<<<<<<< HEAD
import { authGuard, sinSesionGuard } from './core/guards/auth.guard';
import { EquiposComponent } from './features/equipos/equipos/equipos.component';
=======
>>>>>>> b716a4f6373288273541beb209f64ae12a4e98f4
import { AuthLayoutComponent } from './features/auth/auth-layout/auth-layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegistroComponent } from './features/auth/registro/registro.component';
import { MainLayoutComponent } from './features/layout/main-layout/main-layout.component';

export const routes: Routes = [
<<<<<<< HEAD
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
    children: [{ path: 'equipos', component: EquiposComponent }],
  },

  { path: '**', redirectTo: 'equipos' },
=======
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'registro', component: RegistroComponent },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'login' },
>>>>>>> b716a4f6373288273541beb209f64ae12a4e98f4
];
