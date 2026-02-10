# Music Player – Test Plan

This document defines the test plan and test cases per module for the Music Player app. Tests are unit tests using Jasmine and Karma (Angular CLI).

**Process:** For each feature or bugfix, update this plan and the corresponding `.spec.ts` files, then run the full test suite.

---

## 1. Modules under test

| Module | Type | Spec file | Status |
|--------|------|-----------|--------|
| **ThemeService** | Service | `services/theme.service.spec.ts` | Tested (T1–T5) |
| **AudiusApiService** | Service | `services/audius-api.service.spec.ts` | Tested (A1–A6) |
| **PlayerService** | Service | `services/player.service.spec.ts` | Tested (P1–P12) |
| **AppComponent** | Component | `app.component.spec.ts` | Tested (R1–R7) |
| **FreeMusicComponent** | Component | `components/free-music/free-music.component.spec.ts` | Tested (F1–F20) |
| **PlayerBarComponent** | Component | `components/player-bar/player-bar.component.spec.ts` | Tested (B1–B10) |
| **PlaylistService** | Service | `services/playlist.service.spec.ts` | Tested (PL1–PL13) |
| **PlaylistListComponent** | Component | `components/playlist-list/playlist-list.component.spec.ts` | Tested (LL1–LL9) |
| **PlaylistDetailComponent** | Component | `components/playlist-detail/playlist-detail.component.spec.ts` | Tested (PD1–PD9) |
| **PlaylistModalService** | Service | `services/playlist-modal.service.spec.ts` | Tested (PM1–PM5) |
| **PlaylistModalComponent** | Component | `components/playlist-modal/playlist-modal.component.spec.ts` | Tested (MC1–MC5) |
| **FreeMusicStateService** | Service | — | Not tested (trivial signal holder) |

---

## 2. Test plan summary

- **ThemeService**: Pure logic and DOM/localStorage; mock `localStorage` and `window.matchMedia`.
- **AudiusApiService**: HTTP calls; use `HttpClientTestingModule` / `HttpTestingController`.
- **PlayerService**: No external deps; assert signals and method side effects. Includes shuffle, loop mode, and `handleEnded()`.
- **AppComponent**: Shallow test; ensure template renders, theme toggle, and keyboard shortcuts (Space, ArrowLeft, ArrowRight) call player when `nowPlaying` is set. Also tests that media keys work when a range input (seekbar) is focused.
- **FreeMusicComponent**: Mock all dependencies; test search (with pagination offset), recent searches, `onTrackClick` (same vs. different track), pagination (next/prev), broken cover fallback, add-to-playlist (open/close, addTrackToPlaylist, createPlaylistAndAddTrack with modal + navigate), state restore from `FreeMusicStateService`, document click closes dropdown.
- **PlayerBarComponent**: Use real `PlayerService`; test `formatDuration`, `coverUrl`, `toggleQueue`, `playFromQueue`, `isCurrentTrack`, `onQueueCoverError`. Avoid heavy audio/effect testing.
- **PlaylistService**: Mock localStorage and `AudiusApiService`; test CRUD (create, rename, delete, addTrack, removeTrack), `getPlayableTracks()`, persistence.
- **PlaylistListComponent**: Mock service, player, router, modal; test create, play, rename, delete, open.
- **PlaylistDetailComponent**: Mock services; test init (missing id redirects), loadTracks, play, removeTrack, rename, delete, back.
- **PlaylistModalService**: Test openPrompt/closePrompt, openConfirm/closeConfirm, opening one clears the other.
- **PlaylistModalComponent**: Mock service; test prompt submit/cancel, confirm yes/no, backdrop click.

---

## 3. Test cases by module

### 3.1 ThemeService

| ID | Description | Assertions |
|----|-------------|------------|
| T1 | Initial theme from localStorage | `localStorage` has `music-player-theme` = 'light' -> `current()` is 'light'. |
| T2 | Initial theme from `prefers-color-scheme` | No stored theme, `matchMedia('(prefers-color-scheme: light)')` matches -> 'light'. |
| T3 | `setTheme(theme)` updates signal and persists | `setTheme('light')` -> `current()` is 'light'; localStorage has 'light'. |
| T4 | `toggle()` switches dark <-> light | 'dark' -> toggle() -> 'light'; again -> 'dark'. |
| T5 | `isDark` / `isLight` computed | 'dark' -> `isDark()` true, `isLight()` false; 'light' -> reversed. |

