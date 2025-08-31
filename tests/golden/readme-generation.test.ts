import fs from 'node:fs';
import path from 'node:path';

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
  Section,
  SectionName,
} from 'src/section';
import { describe, expect, it } from 'vitest';

describe('golden file tests', () => {
  const goldenDirectory = path.join(import.meta.dirname, 'fixtures');

  const loadFixture = <T>(filename: string): T => {
    const filePath = path.join(goldenDirectory, filename);
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  };

  const updateGolden = (filename: string, content: string): void => {
    const filePath = path.join(goldenDirectory, filename);
    fs.writeFileSync(filePath, content);
  };

  const readGolden = (filename: string): string => {
    const filePath = path.join(goldenDirectory, filename);
    return fs.readFileSync(filePath, 'utf8');
  };

  describe('artists section generation', () => {
    it('should generate consistent artists section', () => {
      const mockData = loadFixture<{ artists: Artist[] }>(
        'sample-lastfm-data.json',
      );
      const mockInput = loadFixture<GithubActionInput>('sample-input.json');
      const mockSection = loadFixture<Section>('sample-section.json');

      const formatted = formatSectionData(
        mockInput,
        mockSection,
        mockData.artists,
      );
      const generated = generateMarkdownSection(
        mockInput,
        mockSection,
        'Top Artists',
        formatted,
      );

      const goldenPath = 'expected-artists-section.md';

      // Update golden file if UPDATE_GOLDEN environment variable is set
      if (process.env.UPDATE_GOLDEN) {
        updateGolden(goldenPath, generated);
        return;
      }

      const expected = readGolden(goldenPath);
      expect(generated).toBe(expected);
    });
  });

  describe('recent tracks section generation', () => {
    it('should generate consistent recent tracks section', () => {
      const mockData = loadFixture<{ recentTracks: RecentTrack[] }>(
        'sample-lastfm-data.json',
      );
      const mockInput = loadFixture<GithubActionInput>('sample-input.json');

      const mockSection: Section = {
        name: SectionName.RECENT,
        start: '<!--START_LASTFM_RECENT-->',
        end: '<!--END_LASTFM_RECENT-->',
        content: [],
        currentSection: '',
        config: { rows: 3 },
      };

      const formatted = formatSectionData(
        mockInput,
        mockSection,
        mockData.recentTracks,
      );
      const generated = generateMarkdownSection(
        mockInput,
        mockSection,
        'Recent Tracks',
        formatted,
      );

      const goldenPath = 'expected-recent-section.md';

      if (process.env.UPDATE_GOLDEN) {
        updateGolden(goldenPath, generated);
        return;
      }

      const expected = readGolden(goldenPath);
      expect(generated).toBe(expected);
    });
  });

  describe('albums section generation', () => {
    it('should generate consistent albums section', () => {
      const mockData = loadFixture<{ albums: Album[] }>(
        'sample-lastfm-data.json',
      );
      const mockInput = loadFixture<GithubActionInput>('sample-input.json');

      const mockSection: Section = {
        name: SectionName.ALBUMS,
        start: '<!--START_LASTFM_ALBUMS-->',
        end: '<!--END_LASTFM_ALBUMS-->',
        content: [],
        currentSection: '',
        config: { rows: 2 },
      };

      const formatted = formatSectionData(
        mockInput,
        mockSection,
        mockData.albums,
      );
      const generated = generateMarkdownSection(
        mockInput,
        mockSection,
        'Top Albums',
        formatted,
      );

      const expected = `<!--START_LASTFM_ALBUMS-->
<a href="https://last.fm" target="_blank"><img src="https://user-images.githubusercontent.com/17434202/215290617-e793598d-d7c9-428f-9975-156db1ba89cc.svg" alt="Last.fm Logo" width="18" height="13"/></a> **Top Albums**

> \`89 ▶️\` ∙ **[OK Computer](https://www.last.fm/music/Radiohead/OK+Computer)** - [Radiohead](https://www.last.fm/music/Radiohead)<br/>
> \`67 ▶️\` ∙ **[The Dark Side of the Moon](https://www.last.fm/music/Pink+Floyd/The+Dark+Side+of+the+Moon)** - [Pink Floyd](https://www.last.fm/music/Pink+Floyd)<br/>
<!--END_LASTFM_ALBUMS-->`;

      expect(generated).toBe(expected);
    });
  });

  describe('tracks section generation', () => {
    it('should generate consistent tracks section', () => {
      const mockData = loadFixture<{ tracks: Track[] }>(
        'sample-lastfm-data.json',
      );
      const mockInput = loadFixture<GithubActionInput>('sample-input.json');

      const mockSection: Section = {
        name: SectionName.TRACKS,
        start: '<!--START_LASTFM_TRACKS-->',
        end: '<!--END_LASTFM_TRACKS-->',
        content: [],
        currentSection: '',
        config: { rows: 2 },
      };

      const formatted = formatSectionData(
        mockInput,
        mockSection,
        mockData.tracks,
      );
      const generated = generateMarkdownSection(
        mockInput,
        mockSection,
        'Top Tracks',
        formatted,
      );

      const expected = `<!--START_LASTFM_TRACKS-->
<a href="https://last.fm" target="_blank"><img src="https://user-images.githubusercontent.com/17434202/215290617-e793598d-d7c9-428f-9975-156db1ba89cc.svg" alt="Last.fm Logo" width="18" height="13"/></a> **Top Tracks**

> \`42 ▶️\` ∙ **[Paranoid Android](https://www.last.fm/music/Radiohead/_/Paranoid+Android)** - [Radiohead](https://www.last.fm/music/Radiohead)<br/>
> \`38 ▶️\` ∙ **[Comfortably Numb](https://www.last.fm/music/Pink+Floyd/_/Comfortably+Numb)** - [Pink Floyd](https://www.last.fm/music/Pink+Floyd)<br/>
<!--END_LASTFM_TRACKS-->`;

      expect(generated).toBe(expected);
    });
  });

  describe('user info section generation', () => {
    it('should generate consistent user info section', () => {
      const mockData = loadFixture<{ userInfo: UserInfo[] }>(
        'sample-lastfm-data.json',
      );
      const mockInput = loadFixture<GithubActionInput>('sample-input.json');

      const mockSection: Section = {
        name: SectionName.USER_INFO,
        start: '<!--START_LASTFM_USER_INFO-->',
        end: '<!--END_LASTFM_USER_INFO-->',
        content: [],
        currentSection: '',
        config: {},
      };

      const formatted = formatSectionData(
        mockInput,
        mockSection,
        mockData.userInfo,
      );
      const generated = generateMarkdownSection(
        mockInput,
        mockSection,
        'User Info',
        formatted,
      );

      const expected = `<!--START_LASTFM_USER_INFO-->
<a href="https://last.fm" target="_blank"><img src="https://user-images.githubusercontent.com/17434202/215290617-e793598d-d7c9-428f-9975-156db1ba89cc.svg" alt="Last.fm Logo" width="18" height="13"/></a> **User Info**

> **Registered**: 01/01/2010<br/>
> **Playcount**: 12,345<br/>
> **Artists**: 1,234<br/>
> **Albums**: 5,678<br/>
> **Tracks**: 23,456<br/>
<!--END_LASTFM_USER_INFO-->`;

      expect(generated).toBe(expected);
    });
  });

  describe('locale-specific generation', () => {
    it('should generate consistent sections with different locales', () => {
      const mockData = loadFixture<{ artists: Artist[] }>(
        'sample-lastfm-data.json',
      );
      const germanInput: GithubActionInput = {
        lastfm_api_key: 'test-api-key',
        lastfm_user: 'testuser',
        gh_token: 'test-token',
        repository: { owner: 'testuser', repo: 'testuser' },
        commit_message: 'chore: update Last.fm sections',
        show_title: 'true',
        locale: 'de-DE',
        date_format: 'dd.MM.yyyy',
      };

      const mockSection: Section = {
        name: SectionName.ARTISTS,
        start: '<!--START_LASTFM_ARTISTS-->',
        end: '<!--END_LASTFM_ARTISTS-->',
        content: [],
        currentSection: '',
        config: { rows: 2 },
      };

      const formatted = formatSectionData(
        germanInput,
        mockSection,
        mockData.artists,
      );
      const generated = generateMarkdownSection(
        germanInput,
        mockSection,
        'Top Artists',
        formatted,
      );

      // German locale should format numbers with dots as thousands separator
      expect(generated).toContain('256 ▶️');
      expect(generated).toContain('180 ▶️');
      expect(generated).toContain('Radiohead');
    });
  });

  describe('section without title', () => {
    it('should generate sections without title when show_title is false', () => {
      const mockData = loadFixture<{ artists: Artist[] }>(
        'sample-lastfm-data.json',
      );
      const inputWithoutTitle: GithubActionInput = {
        lastfm_api_key: 'test-api-key',
        lastfm_user: 'testuser',
        gh_token: 'test-token',
        repository: { owner: 'testuser', repo: 'testuser' },
        commit_message: 'chore: update Last.fm sections',
        show_title: 'false',
        locale: 'en-US',
        date_format: 'MM/dd/yyyy',
      };

      const mockSection = loadFixture<Section>('sample-section.json');

      const formatted = formatSectionData(
        inputWithoutTitle,
        mockSection,
        mockData.artists,
      );
      const generated = generateMarkdownSection(
        inputWithoutTitle,
        mockSection,
        'Top Artists',
        formatted,
      );

      // When show_title is 'false', the title should not be displayed
      expect(generated).not.toContain('**Top Artists**');
      expect(generated).not.toContain('Last.fm Logo');
      expect(generated).toContain('<!--START_LASTFM_ARTISTS-->');
      expect(generated).toContain('<!--END_LASTFM_ARTISTS-->');
      expect(generated).toContain('Radiohead');

      // Should contain only the start tag, content, and end tag without title
      const expected = `<!--START_LASTFM_ARTISTS-->
> \`256 ▶️\` ∙ **[Radiohead](https://www.last.fm/music/Radiohead)**<br/>
> \`180 ▶️\` ∙ **[Pink Floyd](https://www.last.fm/music/Pink+Floyd)**<br/>
> \`145 ▶️\` ∙ **[The Beatles](https://www.last.fm/music/The+Beatles)**<br/>
<!--END_LASTFM_ARTISTS-->`;

      expect(generated).toBe(expected);
    });
  });
});
