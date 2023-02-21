import { format as dateFormat } from 'date-fns';
import LastFMTyped from 'lastfm-typed';
import * as R from 'ramda';
import type { Input } from 'src/input';
import { z } from 'zod';

import type { Section } from '../section';
import {
  ConfigTimePeriod,
  ConfigUserInfoDisplayOption,
  LastFmDataRetrieverKey,
  ReadableTimePeriod,
  ReadableUserInfoDisplayOption,
} from './types';

const timePeriods = new Map<ConfigTimePeriod, ReadableTimePeriod>([
  [ConfigTimePeriod['7day'], 'Past Week'],
  [ConfigTimePeriod['1month'], 'Past Month'],
  [ConfigTimePeriod['3month'], 'Past 3 Months'],
  [ConfigTimePeriod['6month'], 'Past 6 Months'],
  [ConfigTimePeriod['12month'], 'Past Year'],
  [ConfigTimePeriod['overall'], 'All Time'],
]);

export function readableTimePeriod(section: Section): ReadableTimePeriod {
  const period = section.config.period || '7day';
  return timePeriods.get(ConfigTimePeriod[period])!;
}

const lastFMDataMethods = {
  RecentTracks: (lastfm: LastFMTyped, input: Input, section: Section) =>
    lastfm.user.getRecentTracks(input.lastfm_user, {
      limit: section.config.rows ?? 8,
      extended: true,
    }),
  TopArtists: (lastfm: LastFMTyped, input: Input, section: Section) =>
    lastfm.user.getTopArtists(input.lastfm_user, {
      limit: section.config.rows ?? 8,
      period: section.config.period ?? '7day',
    }),
  TopTracks: (lastfm: LastFMTyped, input: Input, section: Section) =>
    lastfm.user.getTopTracks(input.lastfm_user, {
      limit: section.config.rows ?? 8,
      period: section.config.period ?? '7day',
    }),
  TopAlbums: (lastfm: LastFMTyped, input: Input, section: Section) =>
    lastfm.user.getTopAlbums(input.lastfm_user, {
      limit: section.config.rows ?? 8,
      period: section.config.period ?? '7day',
    }),
  UserInfo: (lastfm: LastFMTyped, input: Input, section: Section) => {
    const displayOptions =
      section.config.display || Object.values(ConfigUserInfoDisplayOption);
    const numberFormat = new Intl.NumberFormat(input.locale);

    return lastfm.user.getInfo(input.lastfm_user).then((info) => {
      const filteredInfo = R.pick(displayOptions, info);

      const UserInfoSchema = z
        .object({
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
        })
        .transform((result) => {
          return {
            Registered: result.registered,
            Playcount: result.playcount,
            Artists: result.artistCount,
            Albums: result.albumCount,
            Tracks: result.trackCount,
          };
        });

      const parsedInfo = UserInfoSchema.safeParse(filteredInfo);
      if (!parsedInfo.success) {
        throw new Error(parsedInfo.error.message);
      }

      return R.fromPairs(
        Object.entries(
          R.pickBy(Boolean, parsedInfo.data) as Record<
            ReadableUserInfoDisplayOption,
            string
          >,
        ),
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
  return lastFMDataMethods[type](lastfm, input, section) as Promise<
    ReturnType<(typeof lastFMDataMethods)[T]>
  >;
}
