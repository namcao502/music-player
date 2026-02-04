/** Stored playlist: name + list of Audius track IDs. */

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
}

export const PLAYLISTS_STORAGE_KEY = 'music-player-playlists';
