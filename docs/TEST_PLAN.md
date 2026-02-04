# Music Player – Test Plan

This document defines the test plan and test cases per module for the Free Music app. Tests are unit tests using Jasmine and Karma.

**Process:** For each feature or bugfix request, update this plan (§3 test cases) and the corresponding `.spec.ts` files, then run the full test suite.

---

## 1. Modules under test

| Module | Type | Purpose |
|--------|------|---------|
| **ThemeService** | Service | Light/dark theme; localStorage; apply class on document. |
| **AudiusApiService** | Service | Search tracks, get stream URL, get artwork URL. |
| **PlayerService** | Service | Now playing, queue, play/playQueue/toggle/next/previous. |
| **AppComponent** | Component | Root layout: theme toggle (top right), outlet, player bar. Keyboard: Space = play/pause, Arrow Right = next, Arrow Left = previous (when not typing in an input). |
| **FreeMusicComponent** | Component | Search, recent searches (up to 5), results grid, play, add to playlist. |
| **PlayerBarComponent** | Component | Audio element, cover (click to play/pause), play/pause/prev/next, seek bar, queue panel. New track auto-plays (startPlayWhenReady + retry on next user gesture if blocked). Play/pause and seekbar stay in sync. |

---

## 2. Test plan summary

- **ThemeService**: Pure logic and DOM/localStorage; mock `localStorage` and `document.documentElement` where needed.
- **AudiusApiService**: HTTP calls; use `HttpClientTestingController` to assert requests and return fake data.
- **PlayerService**: No external deps; assert signals and method side effects. Next/Previous use queue order only (index-based, no history).
- **AppComponent**: Shallow test; ensure template renders, theme toggle (top right), and keyboard shortcuts (Space, ArrowLeft, ArrowRight) call player when nowPlaying is set; no action when focus is on input or when nothing is playing.
- **FreeMusicComponent**: Mock `AudiusApiService`, `PlayerService`, `PlaylistService`, `FreeMusicStateService`, `PlaylistModalService`, `Router`; test search (with pagination offset), recent searches, onTrackClick (same track → togglePlayPause, else play), pagination (next and prev), broken cover fallback, add-to-playlist (open/close, addTrackToPlaylist, createPlaylistAndAddTrack with modal + navigate), state restore from FreeMusicStateService, document click closes dropdown.
- **PlayerBarComponent**: Use real `PlayerService` where needed; test formatDuration, coverUrl, toggleQueue, playFromQueue, isCurrentTrack, onQueueCoverError. Play/pause icon and seekbar reflect player.isPlaying() and currentTime()/duration(); avoid heavy audio/effect testing.

---

## 3. Test cases by module

### 3.1 ThemeService

| ID | Description | Steps / Assertions |
|----|-------------|--------------------|
| T1 | Initial theme from localStorage | If `localStorage` has `music-player-theme` = 'light' or 'dark', initial theme matches. |
| T2 | Initial theme from prefers-color-scheme | If no stored theme, use `prefers-color-scheme: light` → 'light', else 'dark'. |
| T3 | setTheme(theme) updates signal and applies class | setTheme('light') → current() is 'light'; document has .theme-light. |
| T4 | toggle() switches dark ↔ light | If current is 'dark', toggle() → 'light'; if 'light', toggle() → 'dark'. |
| T5 | isDark / isLight computed | When theme is 'dark', isDark() is true; when 'light', isLight() is true. |

### 3.2 AudiusApiService

| ID | Description | Steps / Assertions |
|----|-------------|--------------------|
| A1 | searchTracks with empty query returns empty array | searchTracks('') or searchTracks('  ') → of([]), no HTTP request. |
| A2 | searchTracks sends GET with correct params | searchTracks('test', 24, 0) → GET .../tracks/search?query=test&limit=24&offset=0&app_name=... |
| A3 | searchTracks maps response.data to array | Mock response { data: [track1] } → observable emits [track1]. |
| A4 | searchTracks on error returns empty array | Mock HTTP error → observable emits []. |
| A5 | getStreamEndpointUrl returns URL with trackId and app_name | getStreamEndpointUrl('id1') contains /tracks/id1/stream and app_name. |
| A6 | getArtworkUrl returns size or fallback | Artwork with 480x480 → that URL; missing size → fallback 150x150 or ''. |

### 3.3 PlayerService

| ID | Description | Steps / Assertions |
|----|-------------|--------------------|
| P1 | play(track, streamUrl) sets nowPlaying and playing | play(track, url) → nowPlaying() has track and streamUrl, isPlaying() true. |
| P2 | play(track) without streamUrl does nothing when track has no streamUrl | When track has no streamUrl, play(track) does not set nowPlaying. |
| P3 | playQueue(songs, index) sets queue and plays song at index | playQueue([a,b,c], 1) → queueList() length 3, nowPlaying().track === b. |
| P4 | playQueue with empty array does nothing | playQueue([]) → no change to nowPlaying. |
| P5 | togglePlayPause flips isPlaying | After play(), togglePlayPause() → isPlaying() false; again → true. |
| P6 | setPlaying(value) updates isPlaying | setPlaying(false) → isPlaying() false. |
| P7 | next() advances to next in queue | Queue [a,b,c], now a → next() → nowPlaying().track === b. |
| P8 | next() at end of queue wraps to start | Queue [a,b,c], now c → next() → nowPlaying().track === a. |
| P9 | previous() goes to previous item in queue | Queue [a,b], now b → previous() → nowPlaying().track === a. |
| P9b | previous() from middle goes to previous index | Queue [a,b,c], now c → previous() → nowPlaying().track === b. |
| P10b | previous() at start of queue wraps to end | Queue [a,b,c], now a → previous() → nowPlaying().track === c. |
| P10 | registerPlaybackTrigger stores callback | registerPlaybackTrigger(fn); play(track, url) → fn called with (url, track.id). |

