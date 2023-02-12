import LastFMTyped from 'lastfm-typed';
import * as R from 'ramda';
import type { Input } from 'src/input';

import type { Section } from '../section';
import type {
  ConfigTimePeriod,
  ConfigUserInfoDisplayOption,
  LastFmDataRetrieverKey,
  ReadableTimePeriod,
  ReadableUserInfoDisplayOption,
} from './types';

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

export const userInfoDisplayOptions = new Map<
  ConfigUserInfoDisplayOption,
  ReadableUserInfoDisplayOption
>([
  ['registered', 'Registered'],
  ['playcount', 'Playcount'],
  ['artistCount', 'Artists'],
  ['albumCount', 'Albums'],
  ['trackCount', 'Tracks'],
]);

export function isValidDisplayOptions(
  options: ConfigUserInfoDisplayOption[],
): options is ConfigUserInfoDisplayOption[] {
  return options.every((option) => userInfoDisplayOptions.has(option));
}

export function readableDisplayOptions(
  options: ConfigUserInfoDisplayOption[],
): ReadableUserInfoDisplayOption[] {
  return options.map((option) => userInfoDisplayOptions.get(option)!);
}

const lastFMDataMethods = {
  RecentTracks: (lastfm: LastFMTyped, user: string, section: Section) =>
    lastfm.user.getRecentTracks(user, {
      limit: section.config.rows ?? 8,
      extended: true,
    }),
  TopArtists: (lastfm: LastFMTyped, user: string, section: Section) =>
    lastfm.user.getTopArtists(user, {
      limit: section.config.rows ?? 8,
      period: section.config.period ?? '7day',
    }),
  TopTracks: (lastfm: LastFMTyped, user: string, section: Section) =>
    lastfm.user.getTopTracks(user, {
      limit: section.config.rows ?? 8,
      period: section.config.period ?? '7day',
    }),
  TopAlbums: (lastfm: LastFMTyped, user: string, section: Section) =>
    lastfm.user.getTopAlbums(user, {
      limit: section.config.rows ?? 8,
      period: section.config.period ?? '7day',
    }),
  UserInfo: (lastfm: LastFMTyped, user: string, section: Section) => {
    const displayOptions = section.config.display || [
      'registered',
      'playcount',
      'artistCount',
      'albumCount',
      'trackCount',
    ];

    return lastfm.user.getInfo(user).then((info) => {
      const filteredInfo = R.pick(displayOptions, info);
      return R.fromPairs(
        Object.entries(filteredInfo).map(([key, value]) => {
          return [
            userInfoDisplayOptions.get(key as ConfigUserInfoDisplayOption)!,
            value,
          ];
        }),
      );
    });
  },
};

export async function getLastFMData<T extends LastFmDataRetrieverKey>(
  type: T,
  input: Input,
  section: Section,
): Promise<ReturnType<(typeof lastFMDataMethods)[T]>> {
  const lastfm = new LastFMTyped(input.lastfm_api_key);
  return lastFMDataMethods[type](lastfm, input.lastfm_user, section) as Promise<
    ReturnType<(typeof lastFMDataMethods)[T]>
  >;
}
