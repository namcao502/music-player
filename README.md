# Music Player (Angular)

A simple Angular web app that plays **free music** from [Audius](https://audius.org/): search and stream royalty-free tracks with no login and no backend required.

---

## Free Music (no backend required)

When you open the app, you land straight on the **Free Music** page. Music is streamed from Audius (free, open API, no account needed).

- **Search** by track name or artist; click **Search** or press Enter.
- **Recent searches**: up to 5 recent search terms are shown as chips; click one to run that search again (stored in `localStorage`).
- **Play**: click a track to play; search results become the playback queue so you can use previous/next in the player bar.
- **Add to playlist**: use the **+** button on a track to open a dropdown and add the track to an existing playlist (playlists are created under **Playlists** and stored in `localStorage`).
- **Keyboard**: when something is playing, use **Space** (play/pause), **←** (previous), **→** (next). Shortcuts are disabled while typing in the search box.
- **Theme**: light/dark toggle in the top-right corner.
- **Playlists**: from the nav, open **Playlists** to create playlists, add tracks from Free Music, play a playlist, rename, or delete.

---

## How to run this project

### Install and run (frontend only)

```bash
cd music-player
npm install
npm start
```

Open http://localhost:4200. Use the nav to switch between **Free Music** and **Playlists**.

### Build for production

```bash
npm run build
```

Output is in `dist/music-player/browser/`. Serve that folder with any static file server.

---

## Features

- **Free Music**: Search Audius, play tracks, queue from search results. Add tracks to playlists via the + button on each result.
- **Playlists**: Create playlists (stored in `localStorage`), add tracks from Free Music, play/rename/delete. No backend.
- **Recent searches**: Up to 5 recent search terms; click to re-run (persisted in `localStorage`).
- **Player bar**: Fixed at the bottom with cover, title, artist, play/pause, previous/next, seekable progress bar. Keyboard: Space (play/pause), Arrow Left (previous), Arrow Right (next).
- **Theme**: Light/dark mode with toggle in top-right corner; preference stored in `localStorage`.

### Documentation

- **Plans:** `docs/FREE_MUSIC_PLAN.md` (Free Music feature), `docs/PLAYLIST_PLAN.md` (Playlists).
- **Testing:** `docs/TEST_PLAN.md` – test cases and how to run tests.

### Project structure

- `src/app/services/audius-api.service.ts` – Audius API: search tracks, get track by id, stream URLs, artwork.
- `src/app/services/player.service.ts` – Playback state, queue, play/playQueue/toggle/next/previous.
- `src/app/services/playlist.service.ts` – Playlists CRUD and track resolution (localStorage).
- `src/app/components/free-music` – Search, recent searches, results grid, play, add to playlist.
- `src/app/components/playlist-list` – List playlists, create/play/rename/delete.
- `src/app/components/playlist-detail` – View playlist tracks, play, remove track, rename/delete.
- `src/app/components/player-bar` – Now playing and controls.
- `src/app/services/theme.service.ts` – Light/dark theme.
