import {
  EndTagWithoutStartTagError,
  StartTagWithoutEndTagError,
} from 'src/error';
import type { GithubActionInput } from 'src/input';
import type {
  Album,
  Artist,
  RecentTrack,
  Track,
  UserInfo,
} from 'src/lastfm/types';
import {
  formatSectionData,
  generateMarkdownSection,
  getSectionsFromReadme,
  Section,
  SectionName,
} from 'src/section';
import { describe, expect, it } from 'vitest';

describe('section parsing', () => {
  describe('getSectionsFromReadme', () => {
    it('should parse simple sections correctly', () => {
      const readme = `
# Test README
<!--START_LASTFM_RECENT-->
Old content here
<!--END_LASTFM_RECENT-->
More content
`;

      const sections = getSectionsFromReadme('LASTFM_RECENT', readme);

      expect(sections).toHaveLength(1);
      expect(sections![0]?.name).toBe('RECENT');
      expect(sections![0]?.content).toEqual(['Old content here']);
    });

    it('should parse sections with JSON config', () => {
      const readme = `<!--START_LASTFM_ARTISTS:{"period": "1month", "rows": 5}-->
Content
<!--END_LASTFM_ARTISTS-->`;

      const sections = getSectionsFromReadme('LASTFM_ARTISTS', readme);

      expect(sections![0]?.config).toEqual({
        period: '1month',
        rows: 5,
      });
    });

    it('should handle multiple sections of same type', () => {
      const readme = `
<!--START_LASTFM_ARTISTS-->
First section
<!--END_LASTFM_ARTISTS-->

<!--START_LASTFM_ARTISTS:{"rows": 3}-->
Second section
<!--END_LASTFM_ARTISTS-->
`;

      const sections = getSectionsFromReadme('LASTFM_ARTISTS', readme);

      expect(sections).toHaveLength(2);
      expect(sections![0]?.content).toEqual(['First section']);
      expect(sections![1]?.content).toEqual(['Second section']);
      expect(sections![1]?.config.rows).toBe(3);
    });

    it('should handle empty sections', () => {
      const readme = `<!--START_LASTFM_TRACKS-->
<!--END_LASTFM_TRACKS-->`;

      const sections = getSectionsFromReadme('LASTFM_TRACKS', readme);

      expect(sections![0]?.content).toEqual([]);
    });

    it('should return undefined when no sections found', () => {
      const readme = `# Just a regular README with no sections`;
      const sections = getSectionsFromReadme('LASTFM_RECENT', readme);

      expect(sections).toBeUndefined();
    });

    it('should throw error for malformed JSON config', () => {
      const readme = `<!--START_LASTFM_ARTISTS:{"invalid": json}-->
<!--END_LASTFM_ARTISTS-->`;

      expect(() => getSectionsFromReadme('LASTFM_ARTISTS', readme)).toThrow();
    });

    it('should throw EndTagWithoutStartTagError for mismatched end tags', () => {
      const readme = `<!--END_LASTFM_RECENT-->`;

      expect(() => getSectionsFromReadme('LASTFM_RECENT', readme)).toThrow(
        EndTagWithoutStartTagError,
      );
    });

    it('should throw StartTagWithoutEndTagError for unclosed tags', () => {
      const readme = `<!--START_LASTFM_RECENT-->
Some content`;

      expect(() => getSectionsFromReadme('LASTFM_RECENT', readme)).toThrow(
        StartTagWithoutEndTagError,
      );
    });

    it('should handle nested section processing correctly', () => {
      const readme = `<!--START_LASTFM_RECENT-->
Line 1
Line 2
<!--END_LASTFM_RECENT-->`;

      const sections = getSectionsFromReadme('LASTFM_RECENT', readme);

      expect(sections).toHaveLength(1);
      expect(sections![0]?.content).toEqual(['Line 1', 'Line 2']);
      expect(sections![0]?.end).toBe('<!--END_LASTFM_RECENT-->');
    });

    it('should initialize sections with empty end and content arrays', () => {
      const readme = `Before section
<!--START_LASTFM_ARTISTS:{"period":"1month"}-->
Content line 1
Content line 2
<!--END_LASTFM_ARTISTS-->
After section`;

      const sections = getSectionsFromReadme('LASTFM_ARTISTS', readme);

      expect(sections).toHaveLength(1);
      expect(sections![0]?.start).toBe(
        '<!--START_LASTFM_ARTISTS:{"period":"1month"}-->',
      );
      expect(sections![0]?.end).toBe('<!--END_LASTFM_ARTISTS-->');
      expect(sections![0]?.content).toEqual([
        'Content line 1',
        'Content line 2',
      ]);
      expect(sections![0]?.config.period).toBe('1month');
    });
  });

  describe('formatSectionData', () => {
    const mockInput: GithubActionInput = {
      lastfm_api_key: 'test',
      lastfm_user: 'test',
      gh_token: 'test',
      repository: { owner: 'test', repo: 'test' },
      commit_message: 'test',
      show_title: 'true',
      locale: 'en-US',
      date_format: 'MM/dd/yyyy',
    };

    it('should format artist data correctly', () => {
      const section: Section = {
        name: SectionName.ARTISTS,
        start: '<!--START_LASTFM_ARTISTS-->',
        end: '<!--END_LASTFM_ARTISTS-->',
        content: [],
        currentSection: '',
        config: {},
      };

      const artists: Artist[] = [
        {
          name: 'Test Artist',
          url: 'https://last.fm/music/Test+Artist',
          playcount: 100,
        },
        {
          name: 'Another Artist',
          url: 'https://last.fm/music/Another+Artist',
          playcount: 50,
        },
      ];

      const result = formatSectionData(mockInput, section, artists);

      expect(result).toContain('`100 ▶️`');
      expect(result).toContain(
        '**[Test Artist](https://last.fm/music/Test+Artist)**',
      );
      expect(result).toContain('`50 ▶️`');
      expect(result).toContain(
        '**[Another Artist](https://last.fm/music/Another+Artist)**',
      );
    });

    it('should format album data correctly', () => {
      const section: Section = {
        name: SectionName.ALBUMS,
        start: '<!--START_LASTFM_ALBUMS-->',
        end: '<!--END_LASTFM_ALBUMS-->',
        content: [],
        currentSection: '',
        config: {},
      };

      const albums: Album[] = [
        {
          name: 'Test Album',
          url: 'https://last.fm/music/Test+Artist/Test+Album',
          playcount: 25,
          artist: {
            name: 'Test Artist',
            url: 'https://last.fm/music/Test+Artist',
          },
        },
      ];

      const result = formatSectionData(mockInput, section, albums);

      expect(result).toContain('`25 ▶️`');
      expect(result).toContain(
        '**[Test Album](https://last.fm/music/Test+Artist/Test+Album)**',
      );
      expect(result).toContain(
        '[Test Artist](https://last.fm/music/Test+Artist)',
      );
    });

    it('should format track data correctly', () => {
      const section: Section = {
        name: SectionName.TRACKS,
        start: '<!--START_LASTFM_TRACKS-->',
        end: '<!--END_LASTFM_TRACKS-->',
        content: [],
        currentSection: '',
        config: {},
      };

      const tracks: Track[] = [
        {
          name: 'Test Track',
          url: 'https://last.fm/music/Test+Artist/_/Test+Track',
          playcount: 15,
          artist: {
            name: 'Test Artist',
            url: 'https://last.fm/music/Test+Artist',
          },
        },
      ];

      const result = formatSectionData(mockInput, section, tracks);

      expect(result).toContain('`15 ▶️`');
      expect(result).toContain(
        '**[Test Track](https://last.fm/music/Test+Artist/_/Test+Track)**',
      );
      expect(result).toContain(
        '[Test Artist](https://last.fm/music/Test+Artist)',
      );
    });

    it('should format recent tracks with playing indicator', () => {
      const section: Section = {
        name: SectionName.RECENT,
        start: '<!--START_LASTFM_RECENT-->',
        end: '<!--END_LASTFM_RECENT-->',
        content: [],
        currentSection: '',
        config: { rows: 10 },
      };

      const recentTracks: RecentTrack[] = Array.from(
        { length: 12 },
        (_, index) => ({
          name: `Track ${index + 1}`,
          url: `https://last.fm/music/Artist/_/Track+${index + 1}`,
          playcount: 1,
          artist: {
            name: `Artist ${index + 1}`,
            url: `https://last.fm/music/Artist+${index + 1}`,
          },
          date: { uts: 1_640_995_200 + index },
        }),
      );

      const result = formatSectionData(mockInput, section, recentTracks);

      expect(result).toContain('🎶'); // Playing indicator for first track
      expect(result).toContain(
        '**[Track 1](https://last.fm/music/Artist/_/Track+1)**',
      );
      expect(result.split('\n')).toHaveLength(10); // Should respect rows limit
    });

    it('should format user info data correctly', () => {
      const section: Section = {
        name: SectionName.USER_INFO,
        start: '<!--START_LASTFM_USER_INFO-->',
        end: '<!--END_LASTFM_USER_INFO-->',
        content: [],
        currentSection: '',
        config: {},
      };

      const userInfo: UserInfo[] = [
        {
          registered: '01/01/2020',
          playcount: '1,000',
          artistCount: '500',
          albumCount: '300',
          trackCount: '2,000',
        },
      ];

      const result = formatSectionData(mockInput, section, userInfo);

      expect(result).toContain('**Registered**: 01/01/2020');
      expect(result).toContain('**Playcount**: 1,000');
      expect(result).toContain('**Artists**: 500');
    });

    it('should handle empty data gracefully', () => {
      const section: Section = {
        name: SectionName.RECENT,
        start: '<!--START_LASTFM_RECENT-->',
        end: '<!--END_LASTFM_RECENT-->',
        content: [],
        currentSection: '',
        config: {},
      };

      const result = formatSectionData(mockInput, section, []);

      expect(result).toBe(
        'No listening data found for the selected time period.',
      );
    });

    it('should respect locale for number formatting', () => {
      const germanInput = { ...mockInput, locale: 'de-DE' };
      const section: Section = {
        name: SectionName.ARTISTS,
        start: '<!--START_LASTFM_ARTISTS-->',
        end: '<!--END_LASTFM_ARTISTS-->',
        content: [],
        currentSection: '',
        config: {},
      };

      const artists: Artist[] = [
        { name: 'Test', url: 'https://test.com', playcount: 1234 },
      ];

      const result = formatSectionData(germanInput, section, artists);

      expect(result).toContain('1.234'); // German number formatting
    });
  });

  describe('generateMarkdownSection', () => {
    const mockInput: GithubActionInput = {
      lastfm_api_key: 'test',
      lastfm_user: 'test',
      gh_token: 'test',
      repository: { owner: 'test', repo: 'test' },
      commit_message: 'test',
      show_title: 'true',
      locale: 'en-US',
      date_format: 'MM/dd/yyyy',
    };

    const mockSection: Section = {
      name: SectionName.ARTISTS,
      start: '<!--START_LASTFM_ARTISTS-->',
      end: '<!--END_LASTFM_ARTISTS-->',
      content: [],
      currentSection: '',
      config: {},
    };

    it('should generate section with title when show_title is true', () => {
      const result = generateMarkdownSection(
        mockInput,
        mockSection,
        'Top Artists',
        'Content here',
      );

      expect(result).toContain('<!--START_LASTFM_ARTISTS-->');
      expect(result).toContain('**Top Artists**');
      expect(result).toContain('Content here');
      expect(result).toContain('<!--END_LASTFM_ARTISTS-->');
      expect(result).toContain('Last.fm Logo');
    });

    it('should generate section without title when show_title is false', () => {
      const inputWithoutTitle = { ...mockInput, show_title: 'false' };

      const result = generateMarkdownSection(
        inputWithoutTitle,
        mockSection,
        'Top Artists',
        'Content here',
      );

      expect(result).toContain('<!--START_LASTFM_ARTISTS-->');
      expect(result).not.toContain('**Top Artists**');
      expect(result).toContain('Content here');
      expect(result).toContain('<!--END_LASTFM_ARTISTS-->');
      expect(result).not.toContain('Last.fm Logo');
    });
  });
});
