# Playlist Module – Minimal Step-by-Step Plan

Playlists are **saved lists of Audius track IDs** stored in `localStorage`. When you open or play a playlist, we fetch track details and stream URLs from Audius.

---

## Step 1: Data model and storage key

**1.1** Create `src/app/models/playlist.model.ts`:

- `Playlist` interface: `id: string`, `name: string`, `trackIds: string[]`
- Constant: `PLAYLISTS_STORAGE_KEY = 'music-player-playlists'`

**1.2** No snapshot storage; we only store track IDs and resolve via Audius when needed.

---

## Step 2: PlaylistService

**2.1** Create `src/app/services/playlist.service.ts`:

- Private `playlists = signal<Playlist[]>([])`
- Public readonly: `playlistsList = this.playlists.asReadonly()`
- `loadFromStorage()`: read from localStorage, parse JSON, set playlists; call in constructor
- `saveToStorage()`: write `playlists()` to localStorage (call after every mutation)
- `create(name: string): string` – create playlist with new id (e.g. `'pl-' + Date.now()`), push to array, save, return id
- `rename(id: string, name: string): void` – find by id, set name, save
- `delete(id: string): void` – filter out by id, save
- `addTrack(playlistId: string, trackId: string): void` – find playlist, push trackId if not already in list, save
- `removeTrack(playlistId: string, trackId: string): void` – find playlist, filter out trackId, save
- `getPlaylist(id: string): Playlist | undefined` – return playlists().find(p => p.id === id)

**2.2** Register in app: ensure `PlaylistService` is injectable and available (e.g. `providedIn: 'root'`).

---

## Step 3: Resolve playlist tracks to PlayableTrack[]

**3.1** We need to turn `trackIds: string[]` into `PlayableTrack[]` for the player. Audius API has a "get track by id" (or we can search). Check `AudiusApiService`:

- If there is `getTrackById(id)` → use it for each id.
- If not: add a method that fetches one track by id (e.g. GET track by id endpoint). See Audius API docs for single track fetch.

**3.2** In `PlaylistService` or a small helper (or in the component that "plays" the playlist):

- Method `getPlayableTracksForPlaylist(playlistId: string): Observable<PlayableTrack[]>` or return `Promise<PlayableTrack[]>`:
  - Get playlist by id; for each `trackId` call Audius to get track details + stream URL (or use existing `getStreamEndpointUrl` + artwork).
  - Map to `PlayableTrack` (id, title, artist, duration, coverArtUrl, streamUrl).
  - If a track fails to load, skip it or show error (minimal: skip).

**3.3** Alternative (simplest): add `AudiusApiService.getTrackById(id): Observable<AudiusTrack | null>`. Then in the component that plays the playlist, loop over trackIds, call getTrackById, collect results, map to PlayableTrack using existing `getArtworkUrl` and `getStreamEndpointUrl`, then call `player.playQueue(playables, 0)`.

---

## Step 4: Routes and navigation

**4.1** Update `src/app/app.routes.ts`:

- Add route `{ path: 'playlists', loadComponent: () => import('./components/playlist-list/playlist-list.component').then(m => m.PlaylistListComponent) }`
- Add route `{ path: 'playlists/:id', loadComponent: () => import('./components/playlist-detail/playlist-detail.component').then(m => m.PlaylistDetailComponent) }`
- Place before `path: '**'`

**4.2** Add navigation link to playlists in the app (e.g. in `app.component.html` next to or instead of a single "Free Music" link, or a small nav: "Free Music" | "Playlists").

---

## Step 5: Playlist list page (component)

**5.1** Create `src/app/components/playlist-list/`:

- `playlist-list.component.ts`: standalone, inject `PlaylistService`, `Router`. Read `playlistsList()`. Methods: `createPlaylist()` (prompt for name or use inline input), `play(id)`, `rename(id)`, `delete(id)`, `navigateTo(id)`.
- Template: title "Playlists", "New playlist" button, list of playlists (name, track count, buttons: Open/Play, Rename, Delete).
- Style as needed (reuse app styles).

**5.2** "Play" on a playlist: resolve playlist tracks to `PlayableTrack[]` (Step 3), then `player.playQueue(playables, 0)`.

---

## Step 6: Playlist detail page (component)

**6.1** Create `src/app/components/playlist-detail/`:

