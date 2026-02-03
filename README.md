# Music Player (Angular)

A simple Angular web app that plays **free music** from [Audius](https://audius.org/): search and stream royalty-free tracks with no login and no backend required.

---

## Free Music (no backend required)

When you open the app, you land straight on the **Free Music** page. Music is streamed from Audius (free, open API, no account needed).

- **Search** by track name or artist; click **Search** or press Enter.
- **Recent searches**: up to 5 recent search terms are shown as chips; click one to run that search again (stored in `localStorage`).
- **Play**: click a track to play; search results become the playback queue so you can use previous/next in the player bar.
- **Theme**: light/dark toggle in the top-right corner.

---

## How to run this project

### Install and run (frontend only)

```bash
cd music-player
npm install
npm start
```

Open http://localhost:4200. You go straight to the Free Music page.

### Build for production

```bash
npm run build
```

Output is in `dist/music-player/browser/`. Serve that folder with any static file server.

---

## Features

- **Free Music**: Search Audius, play tracks, queue from search results.
- **Recent searches**: Up to 5 recent search terms; click to re-run (persisted in `localStorage`).
- **Player bar**: Fixed at the bottom with cover, title, artist, play/pause, previous/next, seekable progress bar.
- **Theme**: Light/dark mode with toggle in top-right corner; preference stored in `localStorage`.

### Project structure

- `src/app/services/audius-api.service.ts` – Audius API: search tracks, stream URLs, artwork.
- `src/app/services/player.service.ts` – Playback state, queue, play/playQueue/toggle/next/previous.
- `src/app/components/free-music` – Search, recent searches, results grid, play.
- `src/app/components/player-bar` – Now playing and controls.
- `src/app/services/theme.service.ts` – Light/dark theme.