### 3.4 AppComponent

| ID | Description | Steps / Assertions |
|----|-------------|--------------------|
| R1 | Renders theme toggle in top right | Template contains .theme-toggle-top button. |
| R2 | Theme toggle calls theme.toggle() | Click theme toggle → theme.toggle() called (spy). |
| R3 | Router outlet present | Template contains router-outlet. |
| R4 | Keyboard Space toggles play/pause | When nowPlaying() is set, document keydown Space → player.togglePlayPause() called. |
| R5 | Keyboard ArrowRight calls next | When nowPlaying() is set, keydown ArrowRight → player.next() called. |
| R6 | Keyboard ArrowLeft calls previous | When nowPlaying() is set, keydown ArrowLeft → player.previous() called. |
| R7 | Keyboard ignored when nothing playing | When nowPlaying() is null, keydown Space → player.togglePlayPause() not called. |

### 3.5 FreeMusicComponent

| ID | Description | Steps / Assertions |
|----|-------------|--------------------|
| F1 | Initial state: empty query, no tracks, no error | query() '', tracks() [], error() ''. |
| F2 | onSearch with empty query does nothing | onSearch() with query '' → audius.searchTracks not called. |
| F3 | onSearch with query calls audius.searchTracks | set query 'test', onSearch() → searchTracks('test', 24, 0) called. |
| F4 | onSearch success sets tracks and clears loading | Mock searchTracks success → tracks() has data, loading() false. |
| F5 | onSearch error sets error message and clears loading | Mock searchTracks error → error() 'Search failed...', loading() false. |
| F6 | runRecentSearch(term) sets query and triggers search | runRecentSearch('jazz') → query() 'jazz', searchTracks called. |
| F7 | play(track) calls player.playQueue with playables and index | play(track) with tracks [a,b,c], track b → playQueue([...], 1) called. |
| F8 | formatDuration(seconds) returns M:SS | formatDuration(90) → '1:30'; formatDuration(5) → '0:05'. |
| F9 | ngOnInit loads recent searches from localStorage | localStorage has key free-music-recent-searches → recentSearches() populated (max 5). |
| F10 | onTrackClick: same track toggles play/pause | When nowPlaying.track.id === track.id, onTrackClick(track) → player.togglePlayPause(). |
| F11 | onTrackClick: different track calls play | When nowPlaying is other track, onTrackClick(track) → play(track) (playQueue). |
| F12 | Pagination: onSearch resets page to 1 | onSearch() → page() is 1, loadPage(1) with offset 0. |
| F13 | Pagination: goToNextPage loads next offset | After search, goToNextPage() → searchTracks(q, 24, 24). |
| F14 | onCoverError adds track id to brokenCoverIds | onCoverError('id1') → brokenCoverIds().has('id1') is true. |
| F15 | openAddToPlaylist toggles dropdown for track | openAddToPlaylist(id, e) toggles addToPlaylistTrackId; e.stopPropagation called. |
| F16 | addTrackToPlaylist calls service and closes dropdown | addTrackToPlaylist(playlistId, trackId) → playlistService.addTrack called; addToPlaylistTrackId set to null. |
| F17 | State restore from FreeMusicStateService on init | When state has query or tracks, ngOnInit restores query, tracks, page, hasNextPage, brokenCoverIds. |
| F18 | goToPrevPage decrements page and loads previous offset | After page 2, goToPrevPage() → page() 1, searchTracks(q, 24, 0) called. |
| F19 | createPlaylistAndAddTrack: modal submit creates playlist, adds track, navigates | When openPrompt resolves with name → create + addTrack called, navigate to /playlists/:id. |
| F19b | createPlaylistAndAddTrack: modal cancel does nothing | When openPrompt resolves with null → create, addTrack, navigate not called. |
| F20 | Document click closes add-to-playlist dropdown | onDocumentClick() (or document click) → addToPlaylistTrackId set to null. |

### 3.6 PlayerBarComponent

| ID | Description | Steps / Assertions |
|----|-------------|--------------------|
| B1 | formatDuration(seconds) returns M:SS | formatDuration(65) → '1:05'; formatDuration(0) → '0:00'. |
| B2 | formatDuration invalid returns 0:00 | formatDuration(NaN) or negative → '0:00'. |
| B3 | coverUrl with coverArtUrl returns it | coverUrl({ coverArtUrl: 'https://...' }) → 'https://...'. |
| B4 | coverUrl with no coverArtUrl returns empty string | coverUrl({}) → ''. |
| B5 | Component uses PlayerService | Constructor injects PlayerService; template shows nowPlaying when set. |
| B6 | toggleQueue toggles showQueue | toggleQueue() → showQueue flips; again → back. |
| B7 | playFromQueue: current track toggles play/pause | When track at index is nowPlaying, playFromQueue(index) → player.togglePlayPause(). |
| B8 | playFromQueue: other track plays that track | When track at index is not nowPlaying, playFromQueue(index) → player.play(track). |
| B9 | isCurrentTrack returns true/false | isCurrentTrack(nowPlaying.track.id) true; isCurrentTrack('other') false. |
| B10 | onQueueCoverError adds track id to queueCoverErrors | onQueueCoverError('id1') → queueCoverErrors().has('id1') is true. |

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

Tests are implemented in `src/app/**/*.spec.ts` (services under `services/`, components under `components/free-music/` and `components/player-bar/`). Each module has a corresponding `.spec.ts` file next to its source.

**Verified:** Run after any change. See §3 for full test case list. Free Music plan: `docs/FREE_MUSIC_PLAN.md`.
