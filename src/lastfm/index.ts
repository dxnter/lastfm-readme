import { format as dateFormat } from 'date-fns';
import LastFMTyped from 'lastfm-typed';
import * as R from 'ramda';
import type { GithubActionInput } from 'src/input';
import { z } from 'zod';

import type { Section } from '../section';
import {
  ConfigTimePeriod,
  ConfigUserInfoDisplayOption,
  type LastFmDataRetrieverKey,
  type ReadableTimePeriod,
  type ReadableUserInfoDisplayOption,
} from './types';

/**
 * Map Last.fm API time periods to readable format.
 */
const timePeriods = new Map<ConfigTimePeriod, ReadableTimePeriod>([
  [ConfigTimePeriod['7day'], 'Past Week'],
  [ConfigTimePeriod['1month'], 'Past Month'],
  [ConfigTimePeriod['3month'], 'Past 3 Months'],
  [ConfigTimePeriod['6month'], 'Past 6 Months'],
  [ConfigTimePeriod['12month'], 'Past Year'],
  [ConfigTimePeriod['overall'], 'All Time'],
]);

/**
 * Retrieves a human-readable time period for the provided section configuration.
 * @param section - The section object containing the configuration.
 * @returns ReadableTimePeriod
 */
export function readableTimePeriod(section: Section): ReadableTimePeriod {
  const period = section.config.period ?? '7day';
  return timePeriods.get(ConfigTimePeriod[period]) ?? 'Past Week';
}

export const userInfoDisplayOptions = new Map<
  ConfigUserInfoDisplayOption,
  ReadableUserInfoDisplayOption
>([
  [ConfigUserInfoDisplayOption.registered, 'Registered'],
  [ConfigUserInfoDisplayOption.playcount, 'Playcount'],
  [ConfigUserInfoDisplayOption.artistCount, 'Artists'],
  [ConfigUserInfoDisplayOption.albumCount, 'Albums'],
  [ConfigUserInfoDisplayOption.trackCount, 'Tracks'],
]);

const lastFMDataMethods = {
  RecentTracks: (
    lastfm: LastFMTyped,
    input: GithubActionInput,
    section: Section,
  ) =>
    lastfm.user.getRecentTracks(input.lastfm_user, {
      limit: section.config.rows ?? 8,
      extended: true,
    }),
  TopArtists: (
    lastfm: LastFMTyped,
    input: GithubActionInput,
    section: Section,
  ) =>
    lastfm.user.getTopArtists(input.lastfm_user, {
      limit: section.config.rows ?? 8,
      period: section.config.period ?? '7day',
    }),
  TopTracks: (
    lastfm: LastFMTyped,
    input: GithubActionInput,
    section: Section,
  ) =>
    lastfm.user.getTopTracks(input.lastfm_user, {
      limit: section.config.rows ?? 8,
      period: section.config.period ?? '7day',
    }),
  TopAlbums: (
    lastfm: LastFMTyped,
    input: GithubActionInput,
    section: Section,
  ) =>
    lastfm.user.getTopAlbums(input.lastfm_user, {
      limit: section.config.rows ?? 8,
      period: section.config.period ?? '7day',
    }),
  UserInfo: async (
    lastfm: LastFMTyped,
    input: GithubActionInput,
    section: Section,
  ) => {
    const displayOptions =
      section.config.display ?? Object.values(ConfigUserInfoDisplayOption);
    const numberFormat = new Intl.NumberFormat(input.locale);

    try {
      const info = await lastfm.user.getInfo(input.lastfm_user);
      const filteredInfo = R.pick(
        displayOptions as (keyof typeof info)[],
        info,
      );

      const UserInfoSchema = z.object({
        registered: z
          .number()
          .transform((value) => dateFormat(value * 1000, input.date_format))
          .optional(),
        playcount: z
          .number()
          .transform((value) => numberFormat.format(value))
          .optional(),
        artistCount: z
          .number()
          .transform((value) => numberFormat.format(value))
          .optional(),
        albumCount: z
          .number()
          .transform((value) => numberFormat.format(value))
          .optional(),
        trackCount: z
          .number()
          .transform((value) => numberFormat.format(value))
          .optional(),
      });

      const parsedInfo = UserInfoSchema.parse(filteredInfo);

      return R.fromPairs(Object.entries(parsedInfo));
    } catch (error) {
      throw new Error(`Failed to fetch user info: ${(error as Error).message}`);
    }
  },
};

/**
 * Fetches data from Last.fm based on the specified type.
 * @param type - The type of data to retrieve.
 * @param input - User input parameters.
 * @param section - Section configuration for the request.
 * @returns The retrieved Last.fm data.
 */
export async function getLastFMData<T extends LastFmDataRetrieverKey>(
  type: T,
  input: GithubActionInput,
  section: Section,
): Promise<ReturnType<(typeof lastFMDataMethods)[T]>> {
  const lastfm = new LastFMTyped(input.lastfm_api_key);

  if (!(type in lastFMDataMethods)) {
    throw new Error(`Invalid data retriever key: ${type}`);
  }

  return lastFMDataMethods[type](lastfm, input, section) as Promise<
    ReturnType<(typeof lastFMDataMethods)[T]>
  >;
}