### 3.2 AudiusApiService

| ID | Description | Assertions |
|----|-------------|------------|
| A1 | `searchTracks('')` returns `[]`, no HTTP | Observable emits `[]`; no request made. |
| A1b | `searchTracks('   ')` returns `[]` | Whitespace-only also returns empty. |
| A2 | `searchTracks('test', 24)` sends correct GET | URL contains `/v1/tracks/search`; params: `query=test`, `limit=24`, `app_name`. |
| A3 | `searchTracks` maps `response.data` to array | `{ data: [track1] }` -> emits `[track1]`. |
| A4 | `searchTracks` on HTTP error returns `[]` | Error -> emits `[]`. |
| A5 | `getStreamEndpointUrl('id1')` returns URL | Contains `/v1/tracks/id1/stream` and `app_name`. |
| A6 | `getArtworkUrl` returns size or fallback | `480x480` present -> returns it; empty artwork -> returns `''`. |

### 3.3 PlayerService

| ID | Description | Assertions |
|----|-------------|------------|
| P1 | `play(track, streamUrl)` sets nowPlaying and playing | `nowPlaying()` has track and streamUrl; `isPlaying()` true. |
| P2 | `play(track)` without any streamUrl does nothing | `nowPlaying()` remains null. |
| P3 | `playQueue(songs, index)` sets queue and plays at index | `queueList().length` is 3; `nowPlaying().track` is songs[1]. |
| P4 | `playQueue([])` does nothing | Previous `nowPlaying` unchanged. |
| P5 | `togglePlayPause()` flips `isPlaying` | true -> false -> true. |
| P6 | `setPlaying(false)` updates `isPlaying` | `isPlaying()` becomes false. |
| P7 | `next()` advances to next in queue | a -> `next()` -> b -> `next()` -> c. |
| P8 | `next()` at end of queue stops when `loop='off'` | Now c, `next()` -> stays c, `isPlaying()` false. |
| P8b | `next()` at end wraps when `loop='all'` | Now c, loop all, `next()` -> a. |
| P8c | `handleEnded()` repeats current when `loop='one'` | Now b, loop one, `handleEnded()` -> still b, `isPlaying()` true. |
| P9 | `previous()` goes to previous in queue | b -> `previous()` -> a. |
| P9b | `previous()` from last goes to previous index | c -> `previous()` -> b. |
| P10b | `previous()` at start wraps to end | a -> `previous()` -> c. |
| P11 | `toggleShuffle()` flips `shuffleEnabled` | false -> true. |
| P12 | `cycleLoopMode()` cycles off -> all -> one -> off | Asserts all 4 transitions. |
| P10 | `registerPlaybackTrigger` callback called on play | `play(track, url)` -> trigger called with `(url, track.id)`. |

### 3.4 AppComponent

| ID | Description | Assertions |
|----|-------------|------------|
| R1 | Renders theme toggle in top right | `.theme-toggle-top` element exists. |
| R2 | Theme toggle calls `theme.toggle()` | Click button -> spy called. |
| R3 | Router outlet present | `router-outlet` element exists. |
| R4 | Keyboard Space toggles play/pause | `nowPlaying` set, keydown Space -> `togglePlayPause()` called. |
| R5 | Keyboard ArrowRight calls next | `nowPlaying` set, keydown ArrowRight -> `next()` called. |
| R6 | Keyboard ArrowLeft calls previous | `nowPlaying` set, keydown ArrowLeft -> `previous()` called. |
| R6b | Keyboard ArrowRight works on focused range input | Range input focused, keydown ArrowRight -> `next()` still called. |
| R7 | Keyboard ignored when nothing playing | `nowPlaying` null, keydown Space -> `togglePlayPause()` not called. |

### 3.5 FreeMusicComponent