- `playlist-detail.component.ts`: standalone, inject `PlaylistService`, `Router`, `ActivatedRoute`, `PlayerService`, `AudiusApiService`. On init, get `route.params` or `route.paramMap` and read `id`; get playlist with `playlistService.getPlaylist(id)`. If not found, redirect to `/playlists`. Show name (editable or rename button), list of track IDs. For display you can show just id or fetch track titles (minimal: show "Track: &lt;id&gt;" or fetch once and cache in component).
- Template: playlist name, "Play" button, list of tracks (each with remove button). Optional: "Back to playlists" link.
- "Play": same as Step 5 – resolve trackIds to PlayableTrack[] and call `player.playQueue(playables, 0)`.
- "Remove": `playlistService.removeTrack(playlistId, trackId)`.
- Optional: "Rename" and "Delete playlist" (delete then navigate to `/playlists`).

**6.2** Minimal display: show `trackId` for each row. Better: in detail component, load track info for each id (e.g. via AudiusApiService) and show title/artist; cache in component state.

---

## Step 7: Add "Add to playlist" from Free Music

**7.1** In Free Music (or in a shared way): add an "Add to playlist" control per track (e.g. a button or dropdown).

**7.2** Options:

- **A)** Dropdown "Add to playlist" that lists playlists; choosing one calls `playlistService.addTrack(playlistId, track.id)`.
- **B)** Modal/dialog: "Add to playlist" opens a list of playlists + "New playlist" option; on choose, add track and optionally show "Added to &lt;name&gt;".

**7.3** Implement option A: in `free-music.component` add a button/dropdown per track; inject `PlaylistService`; on select playlist, call `addTrack(selectedPlaylistId, track.id)`. If no playlists exist, show "Create a playlist first" or redirect to playlists.

---

## Step 8: Audius "get track by id"

**8.1** Check Audius API for endpoint like `GET /v1/tracks/{id}` or similar. Implement in `AudiusApiService`:

- `getTrackById(id: string): Observable<AudiusTrack | null>` – HTTP GET, map response to `AudiusTrack`, handle error (return null or throw).

**8.2** Use this in playlist-detail to show track titles and in "Play playlist" / "get playable tracks" to build `PlayableTrack[]`.

---

## Step 9: Testing and test plan

**9.1** Add to `TEST_PLAN.md`:

- PlaylistService: create, rename, delete, addTrack, removeTrack, load/save persistence.
- PlaylistListComponent: renders list, new playlist, play calls player with resolved tracks.
- PlaylistDetailComponent: renders tracks, play, remove track, back navigation.
- Free Music: "Add to playlist" adds track to selected playlist.

**9.2** Implement unit tests for `PlaylistService` (mock localStorage). Shallow tests for list and detail components (mock service, router, player).

---

## Step 10: README and polish

**10.1** Update `README.md`: add "Playlists" to features (create playlists, add tracks from Free Music, play a playlist).

**10.2** Optional: empty state for "No playlists yet" with link to create one; confirm before delete playlist.

---

## Implementation order (summary)

1. **Step 1** – Models and storage key  
2. **Step 8** – Audius getTrackById (needed for resolving tracks)  
3. **Step 2** – PlaylistService  
4. **Step 3** – Resolve playlist to PlayableTrack[] (in service or component)  
5. **Step 4** – Routes and nav link  
6. **Step 5** – Playlist list page  
7. **Step 6** – Playlist detail page  
8. **Step 7** – Add to playlist from Free Music  
9. **Step 9** – Tests and TEST_PLAN  
10. **Step 10** – README and polish  

---

## File checklist (minimal)

| File | Purpose |
|------|---------|
| `src/app/models/playlist.model.ts` | Playlist interface, storage key |
| `src/app/services/playlist.service.ts` | CRUD, localStorage |
| `src/app/services/audius-api.service.ts` | Add getTrackById (Step 8) |
| `src/app/app.routes.ts` | Routes for playlists, playlists/:id |
| `src/app/app.component.html` | Nav link to /playlists |
| `src/app/components/playlist-list/*` | List page |
| `src/app/components/playlist-detail/*` | Detail page |
| `src/app/components/free-music/*` | Add to playlist UI |
| `TEST_PLAN.md` | New test cases |
| `README.md` | Playlists feature |

You can implement in this order; each step builds on the previous one.
