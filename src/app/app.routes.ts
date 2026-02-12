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
    path: 'trending',
    loadComponent: () => import('./components/trending/trending.component').then((m) => m.TrendingComponent)
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
    path: 'artist/:id',
    loadComponent: () => import('./components/artist/artist.component').then((m) => m.ArtistComponent)
  },
  {
    path: 'favorites',
    loadComponent: () => import('./components/favorites/favorites.component').then((m) => m.FavoritesComponent)
  },
  {
    path: 'history',
    loadComponent: () => import('./components/history/history.component').then((m) => m.HistoryComponent)
  },
  {
    path: 'stats',
    loadComponent: () => import('./components/stats/stats.component').then((m) => m.StatsComponent)
  },
  {
    path: 'import',
    loadComponent: () => import('./components/import/import.component').then((m) => m.ImportComponent)
  },
  {
    path: '**',
    redirectTo: 'free-music'
  }
];
