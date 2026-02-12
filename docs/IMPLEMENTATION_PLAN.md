# Implementation Plan – Suggested Features

This plan covers four areas: **Discovery & organization**, **Playback & queue**, **Playlists**, and **UX & accessibility**. Tasks are grouped by phase (Phase 1 = quick wins, Phase 2 = medium effort). Dependencies and suggested file changes are noted.

---

## Implemented (Phase 1)

The following have been implemented and are documented in [FEATURES.md](FEATURES.md):

- **Playback & queue:** Persist volume and playback speed; seek ±10 s buttons; remove single track from queue.
- **History:** Sort by date / title / artist; remove single entry from history.
- **Playlists:** Duplicate playlist; sort playlists by name or track count.
- **UX & accessibility:** Live region for "Now playing" announcement; `prefers-reduced-motion` respected; `.sr-only` for screen readers.

Storage keys added: `music-player-volume`, `music-player-muted`, `music-player-playback-speed`.

---

## Overview

| Phase | Focus | Est. scope |
|-------|--------|------------|
| **Phase 1** | Low-effort, high-value items across all four areas | 7–10 tasks |
| **Phase 2** | Medium-effort features (queue reorder, play next, deep links, accent theme) | 4–6 tasks |

Work can be done incrementally; each feature is independently shippable unless marked as dependent.

---

## 1. Discovery & organization

### 1.1 Search suggestions / autocomplete (Phase 1)

- **Goal:** Show suggestions (e.g. recent searches or API suggestions) as the user types in the search box.
- **Effort:** Low (recent only) / Medium (if using Audius search-suggest API).
- **Files:**
  - `src/app/components/free-music/free-music.component.ts` — debounced input, build list of suggestions (recent + optional API).
  - `src/app/components/free-music/free-music.component.html` — dropdown under search input, bind to suggestion list and select on click/Enter.
  - `src/app/constants/ui-strings.ts` — labels e.g. "Recent", "Suggestions" if needed.
- **Dependencies:** None. Recent searches already exist; reuse `recentSearches()` for a simple dropdown first.
- **Notes:** If Audius has a search-suggest endpoint, add a method in `AudiusApiService` and call it with debounce (e.g. 300ms).

---

### 1.2 Listening stats / most played (Phase 1)

- **Goal:** Derive "most played" from history (e.g. last 30 days) and show on a dedicated section or page.
- **Effort:** Low.
- **Files:**
  - `src/app/services/history.service.ts` — add `mostPlayedTrackIds(limit: number, sinceDays?: number): { trackId: string; count: number }[]` (or return top N track IDs). History entries have `track.id` and `playedAt`; aggregate by trackId, filter by date, sort by count.
  - Optional: new section on Free Music or a small "Most played" block on History page.
  - `src/app/components/history/history.component.ts` + `.html` — optional "Most played" subsection or link.
- **Dependencies:** None. Uses existing history data.
- **Storage:** No new keys; compute from `music-player-history`.

---

### 1.3 Sort history (Phase 1)

- **Goal:** Let user sort history by date played, track name, or artist.
- **Effort:** Low.
- **Files:**
  - `src/app/components/history/history.component.ts` — add `sortBy: 'date' | 'title' | 'artist'` (signal or property), computed list that sorts `historyService.historyList()` accordingly.
  - `src/app/components/history/history.component.html` — dropdown or chips for sort option; display sorted list.
  - `src/app/constants/ui-strings.ts` — e.g. `SORT.DATE`, `SORT.TITLE`, `SORT.ARTIST` (reuse or add).
- **Dependencies:** None.

---

### 1.4 Sort favorites (Phase 1)

- **Goal:** Sort favorites by date added, title, or artist.
- **Effort:** Low.
- **Files:**
  - `src/app/services/favorites.service.ts` — if not already stored: persist "date added" per track ID (e.g. `{ id: string; addedAt: number }[]`). If only IDs are stored, "date added" requires a small schema change and migration.
  - Alternative (no schema change): sort by title/artist only by loading track details and sorting in the component.
  - `src/app/components/favorites/favorites.component.ts` — sort mode signal; computed sorted list (by title/artist from tracks(); by date if FavoritesService exposes addedAt).
  - `src/app/components/favorites/favorites.component.html` — sort UI.
  - `src/app/constants/ui-strings.ts` — sort labels.
