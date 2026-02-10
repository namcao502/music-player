/**
 * Format duration in seconds to MM:SS format
 * @param seconds Duration in seconds
 * @returns Formatted duration string (e.g., "3:45")
 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
