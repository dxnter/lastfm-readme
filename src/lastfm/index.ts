import type { Section } from '../chart';
import type { ConfigTimePeriod, ReadableTimePeriod } from './types';
import LastFMTyped from 'lastfm-typed';
import type { Input } from 'src/input';
import type {
  getRecentTracks,
  getTopAlbums,
  getTopArtists,
  getTopTracks,
} from 'lastfm-typed/dist/interfaces/userInterface';

export const timePeriods = new Map<ConfigTimePeriod, ReadableTimePeriod>([
  ['7day', 'Past Week'],
  ['1month', 'Past Month'],
  ['3month', 'Past 3 Months'],
  ['6month', 'Past 6 Months'],
  ['12month', 'Past Year'],
  ['overall', 'All Time'],
]);

export const isValidTimePeriod = (
  timePeriod: ConfigTimePeriod,
): timePeriod is ConfigTimePeriod => timePeriods.has(timePeriod);

export function readableTimePeriod(section: Section): ReadableTimePeriod {
  const period = section.config.period || '7day';
  return timePeriods.get(period)!;
}

export async function getRecentTracks(
  input: Input,
  section: Section,
): Promise<getRecentTracks> {
  const lastfm = new LastFMTyped(input.lastfm_api_key);
  return lastfm.user.getRecentTracks(input.lastfm_user, {
    limit: section.config.rows ?? 8,
    extended: true,
  });
}

export async function getTopArtists(
  input: Input,
  section: Section,
): Promise<getTopArtists> {
  const lastfm = new LastFMTyped(input.lastfm_api_key);
  return lastfm.user.getTopArtists(input.lastfm_user, {
    limit: section.config.rows ?? 8,
    period: section.config.period ?? '7day',
  });
}

export async function getTopTracks(
  input: Input,
  section: Section,
): Promise<getTopTracks> {
  const lastfm = new LastFMTyped(input.lastfm_api_key);
  return lastfm.user.getTopTracks(input.lastfm_user, {
    limit: section.config.rows ?? 8,
    period: section.config.period ?? '7day',
  });
}

export async function getTopAlbums(
  input: Input,
  section: Section,
): Promise<getTopAlbums> {
  const lastfm = new LastFMTyped(input.lastfm_api_key);
  return lastfm.user.getTopAlbums(input.lastfm_user, {
    limit: section.config.rows ?? 8,
    period: section.config.period ?? '7day',
  });
}
