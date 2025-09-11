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
 * Immutable mapping from Last.fm API time period codes to human-readable labels.
 * Used for generating section titles and user-friendly period descriptions.
 */
const timePeriods: ReadonlyMap<ConfigTimePeriod, ReadableTimePeriod> = new Map([
  [ConfigTimePeriod['7day'], 'Past Week'],
  [ConfigTimePeriod['1month'], 'Past Month'],
  [ConfigTimePeriod['3month'], 'Past 3 Months'],
  [ConfigTimePeriod['6month'], 'Past 6 Months'],
  [ConfigTimePeriod['12month'], 'Past Year'],
  [ConfigTimePeriod['overall'], 'All Time'],
]);

/**
 * Converts a section's time period configuration to a human-readable format.
 * Provides fallback to 'Past Week' if period is not specified or invalid.
 *
 * @param section - The section configuration containing the period
 * @returns Human-readable time period string suitable for display
 */
export function readableTimePeriod(section: Section): ReadableTimePeriod {
  const period = section.config.period ?? '7day';
  return timePeriods.get(ConfigTimePeriod[period]) ?? 'Past Week';
}

/**
 * Mapping from internal user info option keys to display-friendly labels.
 * Used when rendering user information sections in the README.
 */
export const userInfoDisplayOptions: ReadonlyMap<
  ConfigUserInfoDisplayOption,
  ReadableUserInfoDisplayOption
> = new Map([
  [ConfigUserInfoDisplayOption.registered, 'Registered'],
  [ConfigUserInfoDisplayOption.playcount, 'Playcount'],
  [ConfigUserInfoDisplayOption.artistCount, 'Artists'],
  [ConfigUserInfoDisplayOption.albumCount, 'Albums'],
  [ConfigUserInfoDisplayOption.trackCount, 'Tracks'],
]);

/**
 * Type-safe mapping of Last.fm data retrieval methods.
 * Each method is configured to handle specific section requirements and API parameters.
 */
const lastFMDataMethods = {
  /**
   * Retrieves recent tracks for the specified user.
   * @param lastfm - Configured Last.fm API client
   * @param input - GitHub action input containing user preferences
   * @param section - Section configuration for limits and display options
   * @returns Promise resolving to recent tracks data
   */
  RecentTracks: (
    lastfm: LastFMTyped,
    input: GithubActionInput,
    section: Section,
  ) =>
    lastfm.user.getRecentTracks(input.lastfm_user, {
      limit: section.config.rows ?? 8,
      extended: true,
    }),

  /**
   * Retrieves top artists for the specified user and time period.
   * @param lastfm - Configured Last.fm API client
   * @param input - GitHub action input containing user preferences
   * @param section - Section configuration for limits and time period
   * @returns Promise resolving to top artists data
   */
  TopArtists: (
    lastfm: LastFMTyped,
    input: GithubActionInput,
    section: Section,
  ) =>
    lastfm.user.getTopArtists(input.lastfm_user, {
      limit: section.config.rows ?? 8,
      period: section.config.period ?? '7day',
    }),

  /**
   * Retrieves top tracks for the specified user and time period.
   * @param lastfm - Configured Last.fm API client
   * @param input - GitHub action input containing user preferences
   * @param section - Section configuration for limits and time period
   * @returns Promise resolving to top tracks data
   */
  TopTracks: (
    lastfm: LastFMTyped,
    input: GithubActionInput,
    section: Section,
  ) =>
    lastfm.user.getTopTracks(input.lastfm_user, {
      limit: section.config.rows ?? 8,
      period: section.config.period ?? '7day',
    }),

  /**
   * Retrieves top albums for the specified user and time period.
   * @param lastfm - Configured Last.fm API client
   * @param input - GitHub action input containing user preferences
   * @param section - Section configuration for limits and time period
   * @returns Promise resolving to top albums data
   */
  TopAlbums: (
    lastfm: LastFMTyped,
    input: GithubActionInput,
    section: Section,
  ) =>
    lastfm.user.getTopAlbums(input.lastfm_user, {
      limit: section.config.rows ?? 8,
      period: section.config.period ?? '7day',
    }),

  /**
   * Retrieves and formats user profile information.
   * Applies locale-specific formatting and filtering based on display options.
   * @param lastfm - Configured Last.fm API client
   * @param input - GitHub action input containing user preferences and locale
   * @param section - Section configuration for display options
   * @returns Promise resolving to formatted user information
   */
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
 * Generic function to fetch Last.fm data based on the specified retriever type.
 * Provides type-safe access to different Last.fm API endpoints with proper error handling.
 *
 * @template T - The specific Last.fm data retriever key type
 * @param type - The type of data to retrieve (RecentTracks, TopArtists, etc.)
 * @param input - GitHub action input containing API key and user preferences
 * @param section - Section configuration defining limits, periods, and display options
 * @returns Promise resolving to the retrieved and formatted Last.fm data
 * @throws Error if the retriever key is invalid or API request fails
 *
 * @example
 * ```typescript
 * const tracks = await getLastFMData('TopTracks', input, section);
 * const userInfo = await getLastFMData('UserInfo', input, section);
 * ```
 */
export async function getLastFMData<T extends LastFmDataRetrieverKey>(
  type: T,
  input: GithubActionInput,
  section: Section,
): Promise<ReturnType<(typeof lastFMDataMethods)[T]>> {
  const lastfm = new LastFMTyped(input.lastfm_api_key);

  if (!(type in lastFMDataMethods)) {
    throw new Error(
      `Invalid data retriever key: ${type}. Valid keys are: ${Object.keys(lastFMDataMethods).join(', ')}`,
    );
  }

  try {
    return await (lastFMDataMethods[type](lastfm, input, section) as Promise<
      ReturnType<(typeof lastFMDataMethods)[T]>
    >);
  } catch (error) {
    throw new Error(
      `Failed to fetch ${type} data from Last.fm: ${(error as Error).message}`,
    );
  }
}
