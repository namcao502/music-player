# Music Player – Full Workflow

This document describes how the app works end-to-end: routes, user flow, and technical flow. The app has two main areas: **Free Music** (search and stream from Audius) and **Playlists** (saved track lists in `localStorage`). No login, no backend.

**Docs:** Feature plans: `docs/FREE_MUSIC_PLAN.md`, `docs/PLAYLIST_PLAN.md`. Tests: `docs/TEST_PLAN.md`.

---

## 1. Application entry and routing

```
User opens app (e.g. http://localhost:4200)
    → index.html loads, theme script runs (sets .theme-light or .theme-dark from localStorage/preference)
    → Angular bootstraps app-root
    → Router loads; default route '' redirects to '/free-music'
    → Layout: nav (Free Music | Playlists) + theme toggle (top right) + main content (router-outlet) + player bar
```

**Routes:**

| Path             | Screen           | When shown |
|------------------|------------------|------------|
| `''`             | Redirect         | Redirects to `/free-music` |
| `/free-music`    | Free Music       | Search Audius, play, add to playlist; recent searches (up to 5); pagination; state restored when returning from Playlists |
| `/playlists`     | Playlist list    | List playlists; New playlist, Play, Rename, Delete; open a playlist |
| `/playlists/:id` | Playlist detail  | Tracks in playlist; Play, Remove track, Rename, Delete playlist |
| `**`             | Redirect         | Redirects to `/free-music` |

---

## 2. User workflow (Free Music)

1. User lands on **Free Music** (default) or returns from Playlists; last search state (query, results, page, broken covers) is restored from **FreeMusicStateService**.
2. User types a search query (e.g. "bossa nova") and clicks **Search** (or Enter).
3. **FreeMusicComponent.onSearch()**:
   - Adds query to **recent searches** (max 5, deduped, persisted in `localStorage` under `free-music-recent-searches`).
   - Resets page to 1; calls **AudiusApiService.searchTracks(query, 24, offset)**.
   - On success: sets tracks, hasNextPage; syncs state to **FreeMusicStateService**.
4. Results (track cards with artwork, title, artist, duration) are shown. **Pagination:** Previous / Next (page 1-based; Next enabled when last response had 24 items).
5. **Recent searches**: Up to 5 chips; click a chip → **runRecentSearch(term)** sets query and runs search again.
6. **Add to playlist:** Per track, "+" opens a dropdown (existing playlists + "Create new playlist"). Choosing a playlist → **PlaylistService.addTrack(playlistId, track.id)**. Create new → **PlaylistModalService.openPrompt** for name → create playlist, add track, navigate to `/playlists/:id`.
7. User clicks a track card.
8. **FreeMusicComponent.play(track)** (or **onTrackClick**: same track → **togglePlayPause**):
   - Builds **PlayableTrack** list from current results; calls **PlayerService.playQueue(playables, index)** so the whole result set is the queue.
   - Stream URL: **AudiusApiService.getStreamEndpointUrl(track.id)**.
9. **PlayerService** sets nowPlaying and playing; **PlayerBarComponent** sets `audio.src`, loads, and plays. Player bar: cover, title, artist, **shuffle**, **loop**, play/pause, prev/next, progress bar, queue panel (with add-to-playlist per item).

   - **Shuffle**: When enabled, Next/Previous pick a random track from the queue (different from the current one when possible).
   - **Loop**: Cycles through modes: Off → Loop all → Loop one.
     - Off: playback stops at the end of the queue
     - Loop all: wraps from end → start
     - Loop one: repeats the current track

---

## 3. Playback flow (technical)

```
[User clicks play on a track]
        │
        ▼
Free Music:
  → getStreamEndpointUrl(id) (Audius API URL)
  → PlayerService.playQueue(playables, index) with playable + streamUrl
        │
        ▼
PlayerService: current = { track, streamUrl }, playing = true
        │
        ▼
PlayerBarComponent (effect):
  - loadedTrackId !== track.id → set audio.src = streamUrl, load(), duration from track
  - attachAudioListenersOnce(audio)
  - if (playing) audio.play().catch(() => setPlaying(false))  // e.g. autoplay blocked
  - else audio.pause()
        │
        ▼
Browser: audio element loads URL (Audius 302 → CDN), fires play/pause/timeupdate/ended
        │
        ▼
Player bar: timeupdate → currentTime; play → setPlaying(true); pause → setPlaying(false); ended → PlayerService handles next based on loop/shuffle
```