| ID | Description | Assertions |
|----|-------------|------------|
| F1 | Initial state: empty query, no tracks, no error | `query()` `''`, `tracks()` `[]`, `error()` `''`. |
| F2 | `onSearch()` with empty query does nothing | `searchTracks` not called. |
| F3 | `onSearch()` with query calls `searchTracks` | `searchTracks('test', 24, 0)` called. |
| F4 | `onSearch()` success sets tracks, clears loading | `tracks()` has data, `loading()` false. |
| F5 | `onSearch()` error sets error message, clears loading | `error()` contains 'Search failed', `loading()` false. |
| F6 | `runRecentSearch(term)` sets query and triggers search | `query()` is 'jazz', `searchTracks('jazz', 24, 0)` called. |
| F7 | `play(track)` calls `player.playQueue` with playables and index | `playQueue` called with correct playable list and index. |
| F8 | `formatDuration(seconds)` returns M:SS | `90` -> `'1:30'`; `5` -> `'0:05'`. |
| F9 | `ngOnInit` loads recent searches from localStorage | Stored `['a','b']` -> `recentSearches()` is `['a','b']`. |
| F10 | `onTrackClick`: same track toggles play/pause | `togglePlayPause()` called; `playQueue` not called. |
| F11 | `onTrackClick`: different track calls play | `playQueue` called. |
| F12 | `onSearch()` resets page to 1 | `page()` is 1; offset 0. |
| F13 | `goToNextPage()` loads next offset | Page 2; `searchTracks('test', 24, 24)` called. |
| F14 | `onCoverError('id1')` adds to brokenCoverIds | `brokenCoverIds().has('id1')` is true. |
| F15 | `openAddToPlaylist` toggles dropdown | Opens for track id; toggles back to null. `stopPropagation` called. |
| F16 | `addTrackToPlaylist` calls service, closes dropdown | `addTrack` called; `addToPlaylistTrackId()` null. |
| F17 | State restore from `FreeMusicStateService` on init | Saved query/tracks/page/hasNextPage/brokenCoverIds all restored. |
| F18 | `goToPrevPage()` decrements page, loads previous offset | Page 1; `searchTracks('test', 24, 0)` called. |
| F19 | `createPlaylistAndAddTrack`: modal submit | `create` + `addTrack` called; navigates to `/playlists/:id`; dropdown closed. |
| F19b | `createPlaylistAndAddTrack`: modal cancel | `create`, `addTrack`, `navigate` not called. |
| F20 | `onDocumentClick()` closes dropdown | `addToPlaylistTrackId()` set to null. |

### 3.6 PlayerBarComponent

| ID | Description | Assertions |
|----|-------------|------------|
| B1 | `formatDuration(65)` returns `'1:05'` | Also `formatDuration(0)` -> `'0:00'`. |
| B2 | `formatDuration(NaN)` or negative returns `'0:00'` | Invalid inputs handled. |
| B3 | `coverUrl` with `coverArtUrl` returns it | `{ coverArtUrl: 'https://...' }` -> `'https://...'`. |
| B4 | `coverUrl` with no `coverArtUrl` returns `''` | `{}` -> `''`. |
| B5 | Component uses `PlayerService` | `player` property is truthy. |
| B6 | `toggleQueue()` toggles `showQueue` | false -> true -> false. |
| B7 | `playFromQueue`: current track toggles play/pause | `togglePlayPause()` called. |
| B8 | `playFromQueue`: other track plays that track | `play(trackB)` called. |
| B9 | `isCurrentTrack` returns true/false | Current track id -> true; other -> false. |
| B10 | `onQueueCoverError('id1')` adds to set | `queueCoverErrors().has('id1')` true. |

