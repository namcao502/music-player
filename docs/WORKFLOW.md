# Music Player – Full Workflow

This document describes how the app works end-to-end: routes, user flow, and technical flow. The app has two main areas: **Free Music** (search and stream from Audius) and **Playlists** (saved track lists in `localStorage`). No login, no backend.

**Docs:** Feature list: `docs/FEATURES.md`. Module designs: `docs/FREE_MUSIC_PLAN.md`, `docs/PLAYLIST_PLAN.md`. Tests: `docs/TEST_PLAN.md`.

---

## 0. Architecture overview

- **Core services:** **PlayerService** (now playing, queue, shuffle/loop); **AudiusApiService** (search, track by id, stream URL, artwork); **ThemeService** (light/dark); **PlaylistService** (CRUD, tags, getPlayableTracks, import/export); **FavoritesService** (favorite IDs); **HistoryService** (last 50 plays + play counts); **FreeMusicStateService** (in-memory Free Music state); **PlaylistModalService** (prompt/confirm modals).
- **Routing:** Default route `''` → `/free-music`. All feature routes are lazy-loaded. Wildcard `**` → `/free-music`.
- **State:** Playback and UI state live in services (signals); persistence is `localStorage` for playlists, theme, favorites, history, play counts, recent searches, volume, muted, playback speed, crossfade. See **State and persistence** below and the storage table in `docs/FEATURES.md`.

---

## 1. Application entry and routing

```
User opens app (e.g. http://localhost:4200)
    -> index.html loads, theme script runs (sets .theme-light or .theme-dark from localStorage/preference)
    -> Angular bootstraps app-root
    -> Router loads; default route '' redirects to '/free-music'
    -> Layout: nav (Free Music | Trending | Playlists | Favorites | History | Stats) + theme toggle (top right) + main content (router-outlet) + player bar
    -> <app-playlist-modal /> is always in the DOM (above the app div) for prompt/confirm dialogs
```

**Routes** (defined in `src/app/app.routes.ts`):

| Path | Screen | Component | Lazy |
|------|--------|-----------|------|
| `''` | Redirect to `/free-music` | — | — |
| `/free-music` | Free Music | `FreeMusicComponent` | Yes |
| `/trending` | Trending | `TrendingComponent` | Yes |
| `/playlists` | Playlist list | `PlaylistListComponent` | Yes |
| `/playlists/:id` | Playlist detail | `PlaylistDetailComponent` | Yes |
| `/artist/:id` | Artist page | `ArtistComponent` | Yes |
| `/favorites` | Favorites | `FavoritesComponent` | Yes |
| `/history` | Play history | `HistoryComponent` | Yes |
| `/stats` | Listening stats | `StatsComponent` | Yes |
| `/import` | Playlist import (shared URL) | `ImportComponent` | Yes |
| `**` | Redirect to `/free-music` | — | — |

---

## 2. User workflow (Free Music)

1. User lands on **Free Music** (default) or returns from Playlists; last search state (query, results, page, broken covers) is restored from **FreeMusicStateService**.
2. User types a search query (e.g. "bossa nova") and clicks **Search** (or Enter).
3. **FreeMusicComponent.onSearch()**:
   - Adds query to **recent searches** (max 5, deduped case-insensitively, persisted in `localStorage` under `free-music-recent-searches`).
   - Resets page to 1; calls **AudiusApiService.searchTracks(query, 24, offset)**.
   - On success: sets tracks, hasNextPage; syncs state to **FreeMusicStateService**.
4. Results (track cards with artwork, title, artist, duration) are shown. **Pagination:** Previous / Next (page 1-based; Next enabled when last response had 24 items).
5. **Recent searches**: Up to 5 chips; click a chip -> **runRecentSearch(term)** sets query and runs search again.
6. **Add to playlist:** Per track, "+" opens a dropdown (existing playlists + "Create new playlist"). Choosing a playlist -> **PlaylistService.addTrack(playlistId, track.id)**. Create new -> **PlaylistModalService.openPrompt** for name -> create playlist, add track, navigate to `/playlists/:id`.
7. User clicks a track card.
8. **FreeMusicComponent.onTrackClick(track)**: same track -> **togglePlayPause**; different track -> **play(track)**:
   - Builds **PlayableTrack** list from current results; calls **PlayerService.playQueue(playables, index)** so the whole result page is the queue.
   - Stream URL: **AudiusApiService.getStreamEndpointUrl(track.id)**.
9. **PlayerService** sets nowPlaying and playing; **PlayerBarComponent** sets `audio.src`, loads, and plays. Player bar: cover, title, artist, **shuffle**, **loop**, play/pause, prev/next, progress bar, queue panel (with add-to-playlist per item).

---

## 3. Playback flow (technical)