- **Seek:** User drags progress bar → `onSeekChange(value)` → `audio.currentTime = value`.
- **Play/Pause button:** **PlayerService.togglePlayPause()** → effect runs → `audio.play()` or `audio.pause()`.
- **Previous/Next:** **PlayerService.previous() / next()** → may change nowPlaying and queue; effect runs again with new track.

---

## 4. User workflow (Playlists)

1. User clicks **Playlists** in the nav → **PlaylistListComponent**; lists playlists from **PlaylistService** (localStorage).
2. **New playlist:** Prompt for name (via **PlaylistModalService.openPrompt**) → **PlaylistService.create(name)** → navigate to `/playlists/:id` or stay on list.
3. **Play:** Resolve track IDs to **PlayableTrack[]** via **AudiusApiService.getTrackById**; **PlayerService.playQueue(playables, 0)**.
4. **Open playlist:** Navigate to `/playlists/:id` → **PlaylistDetailComponent**; shows tracks (titles from Audius), Play, Remove track, Rename playlist, Delete playlist.
5. **Add track from Free Music:** On Free Music (or queue in player bar), "+" → choose playlist or "Create new playlist" → **addTrack(playlistId, trackId)**.

---

## 5. Services and responsibilities

| Service                   | Role |
|---------------------------|------|
| **PlayerService**         | Now playing (track + streamUrl), playing state, queue. play(), playQueue(), togglePlayPause(), next(), previous(), setPlaying(), shuffle + loop. |
| **AudiusApiService**      | Audius: searchTracks(), getTrackById(), getStreamEndpointUrl(id), getArtworkUrl(). No auth. |
| **ThemeService**          | Light/dark theme; persists to localStorage; applies .theme-light / .theme-dark on document. |
| **PlaylistService**       | Playlists CRUD (localStorage); addTrack, removeTrack; getPlayableTracks(playlistId) for playback. |
| **FreeMusicStateService** | In-memory: query, tracks, page, hasNextPage, brokenCoverIds; restores Free Music when returning from Playlists. |
| **PlaylistModalService**  | openPrompt(title, initialValue), openConfirm(message); used for new playlist name, rename, delete confirm. |

---

## 6. Main components

| Component               | Role |
|-------------------------|------|
| **AppComponent**        | Layout: nav (Free Music, Playlists), theme toggle (top right), router-outlet, player bar. Global keyboard: Space, Left/Right when not in input. |
| **FreeMusicComponent**  | Search, recent searches (up to 5), searchTracks with pagination; state sync to FreeMusicStateService; results grid; track click → play/toggle; add-to-playlist dropdown (and create new). |
| **PlaylistListComponent**  | List playlists; New playlist, Play, Rename, Delete; navigate to detail. |
| **PlaylistDetailComponent** | Playlist tracks (resolved via getTrackById); Play, Remove, Rename playlist, Delete playlist. |
| **PlaylistModalComponent**  | Renders prompt or confirm modal driven by PlaylistModalService. |
| **PlayerBarComponent**   | When nowPlaying is set: audio element, cover/title/artist, play/pause/prev/next, progress, queue panel (with add-to-playlist per item). Syncs with audio events. |

---

## 7. Data flow summary

```
Free Music:
  OnInit → restore from FreeMusicStateService (query, tracks, page, hasNextPage, brokenCoverIds) if any
  User search → addToRecentSearches(q) → Audius API (search, 24, offset) → Track list → saveStateToService()
  Pagination: Next/Prev → loadPage(n) → searchTracks(q, 24, offset) → saveStateToService()
  User click recent chip → runRecentSearch(term) → search again
  User click track → playQueue(playables, index) or togglePlayPause if same track
  Add to playlist: addTrack(playlistId, trackId) or create + addTrack + navigate

Playlists:
  List: PlaylistService.playlistsList() → create/rename/delete; play → getPlayableTracks(id) → playQueue
  Detail: getPlaylist(id), resolve trackIds via getTrackById → play / removeTrack / rename / delete

Player bar:
  nowPlaying + isPlaying (signals) → effect → audio.src, audio.play()/pause()
  audio events → currentTime, duration, setPlaying, next() on ended
  User seek / play/pause/prev/next → PlayerService → effect runs again
  Queue: add-to-playlist per item (PlaylistService.addTrack or create new)
```

---

## 8. Theme and UI

- **ThemeService** reads theme from localStorage or `prefers-color-scheme`; applies class on `<html>`.
- **index.html** script runs before Angular: sets theme class immediately to avoid flash.
- CSS variables (e.g. `--bg-base`, `--text-primary`) are defined under `.theme-dark` and `.theme-light`; all components use these for colors.
- Toggle (top right): calls **ThemeService.toggle()** and persists choice.

This is the full workflow from entry to Free Music, Playlists, and playback.