- **Dependencies:** Optional: extend favorites storage to `{ id, addedAt }[]` for "date added" sort.

---

### 1.5 Remove from history (single entry) (Phase 1)

- **Goal:** Allow removing one entry from history without clearing all.
- **Effort:** Low.
- **Files:**
  - `src/app/services/history.service.ts` — add `removeEntry(trackId: string, playedAt: number)` or `removeEntry(entry: HistoryEntry)` that filters out that entry and saves.
  - `src/app/components/history/history.component.html` — per-row "Remove" button (e.g. icon); call `historyService.removeEntry(...)`.
  - `src/app/constants/ui-strings.ts` — aria-label for remove button; optional toast "Removed from history".
- **Dependencies:** None.

---

### 1.6 Genre filter on search (Phase 2, optional)

- **Goal:** Filter search results by genre if Audius API supports it.
- **Effort:** Medium (depends on API).
- **Files:**
  - `src/app/services/audius-api.service.ts` — check search endpoint for genre filter; add parameter if supported.
  - `src/app/components/free-music/free-music.component.ts` — genre filter state; pass to search.
  - `src/app/components/free-music/free-music.component.html` — genre chips or dropdown (reuse pattern from trending).
- **Dependencies:** Audius API capability.

---

## 2. Playback & queue

### 2.1 Seek ±10 seconds (Phase 1)

- **Goal:** Buttons or keyboard shortcuts to skip back 10 s / forward 10 s.
- **Effort:** Low.
- **Files:**
  - `src/app/components/player-bar/player-bar.component.ts` — add `seekRelative(deltaSeconds: number)`: get current time, add delta, clamp to [0, duration], set `audio.currentTime` (and update `currentTime` signal if needed).
  - `src/app/components/player-bar/player-bar.component.html` — two small buttons (e.g. -10 s, +10 s) near seekbar; optional keyboard (e.g. J / L).
  - `src/app/app.component.ts` — if using global shortcuts: add key handlers for chosen keys and call player-bar method (or expose via PlayerService).
  - `src/app/constants/ui-strings.ts` — e.g. `BTN.SEEK_BACK`, `BTN.SEEK_FORWARD`.
- **Dependencies:** None. Player bar already has access to audio element and duration.

---

### 2.2 Remove single track from queue (Phase 1)

- **Goal:** Remove one track from the queue without clearing the entire queue.
- **Effort:** Low.
- **Files:**
  - `src/app/services/player.service.ts` — add `removeFromQueue(trackId: string)` or `removeFromQueue(index: number)`: remove that item from queue array, update signals. If current track is removed, advance to next (or stop if last).
  - `src/app/components/player-bar/player-bar.component.html` — per queue item a "Remove" button; call `player.removeFromQueue(track.id)` (and close dropdown if needed).
  - `src/app/constants/ui-strings.ts` — aria-label "Remove from queue"; optional toast.
- **Dependencies:** None.

---

### 2.3 Persist volume (Phase 1)

- **Goal:** Remember volume (and mute state) across sessions.
- **Effort:** Low.
- **Files:**
  - `src/app/components/player-bar/player-bar.component.ts` — on init, read `localStorage.getItem('music-player-volume')` (and optionally `music-player-muted`); apply to audio element and `volume` / mute state. On volume or mute change, save to localStorage.
  - Optional: add a small helper or do it in existing volume/mute handlers.
- **Storage key:** `music-player-volume` (0–1), optional `music-player-muted` (boolean).
- **Dependencies:** None.

---

### 2.4 Persist playback speed (Phase 1)

