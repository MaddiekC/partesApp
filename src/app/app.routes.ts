import { Routes } from '@angular/router';
import { LoginPage } from './login/login.page';
import { AuthGuard } from './services/auth.guard';
import { MainComponent } from './main/main.component'; 

export const routes: Routes = [
  // Ruta de login (pública)
  { path: 'login', component: LoginPage },

  // Ruta principal (protegida)
  {
    path: '',
    component: MainComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'tabs',
        loadChildren: () =>
          import('./tabs/tabs.routes').then((m) => m.routes), 
      },
      {
        path: '',
        redirectTo: 'tabs',
        pathMatch: 'full', // ✅ redirige automáticamente
      },
    ],
  },

  // Ruta por defecto (redirige al login)
  { path: '**', redirectTo: 'login' },
];