```
[User clicks play on a track]
        |
        v
Free Music or Playlist:
  -> getStreamEndpointUrl(id) (Audius API URL)
  -> PlayerService.playQueue(playables, index) with playable + streamUrl
        |
        v
PlayerService: current = { track, streamUrl }, playing = true
  -> playbackTrigger(url, trackId) fires synchronously (same user gesture)
        |
        v
PlayerBarComponent (playbackTrigger callback):
  - suppressAudioEvents for 1500ms (avoids toggle loops from src change)
  - set audio.src = streamUrl, audio.load()
  - startPlayWhenReady(el): audio.play() now + again on 'canplay'
  - after 1500ms: syncFromElement() to align UI with actual state
        |
        v
PlayerBarComponent (effect):
  - watches nowPlaying() and isPlaying()
  - if new track and NOT just set by trigger: set audio.src, load, play
  - if same track: just drive play/pause from isPlaying()
        |
        v
Browser: audio element loads URL (Audius 302 -> CDN)
  fires play/pause/timeupdate/ended/durationchange/error
        |
        v
Player bar: timeupdate -> currentTime; play -> setPlaying(true);
  pause -> setPlaying(false); ended -> PlayerService.handleEnded()
```

**Seek:** User drags progress bar -> `onSeekInput(value)` (visual update) -> `onSeekChange(value)` -> `audio.currentTime = value`. **Seek ±10 s:** Buttons call `seekRelative(-10)` / `seekRelative(10)` -> clamp and set `audio.currentTime`.

**Play/Pause button:** **PlayerService.togglePlayPause()** -> effect runs -> `audio.play()` or `audio.pause()`.

**Previous/Next:** **PlayerService.previous() / next()** -> changes nowPlaying -> effect runs with new track.

**Shuffle and Loop:**

- **Shuffle** (`PlayerService.shuffleEnabled`): When enabled, `next()` and `previous()` pick a random track from the queue (different from the current one when possible, using `pickRandomDifferent` with up to 8 random attempts + fallback).
- **Loop** (`PlayerService.loopMode`): Cycles through `'off'` -> `'all'` -> `'one'` via `cycleLoopMode()`.
  - **Off**: `next()` at end of queue stops playback (pauses, keeps current track visible); `previous()` at start wraps to end.
  - **Loop all**: `next()` at end wraps to first track.
  - **Loop one**: `handleEnded()` re-plays the current track (calls `play()` with the same track and streamUrl).

**Autoplay blocked:** If `audio.play()` is rejected (browser autoplay policy), `onPlayFailed()` sets `isPlaying` to false and registers a one-time `click`/`keydown` listener on the document to retry `play()` on the next user gesture.

---

## 4. User workflow (Playlists)

1. User clicks **Playlists** in the nav -> **PlaylistListComponent**; lists playlists from **PlaylistService** (localStorage).
2. **New playlist:** Opens prompt modal (via **PlaylistModalService.openPrompt**) -> **PlaylistService.create(name)** -> navigate to `/playlists/:id`.
3. **Play:** **PlaylistService.getPlayableTracks(id)** resolves track IDs to **PlayableTrack[]** via `forkJoin` of **AudiusApiService.getTrackById** -> **PlayerService.playQueue(playables, 0)**.
4. **Rename:** Opens prompt modal with current name -> **PlaylistService.rename(id, name)**.
5. **Delete:** Opens confirm modal ("Delete 'name'?") -> **PlaylistService.delete(id)**.
6. **Open playlist:** Navigate to `/playlists/:id` -> **PlaylistDetailComponent**; loads track details via `forkJoin` of `getTrackById` calls; shows tracks with title, artist, duration, artwork.
7. **Detail actions:** Play (same as step 3), Remove track (`playlistService.removeTrack`), Reorder (drag-and-drop, disabled when filter is active), Rename, Delete (with confirm, then navigate back to `/playlists`), Export JSON, **Share** (copy shareable URL to clipboard), Back button.
8. **Share playlist:** Copies a URL (`/import?tracks=id1,id2&name=...`) to clipboard. Opening this URL in a browser imports the playlist via **ImportComponent** and redirects to the new playlist detail page.

---

## 5. State and persistence

- All persistent user data is in the browser’s `localStorage`. Keys and contents are documented in **Technical Details → Storage** in `docs/FEATURES.md`.
- Summary: playlists (`music-player-playlists`), theme (`music-player-theme`), favorites (`music-player-favorites`), history (`music-player-history`), play counts (`music-player-play-counts`), recent searches (`free-music-recent-searches`), crossfade (`crossfade-duration`), volume (`music-player-volume`), muted (`music-player-muted`), playback speed (`music-player-playback-speed`). In-memory only: Free Music search state (query, tracks, page, etc.) in **FreeMusicStateService** when navigating between tabs.

---

## 6. Services and responsibilities

