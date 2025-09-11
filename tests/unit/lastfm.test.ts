import LastFMTyped from 'lastfm-typed';
import type { GithubActionInput } from 'src/input';
import { getLastFMData, readableTimePeriod } from 'src/lastfm';
import {
  ConfigTimePeriod,
  ConfigUserInfoDisplayOption,
} from 'src/lastfm/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Section, SectionName } from '../../src/section';

describe('last.fm integration', () => {
  const mockInput: GithubActionInput = {
    lastfm_api_key: 'test-api-key',
    lastfm_user: 'test-user',
    gh_token: 'test-token',
    repository: { owner: 'test', repo: 'test' },
    commit_message: 'test',
    show_title: 'true',
    locale: 'en-US',
    date_format: 'MM/dd/yyyy',
  };

  const mockSection: Section = {
    name: SectionName.RECENT,
    start: '<!--START_LASTFM_RECENT-->',
    end: '<!--END_LASTFM_RECENT-->',
    content: [],
    currentSection: '',
    config: { rows: 5, period: '7day' as ConfigTimePeriod },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLastFMData', () => {
    it('should fetch recent tracks data', async () => {
      const mockTracks = {
        tracks: [
          {
            name: 'Test Track',
            artist: { name: 'Test Artist', url: 'https://test.com' },
            url: 'https://test-track.com',
            date: { uts: 1_640_995_200 },
          },
        ],
      };

      const mockLastFM = {
        user: {
          getRecentTracks: vi.fn().mockResolvedValue(mockTracks),
        },
      };

      vi.mocked(LastFMTyped).mockImplementation(
        () => mockLastFM as unknown as LastFMTyped,
      );

      const result = await getLastFMData(
        'RecentTracks',
        mockInput,
        mockSection,
      );

      expect(mockLastFM.user.getRecentTracks).toHaveBeenCalledWith(
        'test-user',
        {
          limit: 5,
          extended: true,
        },
      );
      expect(result).toEqual(mockTracks);
    });

    it('should fetch top artists data', async () => {
      const mockArtists = {
        artists: [
          { name: 'Test Artist', url: 'https://test.com', playcount: 100 },
        ],
      };

      const mockLastFM = {
        user: {
          getTopArtists: vi.fn().mockResolvedValue(mockArtists),
        },
      };

      vi.mocked(LastFMTyped).mockImplementation(
        () => mockLastFM as unknown as LastFMTyped,
      );

      const result = await getLastFMData('TopArtists', mockInput, mockSection);

      expect(mockLastFM.user.getTopArtists).toHaveBeenCalledWith('test-user', {
        limit: 5,
        period: '7day',
      });
      expect(result).toEqual(mockArtists);
    });

    it('should fetch top tracks data', async () => {
      const mockTracks = {
        tracks: [
          {
            name: 'Test Track',
            artist: { name: 'Test Artist', url: 'https://test.com' },
            url: 'https://test-track.com',
            playcount: 50,
          },
        ],
      };

      const mockLastFM = {
        user: {
          getTopTracks: vi.fn().mockResolvedValue(mockTracks),
        },
      };

      vi.mocked(LastFMTyped).mockImplementation(
        () => mockLastFM as unknown as LastFMTyped,
      );

      const result = await getLastFMData('TopTracks', mockInput, mockSection);

      expect(mockLastFM.user.getTopTracks).toHaveBeenCalledWith('test-user', {
        limit: 5,
        period: '7day',
      });
      expect(result).toEqual(mockTracks);
    });

    it('should fetch top albums data', async () => {
      const mockAlbums = {
        albums: [
          {
            name: 'Test Album',
            artist: { name: 'Test Artist', url: 'https://test.com' },
            url: 'https://test-album.com',
            playcount: 25,
          },
        ],
      };

      const mockLastFM = {
        user: {
          getTopAlbums: vi.fn().mockResolvedValue(mockAlbums),
        },
      };

      vi.mocked(LastFMTyped).mockImplementation(
        () => mockLastFM as unknown as LastFMTyped,
      );

      const result = await getLastFMData('TopAlbums', mockInput, mockSection);

      expect(mockLastFM.user.getTopAlbums).toHaveBeenCalledWith('test-user', {
        limit: 5,
        period: '7day',
      });
      expect(result).toEqual(mockAlbums);
    });

    it('should fetch and format user info data', async () => {
      const mockUserInfo = {
        registered: 1_577_836_800,
        playcount: 1000,
        artistCount: 500,
        albumCount: 300,
        trackCount: 2000,
      };

      const mockLastFM = {
        user: {
          getInfo: vi.fn().mockResolvedValue(mockUserInfo),
        },
      };

      vi.mocked(LastFMTyped).mockImplementation(
        () => mockLastFM as unknown as LastFMTyped,
      );

      const userInfoSection: Section = {
        ...mockSection,
        name: SectionName.USER_INFO,
        config: {
          display: [
            ConfigUserInfoDisplayOption.registered,
            ConfigUserInfoDisplayOption.playcount,
          ],
        },
      };

      const result = await getLastFMData(
        'UserInfo',
        mockInput,
        userInfoSection,
      );

      expect(mockLastFM.user.getInfo).toHaveBeenCalledWith('test-user');

      // The result should be formatted data
      expect(result).toHaveProperty('registered');
      expect(result).toHaveProperty('playcount', '1,000');
    });

    it('should use default values for missing config', async () => {
      const sectionWithoutConfig = {
        ...mockSection,
        config: {},
      };

      const mockLastFM = {
        user: {
          getRecentTracks: vi.fn().mockResolvedValue({ tracks: [] }),
        },
      };

      vi.mocked(LastFMTyped).mockImplementation(
        () => mockLastFM as unknown as LastFMTyped,
      );

      await getLastFMData('RecentTracks', mockInput, sectionWithoutConfig);

      expect(mockLastFM.user.getRecentTracks).toHaveBeenCalledWith(
        'test-user',
        {
          limit: 8, // default value
          extended: true,
        },
      );
    });

    it('should throw error for invalid data retriever key', async () => {
      await expect(
        getLastFMData('InvalidKey' as 'RecentTracks', mockInput, mockSection),
      ).rejects.toThrow('Invalid data retriever key: InvalidKey');
    });

    it('should handle API errors gracefully', async () => {
      const mockLastFM = {
        user: {
          getRecentTracks: vi.fn().mockRejectedValue(new Error('API Error')),
        },
      };

      vi.mocked(LastFMTyped).mockImplementation(
        () => mockLastFM as unknown as LastFMTyped,
      );

      await expect(
        getLastFMData('RecentTracks', mockInput, mockSection),
      ).rejects.toThrow('API Error');
    });
  });

  describe('readableTimePeriod', () => {
    it('should return correct readable periods', () => {
      const testCases = [
        { config: { period: ConfigTimePeriod['7day'] }, expected: 'Past Week' },
        {
          config: { period: ConfigTimePeriod['1month'] },
          expected: 'Past Month',
        },
        {
          config: { period: ConfigTimePeriod['3month'] },
          expected: 'Past 3 Months',
        },
        {
          config: { period: ConfigTimePeriod['6month'] },
          expected: 'Past 6 Months',
        },
        {
          config: { period: ConfigTimePeriod['12month'] },
          expected: 'Past Year',
        },
        {
          config: { period: ConfigTimePeriod['overall'] },
          expected: 'All Time',
        },
      ];

      for (const { config, expected } of testCases) {
        const section = { ...mockSection, config };
        expect(readableTimePeriod(section)).toBe(expected);
      }
    });

    it('should return default period when none specified', () => {
      const sectionWithoutPeriod = { ...mockSection, config: {} };
      expect(readableTimePeriod(sectionWithoutPeriod)).toBe('Past Week');
    });

    it('should return default period for invalid period', () => {
      const sectionWithInvalidPeriod = {
        ...mockSection,
        config: { period: 'invalid' as ConfigTimePeriod },
      };
      expect(readableTimePeriod(sectionWithInvalidPeriod)).toBe('Past Week');
    });
  });

  describe('userInfo data processing', () => {
    it('should handle user info fetch errors', async () => {
      const mockLastFM = {
        user: {
          getInfo: vi.fn().mockRejectedValue(new Error('User not found')),
        },
      };

      vi.mocked(LastFMTyped).mockImplementation(
        () => mockLastFM as unknown as LastFMTyped,
      );

      const userInfoSection: Section = {
        ...mockSection,
        name: SectionName.USER_INFO,
        config: {},
      };

      await expect(
        getLastFMData('UserInfo', mockInput, userInfoSection),
      ).rejects.toThrow('Failed to fetch user info: User not found');
    });

    it('should format dates according to input format', async () => {
      const mockUserInfo = {
        registered: 1_609_459_200,
      };

      const mockLastFM = {
        user: {
          getInfo: vi.fn().mockResolvedValue(mockUserInfo),
        },
      };

      vi.mocked(LastFMTyped).mockImplementation(
        () => mockLastFM as unknown as LastFMTyped,
      );

      const customDateFormatInput = {
        ...mockInput,
        date_format: 'yyyy-MM-dd',
      };

      const userInfoSection: Section = {
        ...mockSection,
        name: SectionName.USER_INFO,
        config: { display: [ConfigUserInfoDisplayOption.registered] },
      };

      const result = await getLastFMData(
        'UserInfo',
        customDateFormatInput,
        userInfoSection,
      );

      // Should be formatted as yyyy-MM-dd
      expect(result.registered).toMatch(/202[01]-[0-1][0-9]-[0-3][0-9]/);
    });

    it('should format numbers according to locale', async () => {
      const mockUserInfo = {
        playcount: 12_345,
      };

      const mockLastFM = {
        user: {
          getInfo: vi.fn().mockResolvedValue(mockUserInfo),
        },
      };

      vi.mocked(LastFMTyped).mockImplementation(
        () => mockLastFM as unknown as LastFMTyped,
      );

      const germanInput = {
        ...mockInput,
        locale: 'de-DE',
      };

      const userInfoSection: Section = {
        ...mockSection,
        name: SectionName.USER_INFO,
        config: { display: [ConfigUserInfoDisplayOption.playcount] },
      };

      const result = await getLastFMData(
        'UserInfo',
        germanInput,
        userInfoSection,
      );

      expect(result.playcount).toBe('12.345');
    });

    it('should handle UserInfo schema validation errors', async () => {
      const mockUserInfo = {
        registered: 'invalid-date-string',
        playcount: 'not-a-number-string',
        artistCount: 'invalid-artist-count',
      };

      const mockLastFM = {
        user: {
          getInfo: vi.fn().mockResolvedValue(mockUserInfo),
        },
      };

      vi.mocked(LastFMTyped).mockImplementation(
        () => mockLastFM as unknown as LastFMTyped,
      );

      const userInfoSection: Section = {
        ...mockSection,
        name: SectionName.USER_INFO,
        config: {
          display: [
            ConfigUserInfoDisplayOption.registered,
            ConfigUserInfoDisplayOption.playcount,
            ConfigUserInfoDisplayOption.artistCount,
          ],
        },
      };

      await expect(
        getLastFMData('UserInfo', mockInput, userInfoSection),
      ).rejects.toThrow('Failed to fetch user info');
    });

    it('should fetch top albums with specific config parameters', async () => {
      const mockAlbums = {
        albums: [
          {
            name: 'Test Album',
            artist: { name: 'Test Artist', url: 'https://test.com' },
            url: 'https://test-album.com',
            playcount: 25,
          },
        ],
      };

      const mockLastFM = {
        user: {
          getTopAlbums: vi.fn().mockResolvedValue(mockAlbums),
        },
      };

      vi.mocked(LastFMTyped).mockImplementation(
        () => mockLastFM as unknown as LastFMTyped,
      );

      const albumSection: Section = {
        ...mockSection,
        name: SectionName.ALBUMS,
        config: { rows: 10, period: '1month' as ConfigTimePeriod },
      };

      const result = await getLastFMData('TopAlbums', mockInput, albumSection);

      expect(mockLastFM.user.getTopAlbums).toHaveBeenCalledWith('test-user', {
        limit: 10,
        period: '1month',
      });
      expect(result).toEqual(mockAlbums);
    });

    it('should fetch top tracks with default values when config not provided', async () => {
      const mockTracks = { tracks: [] };

      const mockLastFM = {
        user: {
          getTopTracks: vi.fn().mockResolvedValue(mockTracks),
        },
      };

      vi.mocked(LastFMTyped).mockImplementation(
        () => mockLastFM as unknown as LastFMTyped,
      );

      const tracksSection: Section = {
        ...mockSection,
        name: SectionName.TRACKS,
        config: {}, // No config provided
      };

      await getLastFMData('TopTracks', mockInput, tracksSection);

      expect(mockLastFM.user.getTopTracks).toHaveBeenCalledWith('test-user', {
        limit: 8, // default value
        period: '7day', // default value
      });
    });
  });
});
