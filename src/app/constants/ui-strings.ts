/**
 * Centralized UI strings for the music player app.
 * All user-facing text is managed here for consistency and easy updates.
 */

// ── Navigation ──────────────────────────────────────────────────────────
export const NAV = {
  FREE_MUSIC: 'Free Music',
  TRENDING: 'Trending',
  PLAYLISTS: 'Playlists',
  FAVORITES: 'Favorites',
  HISTORY: 'History',
  STATS: 'Stats',
} as const;

// ── Theme (for toggle button) ────────────────────────────────────────────
export const THEME = {
  SWITCH_TO_LIGHT: 'Switch to light theme',
  SWITCH_TO_DARK: 'Switch to dark theme',
} as const;

// ── Page titles & subtitles ─────────────────────────────────────────────
export const PAGE = {
  FREE_MUSIC_TITLE: 'Free Music',
  FREE_MUSIC_SUBTITLE: 'Search and play royalty-free tracks from Audius (no copyright)',
  TRENDING_TITLE: 'Trending',
  TRENDING_SUBTITLE: 'Top tracks on Audius right now',
  PLAYLISTS_TITLE: 'Playlists',
  PLAYLISTS_SUBTITLE: 'Create playlists and add tracks from Free Music.',
  FAVORITES_TITLE: 'Favorites',
  FAVORITES_SUBTITLE: 'Your liked tracks',
  HISTORY_TITLE: 'Play History',
  HISTORY_SUBTITLE: 'Your recently played tracks',
  ARTIST_FALLBACK: 'Artist',
  STATS_TITLE: 'Your Stats',
  STATS_SUBTITLE: 'Listening statistics',
} as const;

// ── Buttons ─────────────────────────────────────────────────────────────
export const BTN = {
  SEARCH: 'Search',
  CLEAR: 'Clear',
  CLEAR_RECENT_SEARCHES: 'Clear recent searches',
  PLAY: 'Play',
  SHARE_TRACK: 'Share track',
  PLAY_ALL: 'Play all',
  RENAME: 'Rename',
  EXPORT: 'Export',
  IMPORT: 'Import',
  DELETE_PLAYLIST: 'Delete playlist',
  NEW_PLAYLIST: 'New playlist',
  CREATE_NEW_PLAYLIST: 'Create new playlist',
  CLEAR_HISTORY: 'Clear history',
  BACK_PLAYLISTS: '← Playlists',
  BACK: '← Back',
  OK: 'OK',
  CANCEL: 'Cancel',
  DISMISS: 'Dismiss',
  DELETE: 'Delete',
  REMOVE_TAG: 'Remove tag',
  MANAGE_TAGS: 'Manage tags',
  DRAG_REORDER: 'Drag to reorder',
  REMOVE_FROM_PLAYLIST: 'Remove from playlist',
  PREV_PAGE: '‹ Previous',
  NEXT_PAGE: 'Next ›',
  QUEUE: 'Queue',
  SLEEP_TIMER: 'Sleep timer',
  PAUSE: 'Pause',
  PREVIOUS: 'Previous',
  NEXT: 'Next',
  SEEK: 'Seek',
  VOLUME: 'Volume',
  MUTE: 'Mute',
  UNMUTE: 'Unmute',
  SHUFFLE: 'Shuffle',
  LOOP: 'Loop',
  CLEAR_QUEUE: 'Clear queue',
  CLOSE_QUEUE: 'Close queue',
  SHOW_QUEUE: 'Show queue',
  HIDE_QUEUE: 'Hide queue',
  PLAYBACK_SPEED: 'Playback speed',
  TOGGLE_VISUALIZER: 'Toggle visualizer',
  TOGGLE_MINI_PLAYER: 'Toggle mini player',
  EXPAND_PLAYER: 'Expand player',
  CROSSFADE_DURATION: 'Crossfade duration',
  SLEEP_TIMER_CANCEL: 'Cancel',
  SEEK_BACK: 'Seek back 10 s',
  SEEK_FORWARD: 'Seek forward 10 s',
  REMOVE_FROM_QUEUE: 'Remove from queue',
  REMOVE_FROM_HISTORY: 'Remove from history',
  DUPLICATE: 'Duplicate',
  ADD_TO_QUEUE: 'Add to queue',
  SHARE_PLAYLIST: 'Share playlist',
} as const;

