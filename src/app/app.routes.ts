import { Routes } from '@angular/router';
import { LoginPage } from './login/login.page';
import { AuthGuard } from './services/auth.guard';
import { PartesPage } from './partes/partes.page';
import { PartesDetallesPage } from './partes-detalles/partes-detalles.page';
import { AgregarDetPage } from './agregar-det/agregar-det.page';

export const routes: Routes = [
  { path: 'login', component: LoginPage },

  { path: 'partes', component: PartesPage, canActivate: [AuthGuard] },

  { path: 'partes/:id', component: PartesDetallesPage, canActivate: [AuthGuard] },

  {
    path: 'agregar-det/:id',
    component: AgregarDetPage, canActivate: [AuthGuard]
  },
  // ruta por defecto
  { path: '', redirectTo: 'partes', pathMatch: 'full' },

  { path: '**', redirectTo: 'login' },
];
