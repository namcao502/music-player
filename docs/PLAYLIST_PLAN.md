# Playlist Module – Design

Playlists are **saved lists of Audius track IDs** stored in `localStorage`. When a playlist is opened or played, track details are fetched from Audius on demand. No login or backend required.

---

## 1. Data model

**File:** `src/app/models/playlist.model.ts`

```ts
interface Playlist {
  id: string;        // e.g. 'pl-1707500000000' (generated via 'pl-' + Date.now())
  name: string;
  trackIds: string[];
  tags?: string[];  // optional; used for filter chips on list page
}
```

- Storage key: `music-player-playlists` (constant `PLAYLISTS_STORAGE_KEY`).
- Only track IDs are stored; full track data is resolved via Audius API when needed.

---

## 2. PlaylistService

**File:** `src/app/services/playlist.service.ts` | `providedIn: 'root'`

| Method | Signature | Description |
|--------|-----------|-------------|
| `loadFromStorage` | `(): void` | Reads playlists from localStorage on construction; parses JSON array. |
| `create` | `(name: string): string` | Creates playlist with id `'pl-' + Date.now()`, trims name (falls back to `'Playlist'`), saves, returns id. |
| `rename` | `(id: string, name: string): void` | Finds playlist by id, updates name (trims, keeps old name if empty), saves. |
| `delete` | `(id: string): void` | Filters out playlist by id, saves. |
| `duplicate` | `(playlistId: string): string` | Creates a new playlist with same name + " (copy)" and same trackIds (and tags if present); saves; returns new id. |
| `addTrack` | `(playlistId: string, trackId: string): void` | Appends trackId if not already present, saves. |
| `removeTrack` | `(playlistId: string, trackId: string): void` | Filters out trackId from playlist, saves. |
| `addTag` / `removeTag` | `(playlistId: string, tag: string): void` | Add or remove a tag from playlist.tags; saves. |
| `getPlaylist` | `(id: string): Playlist \| undefined` | Returns playlist by id from the signal. |
| `getPlayableTracks` | `(playlistId: string): Observable<PlayableTrack[]>` | Resolves track IDs to `PlayableTrack[]` via `forkJoin` of `AudiusApiService.getTrackById()` calls. Skips tracks that fail to load. |

**State:** `playlists` is a private `signal<Playlist[]>`; exposed as `playlistsList` (readonly).
**Persistence:** `saveToStorage()` is called after every mutation.

---

## 3. PlaylistModalService

**File:** `src/app/services/playlist-modal.service.ts` | `providedIn: 'root'`

Drives the `PlaylistModalComponent` via signals. Used instead of `window.prompt` / `window.confirm`.

| Method | Returns | Description |
|--------|---------|-------------|
| `openPrompt(title, initialValue?)` | `Promise<string \| null>` | Opens a text input modal. Resolves with the entered string or `null` on cancel. |
| `closePrompt(value)` | `void` | Closes the prompt modal and resolves the promise. |
| `openConfirm(message, confirmLabel?)` | `Promise<boolean>` | Opens a confirmation modal. Resolves `true` if confirmed. |
| `closeConfirm(value)` | `void` | Closes the confirm modal and resolves the promise. |

**Signals:** `promptConfig` and `confirmConfig` (both nullable). Opening one clears the other.

---

## 4. PlaylistModalComponent

**File:** `src/app/components/playlist-modal/playlist-modal.component.ts`

- Standalone component, imported in `AppComponent` (always present in the DOM as `<app-playlist-modal />`).
- Renders a modal overlay when `PlaylistModalService.promptConfig()` or `confirmConfig()` is set.
- Prompt mode: text input with submit/cancel buttons. An `effect` syncs the input value when the prompt opens.
- Confirm mode: message with confirm/cancel buttons.
- Keyboard: Enter submits, Escape cancels. Backdrop click cancels.

---

## 5. Routes

**File:** `src/app/app.routes.ts`

| Path | Component | Lazy loaded |
|------|-----------|-------------|
| `/playlists` | `PlaylistListComponent` | Yes |
| `/playlists/:id` | `PlaylistDetailComponent` | Yes |

Navigation link "Playlists" is in `app.component.html` using `routerLink="/playlists"`.

---

## 6. PlaylistListComponent

**File:** `src/app/components/playlist-list/playlist-list.component.ts`

- Standalone component. Injects: `PlaylistService`, `PlayerService`, `Router`, `PlaylistModalService`.
- Reads `playlistService.playlistsList()`; displays **sorted** list (sort by name or track count via chips). Optional **tag filter** chips to show only playlists with a given tag.

| Action | Implementation |
|--------|----------------|
| **New playlist** | `modal.openPrompt('Playlist name', 'New playlist')` then `playlistService.create(name)` then `router.navigate(['/playlists', id])`. |
| **Play** | `playlistService.getPlayableTracks(id).subscribe(tracks => player.playQueue(tracks, 0))`. Skips if empty. |
| **Duplicate** | `playlistService.duplicate(id)` → new id; toast "Playlist duplicated"; `router.navigate(['/playlists', newId])`. |
| **Rename** | `modal.openPrompt('Rename playlist', playlist.name)` then `playlistService.rename(id, name)`. |
| **Delete** | `modal.openConfirm('Delete "name"?', 'Delete')` then `playlistService.delete(id)`. |
| **Open** | `router.navigate(['/playlists', id])`. |
| **Sort** | Chips: "Name" / "Tracks" set `sortBy`; `sortedPlaylists` computed from `playlistsList()` and sort. |