// ── Empty states ────────────────────────────────────────────────────────
export const EMPTY = {
  FREE_MUSIC: 'Enter a search term and click Search to find free music.',
  TRENDING: 'No trending tracks available.',
  PLAYLISTS: 'No playlists yet. Create one to get started.',
  PLAYLISTS_TAG_FILTER: 'No playlists match this tag.',
  PLAYLISTS_NO_PLAYLISTS: 'No playlists yet.',
  PLAYLIST_DETAIL: 'No tracks. Add tracks from Free Music.',
  FAVORITES: 'No favorites yet. Tap the heart icon on any track to add it here.',
  HISTORY: 'No play history yet. Start playing some music!',
  ARTIST: 'No tracks found for this artist.',
  QUEUE: 'No tracks in queue',
  FILTER_NO_RESULTS: 'No tracks match your filter.',
  STATS: 'No listening data yet. Start playing some music!',
} as const;

// ── Loading messages ────────────────────────────────────────────────────
export const LOADING = {
  SEARCHING: 'Searching…',
  TRENDING: 'Loading trending tracks…',
  TRACKS: 'Loading tracks…',
  FAVORITES: 'Loading favorites…',
} as const;

// ── Error messages ──────────────────────────────────────────────────────
export const ERROR = {
  SEARCH_FAILED: 'Search failed. Try again.',
  TRENDING_FAILED: 'Failed to load trending tracks. Please try again.',
  INVALID_PLAYLIST_FILE: 'Invalid playlist file.',
  FILE_READ_FAILED: 'Failed to read file.',
  UNKNOWN_ARTIST: 'Unknown Artist',
} as const;

// ── Toast notification messages ─────────────────────────────────────────
export const TOAST = {
  // Favorites
  ADDED_TO_FAVORITES: 'Added to favorites',
  REMOVED_FROM_FAVORITES: 'Removed from favorites',
  FAVORITES_SAVE_FAILED: 'Failed to save favorites. Storage may be full.',

  // Playlists
  PLAYLIST_CREATED: (name: string) => `Playlist "${name}" created`,
  PLAYLIST_RENAMED: 'Playlist renamed',
  PLAYLIST_DELETED: (name: string) => `"${name}" deleted`,
  PLAYLIST_DELETED_GENERIC: 'Playlist deleted',
  PLAYLIST_EXPORTED: 'Playlist exported',
  PLAYLIST_IMPORTED: (name: string) => `Playlist "${name}" imported`,
  PLAYLIST_IMPORT_FAILED: 'Invalid playlist file',
  PLAYLIST_SAVE_FAILED: 'Failed to save playlists. Storage may be full.',
  ADDED_TO_PLAYLIST: (name: string) => `Added to "${name}"`,
  TRACK_ALREADY_IN_PLAYLIST: 'Track is already in this playlist',
  TRACK_REMOVED_FROM_PLAYLIST: 'Track removed from playlist',

  // Queue
  QUEUE_CLEARED: 'Queue cleared',
  REMOVED_FROM_QUEUE: 'Removed from queue',

  // Sleep Timer
  SLEEP_TIMER_SET: (minutes: number) => `Sleep timer set for ${minutes} min`,
  SLEEP_TIMER_ENDED: 'Sleep timer ended — playback paused',
  SLEEP_TIMER_CANCELLED: 'Sleep timer cancelled',

  // History
  HISTORY_CLEARED: 'History cleared',
  REMOVED_FROM_HISTORY: 'Removed from history',
  HISTORY_SAVE_FAILED: 'Failed to save history. Storage may be full.',

  // Playlist duplicate
  PLAYLIST_DUPLICATED: (name: string) => `Playlist "${name}" duplicated`,

  // Share
  TRACK_LINK_COPIED: 'Track link copied to clipboard!',
  TRACK_LINK_COPY_FAILED: 'Failed to copy link.',

  // Queue
  ADDED_TO_QUEUE: 'Added to queue',

  // Playlist share
  PLAYLIST_LINK_COPIED: 'Playlist link copied to clipboard!',
  PLAYLIST_LINK_COPY_FAILED: 'Failed to copy playlist link.',
} as const;