### 3.7 PlaylistService 
| ID | Description | Assertions |
|----|-------------|------------|
| PL1 | `loadFromStorage` loads from localStorage | Stored JSON array -> `playlistsList()` populated. |
| PL2 | `loadFromStorage` handles invalid/missing data | Null or invalid JSON -> `playlistsList()` is `[]`. |
| PL3 | `create(name)` adds playlist and saves | New playlist in list; `localStorage.setItem` called. |
| PL4 | `create('')` falls back to `'Playlist'` | Name is `'Playlist'`. |
| PL5 | `rename(id, name)` updates name | Playlist name changed; saved. |
| PL6 | `rename` with empty name keeps old name | Name unchanged. |
| PL7 | `delete(id)` removes playlist | Playlist filtered out; saved. |
| PL8 | `addTrack` appends trackId if not present | trackId in `trackIds`; saved. |
| PL9 | `addTrack` does not duplicate | Same trackId -> no duplicate. |
| PL10 | `removeTrack` removes trackId | trackId no longer in `trackIds`; saved. |
| PL11 | `getPlaylist(id)` returns correct playlist | Found -> playlist; not found -> undefined. |
| PL12 | `getPlayableTracks` resolves via API | `forkJoin` of `getTrackById` -> `PlayableTrack[]`. Null tracks skipped. |
| PL13 | `getPlayableTracks` for empty playlist returns `[]` | No API calls made. |

### 3.8 PlaylistListComponent 
| ID | Description | Assertions |
|----|-------------|------------|
| LL1 | Renders playlist list from service | `playlistsList()` items shown. |
| LL2 | `createPlaylist` opens prompt, creates, navigates | modal called; `create` called; `navigate` called. |
| LL3 | `createPlaylist` cancelled does nothing | `create` not called. |
| LL4 | `play(id)` resolves tracks and calls `playQueue` | `getPlayableTracks` subscribed; `playQueue` called. |
| LL5 | `play(id)` with empty tracks does nothing | `playQueue` not called. |
| LL6 | `rename` opens prompt, calls service | `rename` called with new name. |
| LL7 | `delete` opens confirm, calls service | `delete` called after confirmation. |
| LL8 | `delete` cancelled does nothing | `delete` not called. |
| LL9 | `open(id)` navigates to detail | `navigate(['/playlists', id])`. |

### 3.9 PlaylistDetailComponent 
| ID | Description | Assertions |
|----|-------------|------------|
| PD1 | Init with valid id loads playlist and tracks | `playlist()` set; `getTrackById` called for each trackId. |
| PD2 | Init with missing id redirects to `/playlists` | `navigate` called. |
| PD3 | Init with unknown playlist id redirects | `navigate` called. |
| PD4 | `play()` resolves and plays queue | `getPlayableTracks` -> `playQueue`. |
| PD5 | `removeTrack` removes and updates local state | `removeTrack` called; `tracks()` updated. |
| PD6 | `rename` opens prompt, updates service and local signal | `rename` called; `playlist().name` updated. |
| PD7 | `deletePlaylist` confirms, deletes, navigates | `delete` called; `navigate` to `/playlists`. |
| PD8 | `deletePlaylist` cancelled does nothing | `delete` not called. |
| PD9 | `back()` navigates to `/playlists` | `navigate` called. |

### 3.10 PlaylistModalService 
| ID | Description | Assertions |
|----|-------------|------------|
| PM1 | `openPrompt` sets `promptConfig`, resolves on `closePrompt` | Config signal set; promise resolves with value. |
| PM2 | `openPrompt` clears `confirmConfig` | `confirmConfig()` is null. |
| PM3 | `closePrompt(null)` resolves with null | Promise resolves null. |
| PM4 | `openConfirm` sets `confirmConfig`, resolves on `closeConfirm` | Config signal set; promise resolves with boolean. |
| PM5 | `openConfirm` clears `promptConfig` | `promptConfig()` is null. |

### 3.11 PlaylistModalComponent 
| ID | Description | Assertions |
|----|-------------|------------|
| MC1 | Prompt submit calls `closePrompt` with trimmed value | `closePrompt` called. |
| MC2 | Prompt cancel calls `closePrompt(null)` | `closePrompt(null)` called. |
| MC3 | Confirm yes calls `closeConfirm(true)` | `closeConfirm(true)` called. |
| MC4 | Confirm no calls `closeConfirm(false)` | `closeConfirm(false)` called. |
| MC5 | Backdrop click cancels active modal | Prompt: `closePrompt(null)`; Confirm: `closeConfirm(false)`. |

---

## 4. Verification

Run all tests:

```bash
cd music-player
npm test
```

For a single run (no watch) with headless Chrome:

```bash
npx ng test --no-watch --browsers=ChromeHeadless
```

**Current status:** 127 tests, all passing. All modules are tested except `FreeMusicStateService` (trivial signal holder).