- **Goal:** Remember last playback speed across sessions.
- **Effort:** Low.
- **Files:**
  - `src/app/components/player-bar/player-bar.component.ts` — on init, read `localStorage.getItem('music-player-playback-speed')`; if valid (e.g. one of SPEED_OPTIONS), set it. On speed change, save to localStorage.
  - **Storage key:** `music-player-playback-speed` (e.g. "1.25").
- **Dependencies:** None.

---

### 2.5 Reorder queue (Phase 2)

- **Goal:** Drag-and-drop (or up/down buttons) to reorder tracks in the "Up next" panel.
- **Effort:** Medium.
- **Files:**
  - `src/app/services/player.service.ts` — add `moveQueueItem(fromIndex: number, toIndex: number)`: reorder queue array, update signal. Handle current index so "now playing" stays correct.
  - `src/app/components/player-bar/player-bar.component.html` — make queue list use `cdkDropList` / `cdkDrag` (Angular CDK DragDrop already in project for playlists). On drop, call `player.moveQueueItem(previousIndex, currentIndex)`.
  - `src/app/components/player-bar/player-bar.component.ts` — inject DragDropModule; implement `onQueueDrop(event: CdkDragDrop)`.
  - `src/app/constants/ui-strings.ts` — e.g. "Drag to reorder" for queue.
- **Dependencies:** None. CDK is already used in playlist-detail.

---

### 2.6 Play next / Add to queue (Phase 2)

- **Goal:** "Play next" inserts track(s) after the current track; "Add to queue" appends at end (current behavior for "add" can stay or become explicit "add to end").
- **Effort:** Medium.
- **Files:**
  - `src/app/services/player.service.ts` — add `playNext(track: PlayableTrack)` and optionally `playNextTracks(tracks: PlayableTrack[])`: insert after current index (e.g. `currentIndex + 1`). Add `addToQueue(track)` or keep existing "add to queue" as append. Queue structure: ensure there is a notion of "current index" and insert at `currentIndex + 1`, shifting rest.
  - `src/app/components/player-bar/player-bar.component.html` — in queue panel dropdown for each track, add "Play next" (and keep "Add to playlist"). Possibly in free-music/trending/artist: add "Play next" to track card actions (insert into queue and show toast).
  - `src/app/constants/ui-strings.ts` — `BTN.PLAY_NEXT`, `BTN.ADD_TO_QUEUE`, toasts.
- **Dependencies:** None. Requires clear queue API (current index + insert position).

---

### 2.7 Resume position (Phase 2, optional)

- **Goal:** Optionally remember and restore playback position per track (e.g. for long tracks).
- **Effort:** Medium.
- **Files:**
  - New small service or in `PlayerService` / `HistoryService`: store `Map<trackId, number>` (seconds) in localStorage (e.g. `music-player-resume-positions`). On track start: read position; if > 0 and user preference "resume", set `audio.currentTime`. On track end or change: save current time for that trackId.
  - `src/app/components/player-bar/player-bar.component.ts` — on load track, check resume storage; on unload/ended, write position.
  - Settings or toggle: "Resume playback" (default on/off). Could live in a small settings service + UI later.
- **Dependencies:** None. Optional UX: add a setting to turn resume on/off.

---

## 3. Playlists

### 3.1 Duplicate playlist (Phase 1)

- **Goal:** "Duplicate" action creates a copy of a playlist (name + " (copy)" or prompt for name).
- **Effort:** Low.
- **Files:**
  - `src/app/services/playlist.service.ts` — add `duplicate(playlistId: string): string`: get playlist by id, create new with `name + ' (copy)'` (or use `CONFIRM` / modal for name), copy `trackIds` and `tags`, save, return new id.
  - `src/app/components/playlist-list/playlist-list.component.html` — add "Duplicate" button per playlist (or in a menu). Navigate to new playlist after duplicate.
  - `src/app/constants/ui-strings.ts` — `BTN.DUPLICATE`, toast "Playlist duplicated".
- **Dependencies:** None.

---

### 3.2 Sort playlists (Phase 1)

