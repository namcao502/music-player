import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'free-music',
    pathMatch: 'full'
  },
  {
    path: 'free-music',
    loadComponent: () => import('./components/free-music/free-music.component').then((m) => m.FreeMusicComponent)
  },
  {
    path: '**',
    redirectTo: 'free-music'
  }
];
