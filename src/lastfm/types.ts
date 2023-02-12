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

export type LastFmDataRetrieverKey =
  | 'RecentTracks'
  | 'TopArtists'
  | 'TopTracks'
  | 'TopAlbums'
  | 'UserInfo';

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

export interface UserInfo {
  playcount: number;
  registered: number;
  artistCount: number;
  albumCount: number;
  trackCount: number;
}

export type ConfigUserInfoDisplayOption =
  | 'registered'
  | 'playcount'
  | 'artistCount'
  | 'albumCount'
  | 'trackCount';

export type ReadableUserInfoDisplayOption =
  | 'Registered'
  | 'Playcount'
  | 'Artists'
  | 'Albums'
  | 'Tracks';