- **Goal:** Sort playlist list by name (A–Z), date created, or track count.
- **Effort:** Low.
- **Files:**
  - `src/app/services/playlist.service.ts` — playlists already have creation order (array order). If creation date is not stored, we can add `createdAt?: number` on next create/import and sort by it; existing playlists can be treated as "old" (e.g. 0).
  - `src/app/components/playlist-list/playlist-list.component.ts` — add `sortBy: 'name' | 'date' | 'count'`; computed `sortedPlaylists()` that sorts `filteredPlaylists()` (or playlistsList) accordingly.
  - `src/app/components/playlist-list/playlist-list.html` — dropdown or chips for sort; display `sortedPlaylists()`.
  - `src/app/constants/ui-strings.ts` — sort labels.
- **Dependencies:** Optional: add `createdAt` to Playlist model and migration for existing data.

---

### 3.3 Playlist cover (Phase 1)

- **Goal:** Show first track's artwork (or first in list) as playlist cover in list view.
- **Effort:** Low.
- **Files:**
  - `src/app/components/playlist-list/playlist-list.component.ts` — for each playlist, resolve first trackId to get artwork URL (e.g. via `AudiusApiService.getTrackById(playlist.trackIds[0])`). Can be a computed that returns `Map<playlistId, string>` of image URLs, or load on demand. Consider caching to avoid repeated API calls.
  - `src/app/components/playlist-list/playlist-list.component.html` — in list item, show small cover image (or placeholder) using first track art.
  - Styling in `playlist-list.component.scss`.
- **Dependencies:** None. Optional: cache first-track art in memory per session.

---

### 3.4 Merge playlists (Phase 2)

- **Goal:** "Merge into…" to append one playlist's tracks into another (with optional duplicate handling).
- **Effort:** Medium.
- **Files:**
  - `src/app/services/playlist.service.ts` — add `merge(sourcePlaylistId: string, targetPlaylistId: string, options?: { skipDuplicates?: boolean })`: get both playlists, append source trackIds to target (optionally skipping IDs already in target), save target.
  - `src/app/components/playlist-list/playlist-list.component.html` — add "Merge into…" per playlist; open modal or dropdown to pick target playlist; confirm then call `merge`.
  - `src/app/constants/ui-strings.ts` — `BTN.MERGE`, `CONFIRM.MERGE_PLAYLIST`, toasts.
- **Dependencies:** None.

---

## 4. UX & accessibility

### 4.1 Reduce motion (Phase 1)

- **Goal:** Respect `prefers-reduced-motion` (e.g. disable or tone down equalizer animation, other motion).
- **Effort:** Low.
- **Files:**
  - Global: in `styles.scss` or a utility, use `@media (prefers-reduced-motion: reduce)` to disable or simplify animations (e.g. `.now-playing-anim`, `.queue-now-playing-anim`, equalizer bars).
  - Optional: inject a service that reads `window.matchMedia('(prefers-reduced-motion: reduce)')` and exposes a signal; components conditionally apply animated classes.
  - `src/app/components/player-bar/player-bar.component.scss` — scope reduced-motion styles for visualizer/equalizer if needed.
- **Dependencies:** None.

---

### 4.2 Live region for now playing (Phase 1)

- **Goal:** Announce "Now playing: Title by Artist" for screen readers when track changes.
- **Effort:** Low.
- **Files:**
  - `src/app/components/player-bar/player-bar.component.html` — add an `aria-live="polite"` (or `assertive`) region, e.g. `<div aria-live="polite" aria-atomic="true" class="sr-only">{{ nowPlayingAnnouncement() }}</div>`. Bind text to current track title + artist.
  - `src/app/components/player-bar/player-bar.component.ts` — compute `nowPlayingAnnouncement()` from `player.nowPlaying()` (e.g. "Now playing: Title by Artist"). Update when nowPlaying changes so screen reader picks it up.
  - Ensure the live region is visually hidden (e.g. `.sr-only` with clip/position).
- **Dependencies:** None.

---

### 4.3 Accent / theme color (Phase 2)