| Service | Role |
|---------|------|
| **PlayerService** | Now playing (track + streamUrl), playing state, queue. `play()`, `playQueue()`, `addToQueue()`, `togglePlayPause()`, `next()`, `previous()`, `setPlaying()`, `pause()`, `stop()`, `handleEnded()`, `toggleShuffle()`, `cycleLoopMode()`, `clearQueue()`, `removeFromQueue(index)`, `registerPlaybackTrigger()`. Crossfade duration persisted in `localStorage`. |
| **AudiusApiService** | Audius API: `searchTracks()`, `getTrackById()`, `getStreamEndpointUrl()`, `getStreamUrl()`, `getArtworkUrl()`. No auth; uses `app_name` param. Base URL from `environment.audiusApiUrl`. |
| **ThemeService** | Light/dark theme; persists to localStorage (`music-player-theme`); applies `.theme-light` / `.theme-dark` on `document.documentElement`. |
| **PlaylistService** | Playlists CRUD (localStorage under `music-player-playlists`); `addTrack`, `removeTrack`, `moveTrack`, `duplicate(playlistId)`; tags (addTag, removeTag); `getPlayableTracks(playlistId)`; `exportPlaylist`, `importPlaylist`. |
| **FavoritesService** | Favorite track IDs (localStorage under `music-player-favorites`). `isFavorite()`, `toggle()`, `add()`, `remove()`. |
| **HistoryService** | Last 50 played tracks with timestamps (localStorage under `music-player-history`). Per-track play counts (localStorage under `music-player-play-counts`). Auto-records on `nowPlaying` change. `clearHistory()`, `removeEntry(entry)`. Exposes `playCountMap` for stats. |
| **FreeMusicStateService** | In-memory signals: query, tracks, page, hasNextPage, brokenCoverIds. Restores Free Music state when returning from other tabs. |
| **PlaylistModalService** | `openPrompt(title, initialValue)`, `openConfirm(message, confirmLabel)`; promise-based. Drives `PlaylistModalComponent`. |

---

## 7. Main components

| Component | Role |
|-----------|------|
| **AppComponent** | Layout: nav (Free Music, Trending, Playlists, Favorites, History, Stats), theme toggle (top right), `<app-playlist-modal />`, router-outlet, `<app-player-bar />`. Global keyboard: Space, ArrowLeft, ArrowRight (disabled in inputs except range). |
| **FreeMusicComponent** | Search, recent searches (up to 5), searchTracks with pagination (PAGE_SIZE=24); state sync to FreeMusicStateService; results grid with custom sort dropdown; track click -> play/toggle; add-to-playlist dropdown; favorites toggle. |
| **TrendingComponent** | Top 50 trending tracks from Audius. Artist links, favorites toggle, add to queue. |
| **ArtistComponent** | Artist page (name, handle, tracks). Play all, favorites toggle, add to queue. Route param `:id`. |
| **PlaylistListComponent** | List playlists; sort by name or track count; New playlist (via modal), Play, Duplicate, Rename, Delete, Import; tag filter chips; navigate to detail. |
| **PlaylistDetailComponent** | Playlist tracks (resolved via `getTrackById` with `forkJoin`); Play, Remove track, Reorder (drag-and-drop, disabled when filtering), Filter input, Rename, Delete, Export, **Share** (copy URL), Back. |
| **FavoritesComponent** | Lists all favorited tracks (fetched from Audius). Filter input, play all, play single, add to queue, remove favorite. |
| **HistoryComponent** | Last 50 played tracks with timestamps. **Recent artists** chips (up to 10, clickable to artist page). Filter input, sort by date/title/artist; replay any entry, add to queue, remove single entry, clear history. |
| **StatsComponent** | Stats dashboard: total plays, unique tracks/artists, total listening time, top 5 tracks, top 5 artists. Computed from `HistoryService.historyList()` + `playCountMap()`. |
| **ImportComponent** | Reads `tracks` and `name` query params from URL, imports as playlist via `PlaylistService.importPlaylist()`, redirects to playlist detail or list. |
| **PlaylistModalComponent** | Renders prompt or confirm modal driven by `PlaylistModalService`. Enter=submit, Escape=cancel, backdrop click=cancel. |
| **PlayerBarComponent** | Audio element, cover/title/artist, shuffle/loop, prev/play-pause/next, **seek ±10 s** buttons, progress bar (seek), **volume and playback speed** (persisted), crossfade, queue panel (per-item **remove** and add-to-playlist). **Live region** for "Now playing" (screen readers). Manages audio listeners, suppression window, autoplay retry, crossfade. |

---

## 8. Data flow summary

