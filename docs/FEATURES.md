# Free Music Player – Features

A browser-based music player built with Angular that streams free, royalty-free music from [Audius](https://audius.org/). No login, no backend, no ads. Runs entirely in the browser with `localStorage` for persistence.

---

## 1. Music Discovery

### 1.1 Search

- Search millions of tracks on Audius by keyword.
- Paginated results (24 tracks per page) with Previous / Next navigation.
- Recent searches (last 5) saved locally and shown as clickable chips.
- Clear recent searches with one click.
- One-click share button on each result to copy a shareable track link.

### 1.2 Trending Tracks

- Browse the top 50 trending tracks on Audius.
- Auto-loads on page visit, no search required.
 - Same quick actions as search results (favorite, share, add to playlist).

### 1.3 Artist Pages

- Click any artist name (in search results or trending) to view their full track list (up to 50 tracks).
- Artist name and handle displayed in the header.
- "Play all" button to queue the entire discography.

### 1.4 Sort & Filter

- Custom sort dropdown (styled to match app theme, with rounded corners and active-item highlight).
- Sort search results by:
  - Default (API relevance order)
  - Duration (shortest first)
  - Duration (longest first)
  - Artist name (A-Z)
- **Filter input** on Favorites, History, and Playlist Detail pages to filter displayed tracks by title or artist name (client-side, reactive).

---

## 2. Playback

### 2.1 Player Bar

- Persistent player bar at the bottom of the screen when a track is playing.
- Displays cover art, track title, and artist name.
- Play / Pause, Previous, Next controls.
- Seekbar with current time and total duration; **seek back / forward 10 s** buttons.
- Playback speed selector (e.g. 0.5×, 1×, 1.5×, 2×) for fine‑grained control.
- **Volume and playback speed** persist across sessions.

### 2.2 Queue

- Click a track to play it; the entire search result page (or playlist) becomes the queue.
- Open the "Up Next" queue panel to see all queued tracks.
- Click any track in the queue to jump to it.
- **Add to queue:** Per-track button on Trending, Artist, Favorites, and History pages to append a track to the end of the current queue without replacing it.
- Total queue duration displayed at the bottom.
- Clear queue button to stop playback and reset the queue.
- **Remove a single track** from the queue (per‑track remove button).
- Add any queued track to an existing playlist or create a new playlist directly from the queue.

### 2.3 Shuffle & Loop

- **Shuffle:** Randomizes next/previous track selection from the queue.
- **Loop modes** (cycle through):
  - **Off:** Stops at the end of the queue.
  - **Loop all:** Wraps to the first track after the last.
  - **Loop one:** Repeats the current track indefinitely.

### 2.4 Volume Control

- Adjustable volume slider (0–100%).
- Dynamic speaker icon reflects current volume level (muted / low / high).
- Dedicated mute / unmute button.

### 2.5 Crossfade

- Smooth volume fade between tracks (0–12 seconds, configurable via slider in the queue panel).
- Setting persists across sessions.

### 2.6 Now Playing Animation

- Animated equalizer bars on the currently playing track in search results, trending, and queue panel.

### 2.7 Audio Visualizer

- Optional audio visualizer in the player bar (desktop) driven by the Web Audio API analyser node.

### 2.8 Mini Player

- Compact mini player mode on desktop that keeps core controls visible while collapsing the full bar.

### 2.9 Sleep Timer

- Sleep timer in the queue footer to automatically stop playback after 15, 30, or 60 minutes.
- Visible countdown and one‑click cancel button while the timer is active.

### 2.10 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play / Pause |
| Right Arrow | Next track |
| Left Arrow | Previous track |

Shortcuts are disabled when typing in a text input.

Media keys (Play/Pause, Next, Previous) are also supported when available.

---

## 3. Playlists

### 3.1 Create & Manage

- Create playlists with custom names.
- Rename or delete playlists via modal dialogs.
- **Duplicate playlist** to create a copy (name + " (copy)").
- **Sort playlists** by name or track count (chips above the list).
- View track count per playlist in the list view.
- Color‑coded tags per playlist with a preset tag palette.
- Tag filter chips above the list to quickly filter playlists by tag.

### 3.2 Track Management

- Add tracks to playlists from search results, trending, or the queue panel via the "+" button.
- Remove tracks from a playlist in the detail view.
- Reorder tracks with drag‑and‑drop handles in the playlist detail view.

### 3.3 Play Playlist

- Play an entire playlist from the list view or detail view.
- Track details (title, artist, duration, artwork) are fetched on demand from Audius.

### 3.4 Import & Export

- **Export:** Download a playlist as a JSON file for sharing or backup.
- **Import:** Load a playlist from a JSON file. Validates structure before importing.

### 3.5 Shareable Playlist Links

- **Share:** Copy a shareable URL to the clipboard from the playlist detail view.
- Opening the shared URL (`/import?tracks=id1,id2&name=...`) automatically imports the playlist and redirects to it.

---

## 4. Favorites

- Heart icon on every track (search, trending, artist page) to mark as favorite.
- **Dedicated Favorites page** (`/favorites`) accessible from the navigation bar.
  - Lists all favorited tracks with cover art, title, artist, and duration.
  - **Filter input** to search favorites by title or artist.
  - "Play all" button to queue all favorites (uses unfiltered list).
  - Click any track to play it.
  - **Add to queue** button per track.
  - Remove button (filled heart) to unfavorite directly from the list.
  - Track details fetched on demand from Audius.
- Favorites are stored locally and persist across sessions.
- Visual indicator (filled heart) for favorited tracks.

---

## 5. Play History

- Automatically records the last 50 played tracks with timestamps.
- **Play count tracking:** Each play increments a per-track counter (persisted separately from history).
- View history on the History page.
- **Recently played artists:** Clickable artist chips (up to 10) at the top of the history page; clicking navigates to the artist page.
- **Filter input** to search history by title or artist.
- **Sort history** by date, title, or artist (chips above the list).
- Click any entry to replay the track.
- **Add to queue** button per track.
- **Remove a single entry** from history (per‑row remove button).
- Clear history with one click (also clears play counts).
- Persists across sessions.

---

## 6. Stats Dashboard

- **Dedicated Stats page** (`/stats`) accessible from the navigation bar.
- Overview cards:
  - **Total Tracks Played** (sum of all play counts).
  - **Unique Tracks** (number of distinct tracks in history).
  - **Unique Artists** (number of distinct artists in history).
  - **Total Listening Time** (estimated from track durations × play counts, formatted as `Xh Ym`).
- **Most Played Tracks:** Top 5 tracks ranked by play count.
- **Most Played Artists:** Top 5 artists ranked by aggregated play counts, with clickable links to artist pages.
- All data is computed from the play history and play count map — no additional API calls needed.

---

## 7. Theming

- **Dark mode** (default) and **Light mode**.
- Toggle via the sun/moon button in the top-right corner.
- Respects OS preference (`prefers-color-scheme`) on first visit.
- Preference persists across sessions.

---

## 8. Responsive Layout

- Mobile-friendly layout at screen widths below 640px:
  - Horizontally scrollable navigation bar.
  - Compact track grids and controls.
  - Reduced padding and font sizes.

---

## 9. PWA (Progressive Web App)

- **Installable** on mobile and desktop (Add to Home Screen).
- **Offline support:** App shell cached on first load via Angular Service Worker.
- **API caching:** Audius API responses cached for 1 hour with network-first strategy.
- Standalone display mode (no browser chrome).
- Custom theme color and app icon.

---

## 10. Technical Details

### Data Source

All music is streamed from the [Audius](https://audius.org/) public API. No authentication required. Tracks are free and royalty-free.

### Storage

All user data is stored in the browser's `localStorage`:

| Key | Data |
|-----|------|
| `music-player-playlists` | Playlists (name + track IDs) |
| `music-player-theme` | Theme preference (light/dark) |
| `music-player-favorites` | Set of favorite track IDs |
| `music-player-history` | Last 50 played tracks with timestamps |
| `music-player-play-counts` | Per-track play count map (`Record<string, number>`) |
| `free-music-recent-searches` | Last 5 search queries |
| `crossfade-duration` | Crossfade setting (0–12 seconds) |
| `music-player-volume` | Volume level (0–1) |
| `music-player-muted` | Mute state (optional) |
| `music-player-playback-speed` | Playback speed (e.g. 1.25) |

### Notifications

- Non‑blocking toast notifications for key actions:
  - Playlist create / rename / delete / import / export.
  - Add / remove from favorites and playlists.
  - **Added to queue.**
  - Clear queue, clear history; **removed from queue**, **removed from history**.
  - **Playlist duplicated.**
  - Sleep timer set / ended / cancelled.
  - Share link copy success / failure; **playlist link copied** / failed.

### Routes

| Path | Page |
|------|------|
| `/free-music` | Search & stream (default) |
| `/trending` | Top 50 trending tracks |
| `/playlists` | Playlist list |
| `/playlists/:id` | Playlist detail |
| `/artist/:id` | Artist track list |
| `/favorites` | Favorite tracks |
| `/history` | Play history |
| `/stats` | Listening stats dashboard |
| `/import` | Playlist import from shared URL |

### UI Strings

All user-facing text (labels, buttons, empty states, toasts, errors) is centralized in `src/app/constants/ui-strings.ts` for consistency and easier updates or localization.

### Accessibility

- **Live region** announces "Now playing: Title by Artist" when the track changes (screen readers).
- **Reduced motion:** `prefers-reduced-motion: reduce` is respected (animations and transitions minimized).

### Browser Support

Modern browsers with HTML5 Audio support. Service Worker requires HTTPS in production.
