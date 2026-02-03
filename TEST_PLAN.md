# Music Player – Test Plan

This document defines the test plan and test cases per module for the Free Music app. Tests are unit tests using Jasmine and Karma.

---

## 1. Modules under test

| Module | Type | Purpose |
|--------|------|---------|
| **ThemeService** | Service | Light/dark theme; localStorage; apply class on document. |
| **AudiusApiService** | Service | Search tracks, get stream URL, get artwork URL. |
| **PlayerService** | Service | Now playing, queue, play/playQueue/toggle/next/previous. |
| **AppComponent** | Component | Root layout: theme toggle (top right), outlet, player bar. |
| **FreeMusicComponent** | Component | Search, recent searches (up to 5), results grid, play. |
| **PlayerBarComponent** | Component | Audio element, cover/title/artist, play/pause/prev/next, seek. |

---

## 2. Test plan summary

- **ThemeService**: Pure logic and DOM/localStorage; mock `localStorage` and `document.documentElement` where needed.
- **AudiusApiService**: HTTP calls; use `HttpClientTestingController` to assert requests and return fake data.
- **PlayerService**: No external deps; assert signals and method side effects.
- **AppComponent**: Shallow test; ensure template renders and theme toggle (top right) is present.
- **FreeMusicComponent**: Mock `AudiusApiService` and `PlayerService`; test search, recent searches, play, formatDuration.
- **PlayerBarComponent**: Mock `PlayerService`; test formatDuration, coverUrl; avoid heavy audio/effect testing.

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
| A2 | searchTracks sends GET with correct params | searchTracks('test', 24) → GET .../tracks/search?query=test&limit=24&app_name=... |
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
| P8 | next() at end of queue does nothing | Queue [a], now a → next() → still a. |
| P9 | previous() goes back from history | After next() from a to b, previous() → nowPlaying().track === a. |
| P10 | registerPlaybackTrigger stores callback | registerPlaybackTrigger(fn); play(track, url) → fn called with (url, track.id). |

### 3.4 AppComponent

| ID | Description | Steps / Assertions |
|----|-------------|--------------------|
| R1 | Renders theme toggle in top right | Template contains .theme-toggle-top button. |
| R2 | Theme toggle calls theme.toggle() | Click theme toggle → theme.toggle() called (spy). |
| R3 | Router outlet present | Template contains router-outlet. |

### 3.5 FreeMusicComponent

| ID | Description | Steps / Assertions |
|----|-------------|--------------------|
| F1 | Initial state: empty query, no tracks, no error | query() '', tracks() [], error() ''. |
| F2 | onSearch with empty query does nothing | onSearch() with query '' → audius.searchTracks not called. |
| F3 | onSearch with query calls audius.searchTracks | set query 'test', onSearch() → searchTracks('test', 24) called. |
| F4 | onSearch success sets tracks and clears loading | Mock searchTracks success → tracks() has data, loading() false. |
| F5 | onSearch error sets error message and clears loading | Mock searchTracks error → error() 'Search failed...', loading() false. |
| F6 | runRecentSearch(term) sets query and triggers search | runRecentSearch('jazz') → query() 'jazz', searchTracks called. |
| F7 | play(track) calls player.playQueue with playables and index | play(track) with tracks [a,b,c], track b → playQueue([...], 1) called. |
| F8 | formatDuration(seconds) returns M:SS | formatDuration(90) → '1:30'; formatDuration(5) → '0:05'. |
| F9 | ngOnInit loads recent searches from localStorage | localStorage has key free-music-recent-searches → recentSearches() populated (max 5). |

### 3.6 PlayerBarComponent

| ID | Description | Steps / Assertions |
|----|-------------|--------------------|
| B1 | formatDuration(seconds) returns M:SS | formatDuration(65) → '1:05'; formatDuration(0) → '0:00'. |
| B2 | formatDuration invalid returns 0:00 | formatDuration(NaN) or negative → '0:00'. |
| B3 | coverUrl with coverArtUrl returns it | coverUrl({ coverArtUrl: 'https://...' }) → 'https://...'. |
| B4 | coverUrl with no coverArtUrl returns empty string | coverUrl({}) → ''. |
| B5 | Component uses PlayerService | Constructor injects PlayerService; template shows nowPlaying when set. |

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

Tests are implemented in `src/app/**/*.spec.ts`. Each module has a corresponding `.spec.ts` file next to its source.

**Verified:** 45 tests passing (ThemeService 5, AudiusApiService 7, PlayerService 10, AppComponent 4, FreeMusicComponent 10, PlayerBarComponent 5).
