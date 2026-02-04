# Free Music Module – Plan

The **Free Music** screen lets users search and stream royalty-free tracks from [Audius](https://audius.org/) with no login and no backend. Search results become the playback queue; tracks can be added to local playlists.

---

## 1. Overview

- **Entry:** Default route `/free-music` (or `/` redirect). Nav tab "Free Music".
- **Data source:** Audius API (search tracks, stream URL, artwork). No app backend.
- **State:** In-memory search state (query, tracks, page, hasNextPage, brokenCoverIds) is kept in `FreeMusicStateService` so it persists when switching to Playlists and back. Recent search terms (up to 5) are stored in `localStorage` under `free-music-recent-searches`.

---

## 2. Data flow

**2.1 Search**

- User enters a query and clicks **Search** or presses Enter.
- Empty/whitespace query: no API call.
- Non-empty: trim query, add to recent searches (and persist to localStorage), clear error and broken cover set, set page to 1, then call `AudiusApiService.searchTracks(query, PAGE_SIZE, offset)` with `PAGE_SIZE = 24` and `offset = (page - 1) * PAGE_SIZE`.
- On success: set `tracks`, `hasNextPage = (data.length === PAGE_SIZE)`, clear loading, and sync state to `FreeMusicStateService`.
- On error: set error message "Search failed. Try again.", clear loading.

**2.2 Pagination**

- Page is 1-based. "Next" is enabled only when `hasNextPage` is true; "Previous" when `page > 1`.
- Next/Previous update `page` and call the same search API with the new offset; results and `hasNextPage` are updated; state is synced to the service.
- A new search (same or new query) always resets page to 1.

**2.3 Playback**

- Clicking a track: if it is the current now-playing track, call `PlayerService.togglePlayPause()`; otherwise build `PlayableTrack[]` from current `tracks()` (using `getArtworkUrl` and `getStreamEndpointUrl`), find the track index, and call `player.playQueue(playables, index)`.
- Search results are the queue; user can use player bar previous/next.

**2.4 Artwork**

- Use `AudiusApiService.getArtworkUrl(track, '480x480')` with fallback to `'150x150'`. On image load error, add track id to `brokenCoverIds` and show a fallback (e.g. music icon). `brokenCoverIds` is persisted in `FreeMusicStateService` so broken covers stay hidden across tab switch.

---

## 3. State persistence

**3.1 FreeMusicStateService (in-memory)**

- Holds: `query`, `tracks`, `page`, `hasNextPage`, `brokenCoverIds`.
- Used so that when the user navigates to Playlists and back to Free Music, the last search and page are restored without a new API call.
- Component reads in `ngOnInit` (e.g. `restoreStateFromService`) and writes after every successful search and after cover error.

**3.2 Recent searches (localStorage)**

- Key: `free-music-recent-searches`. Value: JSON array of strings (max 5).
- On each new search (non-empty), prepend the term, dedupe case-insensitively, keep latest 5, save to localStorage.
- On init, component reads and sets `recentSearches`. Clicking a chip sets `query` and triggers search.

---

## 4. UI and interactions

**4.1 Header**

- Title "Free Music", subtitle, search input, Search button. Optional: recent search chips below.

**4.2 Results**

- Grid of track cards: cover (or fallback), title, artist (optional), duration. Click card → play / toggle pause. Fixed cover size (e.g. 160px) and text truncation for consistent layout.

**4.3 Pagination**

- "Page N" text, "‹ Previous" and "Next ›" buttons. Disabled when not applicable. Centered below grid; minimal vertical spacing so the bottom area is not excessively tall.

**4.4 Add to playlist**

- Per track: "+" button that toggles a dropdown. Dropdown lists existing playlists (from `PlaylistService.playlistsList()`) and a "Create new playlist" option.
- Selecting a playlist: `PlaylistService.addTrack(playlistId, track.id)` and close dropdown.
- "Create new playlist": open prompt (e.g. `PlaylistModalService.openPrompt('New playlist name', 'New playlist')`), create playlist, add track, close dropdown, navigate to `/playlists/:id`.
- Dropdown positioned so it stays on screen (e.g. open to the left when near the right edge). Click outside (document click) closes the dropdown.

**4.5 Keyboard**

- Global shortcuts (Space = play/pause, Left/Right = prev/next) are handled in `AppComponent` and are disabled when focus is in an input (e.g. search).

---

## 5. Layout and styling

- **Container:** `.free-music` with consistent padding (e.g. 1.5rem); no extra large bottom padding so the main content area height stays content-driven.
- **Main content area:** `.main-content` uses `flex: 0 0 auto` so it does not grow and the player bar sits close below the content; `padding-bottom: var(--player-bar-height)` reserves space for the fixed player bar.
- **Grid:** Fixed track cover size, `object-fit: cover` for artwork, ellipsis for long title/artist.
- **Empty state:** When there are no results yet, show a short message (e.g. "Enter a search term and click Search to find free music.").

---

## 6. Dependencies

- `AudiusApiService`: searchTracks, getArtworkUrl, getStreamEndpointUrl.
- `PlayerService`: playQueue, togglePlayPause, nowPlaying.
- `PlaylistService`: playlistsList(), addTrack, create.
- `FreeMusicStateService`: query, tracks, page, hasNextPage, brokenCoverIds (read/write).
- `PlaylistModalService`: openPrompt (for "Create new playlist").
- `Router`: navigate to `/playlists/:id` after creating a playlist and adding the track.

---

## 7. File checklist

| File | Purpose |
|------|---------|
| `src/app/components/free-music/free-music.component.ts` | Search, pagination, play, add to playlist, state sync. |
| `src/app/components/free-music/free-music.component.html` | Header, search, grid, pagination, add-to-playlist dropdown. |
| `src/app/components/free-music/free-music.component.scss` | Layout, grid, cards, pagination, dropdown. |
| `src/app/services/free-music-state.service.ts` | In-memory state for query, tracks, page, hasNextPage, brokenCoverIds. |
| `src/app/services/audius-api.service.ts` | searchTracks, getArtworkUrl, getStreamEndpointUrl. |
| `src/app/app.routes.ts` | Route for free-music (default). |
| `src/app/app.component.html` | Nav link "Free Music", router-outlet, player bar. |
| `src/app/app.component.scss` | .main-content flex and padding. |
| `docs/FREE_MUSIC_PLAN.md` | This plan. |
| `docs/TEST_PLAN.md` | Free Music test cases (§3.5). |

---

## 8. Test plan summary (Free Music)

- **F1–F16** (existing): Initial state, search (empty/non-empty, success, error), recent search, play/toggle, formatDuration, recent from localStorage, onTrackClick same/different track, pagination reset and next page, cover error, add-to-playlist open/close and addTrackToPlaylist.
- **F17:** State restore: when `FreeMusicStateService` has query or tracks, `ngOnInit` restores query, tracks, page, hasNextPage, brokenCoverIds.
- **F18:** goToPrevPage decrements page and calls search with previous offset.
- **F19:** createPlaylistAndAddTrack: when modal returns a name, creates playlist, adds track, closes dropdown, navigates to `/playlists/:id`; when modal returns null, does nothing.
- **F20:** Document click (closeAddToPlaylist) clears addToPlaylistTrackId.

See `docs/TEST_PLAN.md` §3.5 for the full table and `free-music.component.spec.ts` for implementation.
