import type { ArtistOptionalMBID } from 'lastfm-typed/dist/interfaces/shared';

/**
 * Enumeration of available time periods for Last.fm data aggregation.
 * These correspond to the time periods supported by the Last.fm API.
 */
export enum ConfigTimePeriod {
  /** Past 7 days */
  '7day' = '7day',
  /** Past month */
  '1month' = '1month',
  /** Past 3 months */
  '3month' = '3month',
  /** Past 6 months */
  '6month' = '6month',
  /** Past 12 months */
  '12month' = '12month',
  /** All time data */
  'overall' = 'overall',
}

/**
 * Human-readable representations of time periods for display purposes.
 */
export type ReadableTimePeriod =
  | 'Past Week'
  | 'Past Month'
  | 'Past 3 Months'
  | 'Past 6 Months'
  | 'Past Year'
  | 'All Time';

/**
 * Keys representing different types of Last.fm data retrievers.
 * Used for type-safe data fetching operations.
 */
export type LastFmDataRetrieverKey =
  | 'RecentTracks'
  | 'TopArtists'
  | 'TopTracks'
  | 'TopAlbums'
  | 'UserInfo';

/**
 * Interface representing a Last.fm album with associated metadata.
 */
export interface Album {
  /** Artist information including name and Last.fm URL */
  artist: { url: string; name: string };
  /** Last.fm URL for the album */
  url: string;
  /** Album name */
  name: string;
  /** Number of plays/scrobbles */
  playcount: number;
}

/**
 * Interface representing a Last.fm artist with play statistics.
 */
export interface Artist {
  /** Artist name */
  name: string;
  /** Last.fm URL for the artist */
  url: string;
  /** Number of plays/scrobbles */
  playcount: number;
}

/**
 * Interface representing a Last.fm track with associated metadata.
 */
export interface Track {
  /** Track name */
  name: string;
  /** Artist information with optional MusicBrainz ID */
  artist: ArtistOptionalMBID;
  /** Last.fm URL for the track */
  url: string;
  /** Number of plays/scrobbles */
  playcount: number;
}

/**
 * Interface representing a recently played track with timestamp information.
 * Unlike Track, this doesn't include playcount as it's not provided by recent tracks API.
 */
export interface RecentTrack {
  /** Track name */
  name: string;
  /** Artist information for recent tracks (url may not always be present) */
  artist: {
    /** Artist name */
    name: string;
    /** Last.fm URL for the artist (optional for recent tracks) */
    url?: string;
    /** MusicBrainz ID for the artist (optional) */
    mbid?: string;
  };
  /** Last.fm URL for the track */
  url: string;
  /** Timestamp information for when the track was played */
  date: { uts: number };
}

/**
 * Type representing user information with configurable display options.
 * Maps display options to their corresponding string values.
 */
export type UserInfo = { [key in ConfigUserInfoDisplayOption]: string };

/**
 * Enumeration of available user information display options.
 * These control which user statistics are shown in the user info section.
 */
export enum ConfigUserInfoDisplayOption {
  /** Account registration date */
  'registered' = 'registered',
  /** Total play count across all time */
  'playcount' = 'playcount',
  /** Number of different artists listened to */
  'artistCount' = 'artistCount',
  /** Number of different albums listened to */
  'albumCount' = 'albumCount',
  /** Number of different tracks listened to */
  'trackCount' = 'trackCount',
}

/**
 * Human-readable labels for user information display options.
 */
export type ReadableUserInfoDisplayOption =
  | 'Registered'
  | 'Playcount'
  | 'Artists'
  | 'Albums'
  | 'Tracks';