---

## 7. PlaylistDetailComponent

**File:** `src/app/components/playlist-detail/playlist-detail.component.ts`

- Standalone component. Injects: `ActivatedRoute`, `Router`, `PlaylistService`, `AudiusApiService`, `PlayerService`, `PlaylistModalService`.
- On init: reads `route.snapshot.paramMap.get('id')`; if not found or playlist doesn't exist, redirects to `/playlists`.

| Feature | Implementation |
|---------|----------------|
| **Load tracks** | `forkJoin` of `audius.getTrackById(tid)` for each trackId; filters nulls; shows loading state. |
| **Play** | `playlistService.getPlayableTracks(id)` then `player.playQueue(playables, 0)`. |
| **Remove track** | `playlistService.removeTrack(playlistId, trackId)`; refreshes local playlist and track list signals. |
| **Reorder** | Drag-and-drop (CDK DragDrop); `playlistService.moveTrack(playlistId, previousIndex, currentIndex)`. |
| **Rename** | `modal.openPrompt('Rename playlist', name)` then `playlistService.rename(id, name)`; updates local signal. |
| **Delete** | `modal.openConfirm(...)` then `playlistService.delete(id)` then `router.navigate(['/playlists'])`. |
| **Back** | `router.navigate(['/playlists'])`. |

Helper methods: `formatDuration(seconds)` returns `M:SS`; `artworkUrl(track)` tries `480x480` then `150x150`.

---

## 8. Tag management

- Each playlist can have optional `tags: string[]`. **PlaylistService** exposes `addTag(playlistId, tag)` and `removeTag(playlistId, tag)`; both persist to localStorage.
- On the playlist list page, **tag filter chips** show distinct tags across all playlists. Selecting a tag filters the list to playlists that have that tag; the underlying data is unchanged. Removing the tag filter shows all playlists again.
- Tags are stored with the playlist; duplicate playlists copy tags. Export/import preserves tags when the JSON includes a `tags` array.

---

## 9. Import, export, and shareable URLs

- **Export:** `PlaylistService.exportPlaylist(id)` returns a JSON string of the `Playlist` object (`id`, `name`, `trackIds`, `tags` if present). The UI typically triggers a download of this file.
- **Import (file):** The user selects a JSON file; the app reads it and calls `PlaylistService.importPlaylist(json)`. The payload must be an object with `name` (string) and `trackIds` (array of non-empty strings); invalid or missing data returns `null` and shows an error toast. Valid import creates a new playlist and shows a success toast.
- **Import (URL):** The route `/import?tracks=id1,id2,...&name=...` is handled by **ImportComponent**. It reads `tracks` and `name` from the query string, builds a JSON object `{ name, trackIds }` (trackIds from splitting `tracks` by comma and trimming), and calls `importPlaylist(JSON.stringify(...))`. If `trackIds` is empty after parsing, it redirects to `/playlists` without calling import. If import succeeds, it redirects to `/playlists/:newId`; otherwise to `/playlists`. This is the same contract as pasting exported JSON into an import flow: the same `Playlist` shape is expected.

---

## 10. Add to playlist (from Free Music and Queue)

### From FreeMusicComponent

- Per track: "+" button toggles a dropdown positioned to avoid viewport overflow.
- Dropdown lists existing playlists (from `playlistService.playlistsList()`) and a "Create new playlist" option.
- Selecting a playlist: `playlistService.addTrack(playlistId, track.id)`, closes dropdown.
- "Create new playlist": `playlistModal.openPrompt(...)` then `create` + `addTrack` + `router.navigate(['/playlists', id])`.
- `@HostListener('document:click')` closes the dropdown on outside click.

### From PlayerBarComponent (queue panel)

- Same pattern: per queue item, "+" opens a dropdown with existing playlists + "Create new playlist".
- `addQueueTrackToPlaylist(playlistId, trackId)` and `createPlaylistAndAddQueueTrack(trackId)`.
- Document click closes the queue dropdown.

---

## 11. File checklist

| File | Purpose |
|------|---------|
| `src/app/models/playlist.model.ts` | `Playlist` interface, `PLAYLISTS_STORAGE_KEY` |
| `src/app/services/playlist.service.ts` | CRUD, localStorage, `getPlayableTracks()` |
| `src/app/services/playlist-modal.service.ts` | Prompt and confirm modal state |
| `src/app/components/playlist-modal/*` | Modal UI (prompt + confirm) |
| `src/app/components/playlist-list/*` | Playlist list page |
| `src/app/components/playlist-detail/*` | Playlist detail page |
| `src/app/app.routes.ts` | Routes for `/playlists` and `/playlists/:id` |
| `src/app/app.component.html` | Nav link to `/playlists`, `<app-playlist-modal />` |
| `src/app/components/free-music/*` | Add-to-playlist dropdown per track |
| `src/app/components/player-bar/*` | Add-to-playlist dropdown per queue item |
