import type { ArtistOptionalMBID } from 'lastfm-typed/dist/interfaces/shared';

export type ConfigTimePeriod =
  | '7day'
  | '1month'
  | '3month'
  | '6month'
  | '12month'
  | 'overall';

export type ReadableTimePeriod =
  | 'Past Week'
  | 'Past Month'
  | 'Past 3 Months'
  | 'Past 6 Months'
  | 'Past Year'
  | 'All Time';

export interface Album {
  artist: { url: string; name: string };
  url: string;
  name: string;
  playcount: number;
}

export interface Artist {
  name: string;
  url: string;
  playcount: number;
}

export interface Track {
  name: string;
  artist: ArtistOptionalMBID;
  url: string;
  playcount: number;
}

export interface RecentTrack extends Track {
  date: { uts: number };
}