// ── Section headers ─────────────────────────────────────────────────────
export const SECTION = {
  RESULTS: 'Results',
  ADD_TO_PLAYLIST: 'Add to playlist',
  UP_NEXT: 'Up next',
  TAGS: 'Tags',
  RECENT_ARTISTS: 'Recent Artists',
} as const;

// ── Labels ──────────────────────────────────────────────────────────────
// Used for heart button aria-label/title (add vs remove)
export const LABEL_FAVORITES = {
  ADD: 'Add to favorites',
  REMOVE: 'Remove from favorites',
} as const;

export const LABEL = {
  RECENT: 'Recent:',
  SORT: 'Sort:',
  FILTER: 'Filter:',
  PAGE: 'Page',
  CROSSFADE: 'Crossfade',
  SLEEP: 'Sleep:',
  ALL: 'All',
} as const;

// ── Sort options ────────────────────────────────────────────────────────
export const SORT = {
  DEFAULT: 'Default',
  DURATION_ASC: 'Duration (short first)',
  DURATION_DESC: 'Duration (long first)',
  ARTIST: 'Artist name',
  DATE: 'Date',
  TITLE: 'Title',
  NAME: 'Name',
  TRACK_COUNT: 'Track count',
} as const;

// ── Sleep timer options ─────────────────────────────────────────────────
export const SLEEP_TIMER = {
  MIN_15: '15 min',
  MIN_30: '30 min',
  MIN_60: '60 min',
} as const;

// ── Confirmation dialogs ────────────────────────────────────────────────
export const CONFIRM = {
  DELETE_PLAYLIST: (name: string) => `Delete "${name}"?`,
  PLAYLIST_NAME_PROMPT: 'Playlist name',
  RENAME_PROMPT: 'Rename playlist',
  NEW_PLAYLIST_DEFAULT: 'New playlist',
  NEW_PLAYLIST_NAME_PROMPT: 'New playlist name',
} as const;

// ── Placeholder text ────────────────────────────────────────────────────
export const PLACEHOLDER = {
  SEARCH: 'Search tracks, artists...',
  FILTER_TRACKS: 'Filter by title or artist...',
} as const;

// ── Pagination ──────────────────────────────────────────────────────────
export const PAGINATION = {
  ONE_PAGE_HINT: (count: number) => `(one page — ${count} results)`,
} as const;

// ── Pluralization helpers ───────────────────────────────────────────────
export const PLURAL = {
  TRACKS: (count: number) => `${count} track${count === 1 ? '' : 's'}`,
} as const;

// ── Stats dashboard ─────────────────────────────────────────────────────
export const STATS = {
  TOTAL_TRACKS_PLAYED: 'Total Tracks Played',
  UNIQUE_TRACKS: 'Unique Tracks',
  UNIQUE_ARTISTS: 'Unique Artists',
  TOTAL_LISTENING_TIME: 'Total Listening Time',
  TOP_TRACKS: 'Most Played Tracks',
  TOP_ARTISTS: 'Most Played Artists',
  NO_DATA: 'No listening data yet. Start playing some music!',
  PLAYS: (count: number) => `${count} play${count === 1 ? '' : 's'}`,
} as const;
