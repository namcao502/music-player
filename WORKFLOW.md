# Music Player – Full Workflow

This document describes how the app works end-to-end: routes, user flow, and technical flow. The app is **Free Music only**: one page, no login, no library.

---

## 1. Application entry and routing

```
User opens app (e.g. http://localhost:4200)
    → index.html loads, theme script runs (sets .theme-light or .theme-dark from localStorage/preference)
    → Angular bootstraps app-root
    → Router loads; default route '' redirects to '/free-music'
    → Layout: theme toggle (top right) + main content (Free Music) + player bar
```

**Routes:**

| Path         | Screen      | When shown                          |
|-------------|------------|-------------------------------------|
| `''`        | Redirect   | Redirects to `/free-music`         |
| `/free-music` | Free Music | Search Audius, play; recent searches (up to 5) |
| `**`        | Redirect   | Redirects to `/free-music`         |

---

## 2. User workflow (Free Music)

1. User lands on **Free Music** (only page).
2. User types a search query (e.g. "bossa nova") and clicks **Search** (or Enter).
3. **FreeMusicComponent.onSearch()**:
   - Adds query to **recent searches** (max 5, deduped, persisted in `localStorage` under `free-music-recent-searches`).
   - Calls **AudiusApiService.searchTracks(query)** → `GET https://api.audius.co/v1/tracks/search?query=...&app_name=...`
4. Results (track cards with artwork, title, artist, duration) are shown.
5. **Recent searches**: Up to 5 chips below the search row; click a chip → **runRecentSearch(term)** sets query and runs search again.
6. User clicks a track card.
7. **FreeMusicComponent.play(track):**
   - Builds **PlayableTrack** list from current results; calls **PlayerService.playQueue(playables, index)** so the whole result set is the queue.
   - Stream URL: **AudiusApiService.getStreamEndpointUrl(track.id)** (no extra HTTP call).
8. **PlayerService** sets `current` and `playing`; **PlayerBarComponent** sets `audio.src`, loads, and plays.
9. Player bar: cover, title, artist, play/pause, prev/next, progress bar. User can pause/play, seek, or switch track; next/previous move through the search-result queue.

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
Player bar: timeupdate → currentTime; play → setPlaying(true); pause → setPlaying(false); ended → next()
```

- **Seek:** User drags progress bar → `onSeekChange(value)` → `audio.currentTime = value`.
- **Play/Pause button:** **PlayerService.togglePlayPause()** → effect runs → `audio.play()` or `audio.pause()`.
- **Previous/Next:** **PlayerService.previous() / next()** → may change `current` and `queue`; effect runs again with new track.

---

## 4. Services and responsibilities

| Service               | Role |
|-----------------------|------|
| **PlayerService**     | Now playing (track + streamUrl), playing state, queue, history. play(), playQueue(), togglePlayPause(), next(), previous(), setPlaying(). |
| **AudiusApiService**  | Audius: searchTracks(), getStreamEndpointUrl(id) for playback, getArtworkUrl(). No auth. |
| **ThemeService**      | Light/dark theme; persists to localStorage; applies .theme-light / .theme-dark on document. |

---

## 5. Main components

| Component      | Role |
|----------------|------|
| **AppComponent** | Layout: theme toggle (top right), router-outlet, player bar. |
| **FreeMusicComponent** | Search input, recent searches (up to 5 chips), searchTracks(); results grid; on track click → playQueue with getStreamEndpointUrl. |
| **PlayerBarComponent** | Shows when nowPlaying is set. Audio element, cover/title/artist, play/pause/prev/next, progress (current time, range input, total time). Syncs with audio (play, pause, timeupdate, ended, error). |

---

## 6. Data flow summary

```
Free Music:
  User search → addToRecentSearches(q) → Audius API (search) → Track list
  User click recent chip → runRecentSearch(term) → search again
  User click track → getStreamEndpointUrl(id) → PlayerService.playQueue(playables, index) → PlayerBar sets audio.src, play()

Player bar:
  nowPlaying + isPlaying (signals) → effect → audio.src, audio.play()/pause()
  audio events → update currentTime, duration, setPlaying(true/false), next() on ended
  User seek → audio.currentTime
  User play/pause/prev/next → PlayerService methods → effect runs again
```

---

## 7. Theme and UI

- **ThemeService** reads theme from localStorage or `prefers-color-scheme`; applies class on `<html>`.
- **index.html** script runs before Angular: sets theme class immediately to avoid flash.
- CSS variables (e.g. `--bg-base`, `--text-primary`) are defined under `.theme-dark` and `.theme-light`; all components use these for colors.
- Toggle (top right): calls **ThemeService.toggle()** and persists choice.

This is the full workflow of the player from entry point to playback and controls.