- **Goal:** Let user pick an accent color (e.g. brand color) while keeping light/dark base theme.
- **Effort:** Medium.
- **Files:**
  - `src/app/services/theme.service.ts` — extend to hold `accentColor: signal<string>` (e.g. hex). Persist in localStorage (`music-player-accent`). Apply as CSS variable (e.g. `--accent`) on `document.documentElement` or body.
  - `src/styles.scss` — use `var(--accent, fallback)` for buttons, links, active states, progress bar, etc.
  - Settings UI: new small "Theme" or "Appearance" section (e.g. in app component or modal) with color picker or preset chips. Update `ThemeService.accentColor` and CSS variable.
  - `src/app/constants/ui-strings.ts` — labels for accent picker.
- **Dependencies:** None.

---

### 4.4 Keyboard navigation in queue (Phase 2)

- **Goal:** Full keyboard support in queue panel: arrow keys to move focus, Enter to play, Delete to remove.
- **Effort:** Medium.
- **Files:**
  - `src/app/components/player-bar/player-bar.component.html` — ensure queue items are focusable and in tab order; add `(keydown)` handler on list or items.
  - `src/app/components/player-bar/player-bar.component.ts` — handle keydown: ArrowUp/ArrowDown move focus between items; Enter/Space play focused item; Delete remove focused item and focus next. Use `@HostListener` or template `(keydown)`.
  - `src/app/constants/ui-strings.ts` — aria-labels for "Remove from queue", etc.
- **Dependencies:** 2.2 (Remove from queue) recommended so Delete has an action.

---

## 5. Suggested order of implementation

### Phase 1 (quick wins)

1. **2.3 Persist volume** — no UI change, small logic.
2. **2.4 Persist playback speed** — same.
3. **2.1 Seek ±10 s** — small player-bar change.
4. **2.2 Remove single track from queue** — PlayerService + queue UI.
5. **1.5 Remove from history** — HistoryService + one button per row.
6. **3.1 Duplicate playlist** — PlaylistService + one button.
7. **3.2 Sort playlists** — computed sort in playlist-list.
8. **1.3 Sort history** — computed sort in history.
9. **4.1 Reduce motion** — CSS + optional media query.
10. **4.2 Live region now playing** — one div + computed string.
11. **1.2 Most played** (optional) — HistoryService method + optional UI.
12. **3.3 Playlist cover** (optional) — list view enhancement.
13. **1.1 Search suggestions** (recent-only first) — dropdown in free-music.
14. **1.4 Sort favorites** (if no schema change: title/artist only) — Favorites component.

### Phase 2

15. **2.5 Reorder queue** — CDK drag-drop in queue panel.
16. **2.6 Play next / Add to queue** — PlayerService insert-at position + UI.
17. **4.3 Accent color** — ThemeService + CSS variables + picker UI.
18. **4.4 Keyboard in queue** — keydown handlers in player-bar.
19. **3.4 Merge playlists** — PlaylistService + UI.
20. **2.7 Resume position** (optional) — storage + player-bar integration.
21. **1.6 Genre filter on search** (optional) — if API supports.

---

## 6. Storage keys to add (summary)

| Key | Purpose |
|-----|--------|
| `music-player-volume` | Volume 0–1 |
| `music-player-muted` | Mute state (optional) |
| `music-player-playback-speed` | e.g. "1.25" |
| `music-player-accent` | Accent color hex (Phase 2) |
| `music-player-resume-positions` | Optional: JSON map trackId → seconds (Phase 2) |

If playlist `createdAt` or favorites `addedAt` are added, they live inside existing keys (`music-player-playlists`, `music-player-favorites`).

---

## 7. Docs to update as you ship

- **FEATURES.md** — add a short bullet per feature under the right section (Discovery, Playback, Playlists, Technical / Accessibility).
- **README.md** — optional one-line per major feature.
- **TEST_PLAN.md** — add cases for new actions (remove from queue, duplicate playlist, sort, persist volume/speed, etc.).

---

End of plan. Pick any task from Phase 1 or 2 and implement in small commits; the plan is independent of implementation order except where dependencies are noted.
