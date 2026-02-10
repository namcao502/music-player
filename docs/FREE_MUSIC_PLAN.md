# Free Music Module – Design

The **Free Music** screen lets users search and stream royalty-free tracks from [Audius](https://audius.org/) with no login and no backend. Search results become the playback queue; tracks can be added to local playlists.

---

## 1. Overview

- **Entry:** Default route `/free-music` (redirected from `/`). Nav tab "Free Music".
- **Data source:** Audius API (`environment.audiusApiUrl`, currently `https://api.audius.co`). App name: `angular-music-player`. No auth required.
- **State:** In-memory search state (query, tracks, page, hasNextPage, brokenCoverIds) is kept in `FreeMusicStateService` so it persists when switching to Playlists and back. Recent search terms (up to 5) are stored in `localStorage` under `free-music-recent-searches`.

---

## 2. Data flow

### 2.1 Search

- User enters a query and clicks **Search** or presses Enter.
- Empty/whitespace query: no API call (`onSearch()` returns early).
- Non-empty: trim query, add to recent searches (dedupe case-insensitively, persist to localStorage, max 5), clear error and broken cover set, reset page to 1, call `AudiusApiService.searchTracks(query, 24, offset)` with `PAGE_SIZE = 24` and `offset = (page - 1) * PAGE_SIZE`.
- On success: set `tracks`, `hasNextPage = (data.length === PAGE_SIZE)`, clear loading, sync state to `FreeMusicStateService`.
- On error: set error message `'Search failed. Try again.'`, clear loading.

### 2.2 Pagination

- Page is 1-based. "Next" enabled when `hasNextPage()` is true; "Previous" when `page() > 1`.
- `goToNextPage()` / `goToPrevPage()` update page and call `loadPage(pageNum)` with the new offset.
- A new search always resets page to 1.

### 2.3 Playback

- `onTrackClick(track)`: if it is the current now-playing track (`player.nowPlaying()?.track.id === track.id`), call `player.togglePlayPause()`; otherwise call `play(track)`.
- `play(track)`: builds `PlayableTrack[]` from current `tracks()` using `getArtworkUrl` and `getStreamEndpointUrl`, finds the track index, and calls `player.playQueue(playables, index)`.
- The full search result page becomes the queue; user can use player bar previous/next.

### 2.4 Artwork

- `artworkUrl(track)`: tries `getArtworkUrl(track, '480x480')` then `'150x150'`.
- On image load error (`onCoverError(trackId)`): adds track id to `brokenCoverIds` set and shows a fallback music symbol. `brokenCoverIds` is persisted in `FreeMusicStateService` so broken covers stay hidden across tab switch.

---

## 3. State persistence

### 3.1 FreeMusicStateService (in-memory)

**File:** `src/app/services/free-music-state.service.ts` | `providedIn: 'root'`

Holds writable signals: `query`, `tracks`, `page`, `hasNextPage`, `brokenCoverIds`.

- Component reads in `ngOnInit` via `restoreStateFromService()` and writes after every successful search via `saveStateToService()` and after cover errors.
- Ensures that when the user navigates to Playlists and back to Free Music, the last search and page are restored without a new API call.

### 3.2 Recent searches (localStorage)

- Key: `free-music-recent-searches`. Value: JSON array of strings (max 5).
- On each new search (non-empty), prepend the term, dedupe case-insensitively, keep latest 5, save to localStorage.
- On init, component reads and sets `recentSearches`. Clicking a chip calls `runRecentSearch(term)` which sets query and triggers `onSearch()`.

---

## 4. Add to playlist

- Per track: "+" button (`openAddToPlaylist(trackId, event)`) toggles a dropdown. `event.stopPropagation()` prevents the card click from triggering play.
- Dropdown auto-positions to the left when near the right viewport edge (checks `window.innerWidth - rect.right` against `ADD_TO_PLAYLIST_DROPDOWN_WIDTH = 240`).
- Dropdown lists existing playlists (from `playlistService.playlistsList()`) and a "Create new playlist" option.
- `addTrackToPlaylist(playlistId, trackId)`: calls `playlistService.addTrack()`, closes dropdown.
- `createPlaylistAndAddTrack(trackId)`: opens `playlistModal.openPrompt(...)`, creates playlist, adds track, closes dropdown, navigates to `/playlists/:id`. If modal is cancelled, does nothing.
- `@HostListener('document:click')` closes the dropdown on any outside click.

---

## 5. UI and interactions

### 5.1 Header

- Title "Free Music", subtitle, search input (two-way bound via `FormsModule`), Search button. Recent search chips below.

### 5.2 Results

- Grid of track cards: cover image (or music symbol fallback), title, artist, duration. Click card triggers `onTrackClick(track)`.

### 5.3 Pagination

- "Page N" text, Previous and Next buttons. Disabled when not applicable. Centered below grid.

### 5.4 Keyboard

- Global shortcuts (Space = play/pause, Left/Right = prev/next) are handled in `AppComponent` via `@HostListener('document:keydown')`. Disabled when focus is on an input (except range inputs like the seekbar), textarea, select, or elements with role `textbox`/`searchbox`.

---

## 6. Dependencies

| Dependency | Used for |
|------------|----------|
| `AudiusApiService` | `searchTracks`, `getArtworkUrl`, `getStreamEndpointUrl` |
| `PlayerService` | `playQueue`, `togglePlayPause`, `nowPlaying` |
| `PlaylistService` | `playlistsList()`, `addTrack`, `create` |
| `FreeMusicStateService` | Read/write: query, tracks, page, hasNextPage, brokenCoverIds |
| `PlaylistModalService` | `openPrompt` (for "Create new playlist") |
| `Router` | Navigate to `/playlists/:id` after creating a playlist |

---

## 7. File checklist

| File | Purpose |
|------|---------|
| `src/app/components/free-music/free-music.component.ts` | Search, pagination, play, add to playlist, state sync. |
| `src/app/components/free-music/free-music.component.html` | Header, search, grid, pagination, add-to-playlist dropdown. |
| `src/app/components/free-music/free-music.component.scss` | Layout, grid, cards, pagination, dropdown. |
| `src/app/services/free-music-state.service.ts` | In-memory state for query, tracks, page, hasNextPage, brokenCoverIds. |
| `src/app/services/audius-api.service.ts` | searchTracks, getArtworkUrl, getStreamEndpointUrl, getTrackById. |
| `src/app/app.routes.ts` | Route for `/free-music` (default). |
| `src/app/app.component.html` | Nav link "Free Music", router-outlet, player bar. |
| `src/app/app.component.scss` | `.main-content` flex and padding. |
