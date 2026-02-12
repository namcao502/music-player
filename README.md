# Free Music Player

A browser-based music player built with Angular that streams **free, royalty-free music** from [Audius](https://audius.org/). No login, no backend, no ads.

---

## How to run

```bash
npm install
npm start
```

Open http://localhost:4200.

### Build for production

```bash
npm run build
```

Output is in `dist/music-player/browser/`. Serve with any static file server. PWA features (offline, install) require HTTPS.

### Run tests

```bash
npm test
```

189 unit tests (Jasmine + Karma).

---

## Features

### Music Discovery

- **Search** millions of tracks on Audius by keyword with paginated results (24 per page).
- **Trending** — browse the top 50 trending tracks.
- **Artist pages** — click any artist name to see their full track list.
- **Sort** search results by relevance, duration, or artist name.
- **Recent searches** — last 5 searches saved as clickable chips.

### Playback

- **Player bar** at the bottom with cover art, title, artist, play/pause, previous/next, **seek ±10 s** buttons, and seekbar.
- **Queue** — click a track to play; the full page becomes the queue. Open "Up Next" panel to **remove** tracks or add to playlist.
- **Shuffle** and **Loop** (off / loop all / loop one).
- **Volume** and **playback speed** — persisted across sessions; dynamic speaker icon.
- **Crossfade** — smooth fade between tracks (0–12 seconds, configurable in queue panel).
- **Keyboard shortcuts** — Space (play/pause), Left/Right arrows (previous/next); media keys when available.
- **Sleep timer**, **share track link**; optional **audio visualizer** and **mini player** (desktop).

### Playlists

- Create, rename, **duplicate**, and delete playlists; **tags** with filter chips; **sort** by name or track count.
- Add tracks from search results, trending, or the queue panel.
- Reorder tracks with drag-and-drop in playlist detail.
- **Export** playlists as JSON files; **import** from JSON.

### Favorites

- Heart icon on every track to mark as favorite.
- Dedicated **Favorites page** to view, play, and manage all liked tracks.

### Play History

- Automatically records the last 50 played tracks with timestamps.
- **History page**: **sort** by date, title, or artist; replay any track; **remove** single entry or clear all.

### Theming

- Dark mode (default) and Light mode, toggled via the sun/moon button.
- Respects OS preference on first visit; persists across sessions.

### Accessibility

- **Live region** announces "Now playing: Title by Artist" for screen readers.
- **Reduced motion** — `prefers-reduced-motion: reduce` disables non-essential animations.

### Responsive & PWA

- Mobile-friendly layout at screen widths below 640px.
- **Installable** as a Progressive Web App (Add to Home Screen).
- **Offline support** — app shell cached via Angular Service Worker; API responses cached for 1 hour.

---

## Navigation

| Tab | Route | Description |
|-----|-------|-------------|
| Free Music | `/free-music` | Search and stream (default) |
| Trending | `/trending` | Top 50 trending tracks |
| Playlists | `/playlists` | Manage playlists |
| Favorites | `/favorites` | Liked tracks |
| History | `/history` | Recently played |

Additional routes: `/playlists/:id` (playlist detail), `/artist/:id` (artist page).

---

## Project structure

```
src/app/
  components/
    free-music/       Search, results grid, sort, add to playlist
    trending/         Trending tracks list
    artist/           Artist page with track list
    playlist-list/    Playlist management (create, import, play)
    playlist-detail/  Single playlist (reorder, export, play)
    favorites/        Favorited tracks list
    history/          Play history with timestamps
    player-bar/       Now playing, queue panel, crossfade, volume, sleep timer
    playlist-modal/   Prompt and confirm dialogs
    notification-toast/  Toast notifications
  services/
    audius-api        Audius API (search, tracks, streaming, artwork)
    player            Playback state, queue, shuffle, loop, crossfade
    playlist          Playlist CRUD, import/export (localStorage)
    favorites         Favorite track IDs (localStorage)
    history           Play history with auto-recording (localStorage)
    theme             Light/dark theme (localStorage)
    sleep-timer       Sleep timer (in-memory)
    free-music-state  In-memory search state persistence
    playlist-modal    Modal dialog state
  constants/
    ui-strings        Centralized user-facing text
  models/
    audius.models     Audius API response types
    playlist.model    Playlist interface
```

## Documentation

- [Features](docs/FEATURES.md) — full feature list with details
- [Workflow](docs/WORKFLOW.md) — end-to-end app workflow and data flow
- [Free Music Design](docs/FREE_MUSIC_PLAN.md) — Free Music module design
- [Playlist Design](docs/PLAYLIST_PLAN.md) — Playlist module design
- [Test Plan](docs/TEST_PLAN.md) — test cases and verification

## Data storage

All user data is stored in the browser's `localStorage`:

| Key | Data |
|-----|------|
| `music-player-playlists` | Playlists (name + track IDs) |
| `music-player-theme` | Theme preference |
| `music-player-favorites` | Favorite track IDs |
| `music-player-history` | Last 50 played tracks |
| `free-music-recent-searches` | Last 5 search queries |
| `music-player-volume` | Volume (0–1) |
| `music-player-muted` | Mute state |
| `music-player-playback-speed` | Playback speed (e.g. 1) |
| `crossfade-duration` | Crossfade setting (0–12s) |
