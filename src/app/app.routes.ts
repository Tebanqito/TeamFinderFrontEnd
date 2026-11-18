import { Routes } from '@angular/router';

import { RegistroComponent } from './features/auth/registro/registro.component';

export const routes: Routes = [
  { path: 'registro', component: RegistroComponent },
  { path: '', redirectTo: 'registro', pathMatch: 'full' },
  { path: '**', redirectTo: 'registro' },
];
