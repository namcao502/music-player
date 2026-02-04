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
    path: 'playlists',
    loadComponent: () => import('./components/playlist-list/playlist-list.component').then((m) => m.PlaylistListComponent)
  },
  {
    path: 'playlists/:id',
    loadComponent: () => import('./components/playlist-detail/playlist-detail.component').then((m) => m.PlaylistDetailComponent)
  },
  {
    path: '**',
    redirectTo: 'free-music'
  }
];