```
Free Music:
  OnInit -> restore from FreeMusicStateService (query, tracks, page, hasNextPage, brokenCoverIds) if any
  User search -> addToRecentSearches(q) -> Audius API (search, 24, offset) -> Track list -> saveStateToService()
  Pagination: Next/Prev -> loadPage(n) -> searchTracks(q, 24, offset) -> saveStateToService()
  User click recent chip -> runRecentSearch(term) -> search again
  User click track -> playQueue(playables, index) or togglePlayPause if same track
  Sort: custom dropdown (default / duration asc/desc / artist name) -> computed sortedTracks
  Add to playlist: addTrack(playlistId, trackId) or create + addTrack + navigate
  Favorite: toggle heart icon -> FavoritesService.toggle(trackId)

Trending:
  OnInit -> AudiusApiService.getTrendingTracks(50) -> track list
  User click track -> playQueue or togglePlayPause

Artist:
  Route param :id -> getUserById + getUserTracks -> artist info + track list
  Play all -> playQueue(all tracks, 0)

Playlists:
  List: PlaylistService.playlistsList() -> filtered by tag, sorted (name or track count); create/rename/delete/duplicate (modal where needed); play -> getPlayableTracks(id) -> playQueue; import JSON file
  Detail: getPlaylist(id), forkJoin(getTrackById for each trackId) -> play / removeTrack / drag-drop reorder (disabled when filter active) / filter input / rename / delete / export JSON / share (copy URL)

Favorites:
  OnInit -> FavoritesService.favoriteIds() -> forkJoin(getTrackById for each id) -> track list
  Filter input -> filteredTracks computed (by title or artist name)
  Play all (unfiltered) / play single / add to queue / remove favorite (updates list immediately)

History:
  HistoryService effect: watches nowPlaying() -> auto-adds entry (dedupes, max 50, persists to localStorage) + increments play count
  History page: recent artists chips (up to 10, from history entries with artistId); filter input; sort by date/title/artist (sortedHistory computed); click entry -> player.play(track); add to queue; remove entry -> removeEntry(entry); clear -> historyService.clearHistory() (also clears play counts)

Stats:
  StatsComponent: all data computed from historyService.historyList() + playCountMap()
  Cards: totalPlays (sum of all counts), uniqueTracks (historyList.length), uniqueArtists (Set of artist names), totalListeningTime (sum of duration * count)
  Top 5 tracks: sorted by play count desc; top 5 artists: aggregated play counts by artist

Import:
  /import?tracks=id1,id2&name=... -> ImportComponent reads query params -> playlistService.importPlaylist(JSON) -> redirect to /playlists/:id or /playlists

Player bar:
  nowPlaying + isPlaying (signals) -> playbackTrigger + effect -> audio.src, audio.play()/pause()
  audio events -> currentTime, duration, setPlaying, handleEnded() on ended
  User seek / play/pause/prev/next -> PlayerService -> effect runs again
  Shuffle: next/previous pick random track from queue
  Loop: off (stop at end) / all (wrap) / one (repeat current)
  Crossfade: checkCrossfade() on timeupdate -> gradual volume fade -> handleEnded() at end
  Volume: slider 0-1 -> audio.volume
  Queue panel: remove-from-queue per item (removeFromQueue(index)), add-to-playlist per item (PlaylistService.addTrack or create new via modal)
  Clear queue: pause audio, clearCrossfade, clearQueue, stop
  Volume/playback speed: read from localStorage on init (music-player-volume, music-player-playback-speed); saved on change
  Media Session: when supported, PlayerBar wires navigator.mediaSession (handlers + MediaMetadata) so OS-level media keys and overlays control play/pause/next/previous and show track info
```

---

## 9. Theme and UI

- **ThemeService** reads theme from localStorage (`music-player-theme`) or `prefers-color-scheme`; applies class on `<html>`.
- **index.html** script runs before Angular: sets theme class immediately to avoid flash.
- CSS variables (e.g. `--bg-base`, `--text-primary`) are defined under `.theme-dark` and `.theme-light`; all components use these for colors.
- Toggle (top right): calls **ThemeService.toggle()** and persists choice.

---

## 10. Key models

```ts
// PlayableTrack (player.service.ts)
interface PlayableTrack {
  id: string; title: string; artist?: string; artistId?: string; album?: string;
  duration: number; coverArtUrl?: string; streamUrl?: string;
}

// NowPlaying (player.service.ts)
interface NowPlaying { track: PlayableTrack; streamUrl: string; }

// LoopMode (player.service.ts)
type LoopMode = 'off' | 'all' | 'one';

// AudiusTrack (models/audius.models.ts)
interface AudiusTrack {
  id: string; title: string; duration: number;
  artwork?: AudiusArtwork; user?: AudiusUser;
  genre?: string; mood?: string; play_count?: number; is_streamable?: boolean;
}

// Playlist (models/playlist.model.ts)
interface Playlist { id: string; name: string; trackIds: string[]; tags?: string[]; }
```
