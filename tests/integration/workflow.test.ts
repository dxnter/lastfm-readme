import * as core from '@actions/core';
import * as github from '@actions/github';
import LastFMTyped from 'lastfm-typed';
import { run } from 'src/index';
import { logger } from 'src/utils/logger';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the logger utility
vi.mock('../../src/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    setOutput: vi.fn(),
    setFailed: vi.fn(),
  },
}));

describe('end-to-end workflow', () => {
  const mockOctokit = {
    rest: {
      repos: {
        getReadme: vi.fn(),
        createOrUpdateFileContents: vi.fn(),
      },
    },
  };

  const mockLastFM = {
    auth: {
      getToken: vi.fn().mockResolvedValue({ token: 'test-token' }),
    },
    user: {
      getRecentTracks: vi.fn(),
      getTopArtists: vi.fn(),
      getTopTracks: vi.fn(),
      getTopAlbums: vi.fn(),
      getInfo: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(core.getInput).mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        LASTFM_API_KEY: 'test-api-key',
        LASTFM_USER: 'testuser',
        GH_TOKEN: 'test-gh-token',
        REPOSITORY: 'owner/repo',
        COMMIT_MESSAGE: 'chore: update Last.fm sections',
        SHOW_TITLE: 'true',
        LOCALE: 'en-US',
        DATE_FORMAT: 'MM/dd/yyyy',
      };
      return inputs[name] || '';
    });

    vi.mocked(github.getOctokit).mockReturnValue(
      mockOctokit as unknown as ReturnType<typeof github.getOctokit>,
    );

    vi.mocked(LastFMTyped).mockImplementation(
      () => mockLastFM as unknown as LastFMTyped,
    );

    const defaultReadme = `# Test Profile
<!--START_LASTFM_RECENT-->
Old recent tracks content
<!--END_LASTFM_RECENT-->

<!--START_LASTFM_ARTISTS:{"period": "1month", "rows": 3}-->
Old artists content
<!--END_LASTFM_ARTISTS-->`;

    mockOctokit.rest.repos.getReadme.mockResolvedValue({
      data: {
        content: Buffer.from(defaultReadme).toString('base64'),
        encoding: 'base64',
        sha: 'original-sha',
      },
    });

    mockLastFM.user.getRecentTracks.mockResolvedValue({
      tracks: [
        {
          name: 'Test Recent Track',
          artist: { name: 'Test Artist' },
          url: 'https://last.fm/music/Test+Artist/_/Test+Recent+Track',
          date: { uts: 1_640_995_200 },
        },
      ],
    });

    mockLastFM.user.getTopArtists.mockResolvedValue({
      artists: [
        {
          name: 'Top Artist',
          url: 'https://last.fm/music/Top+Artist',
          playcount: 100,
        },
      ],
    });

    mockOctokit.rest.repos.createOrUpdateFileContents.mockResolvedValue({
      data: { commit: { sha: 'new-sha' } },
    });
  });

  it('should complete full workflow successfully', async () => {
    await expect(run()).resolves.not.toThrow();

    // Verify input validation
    expect(mockLastFM.auth.getToken).toHaveBeenCalled();

    // Verify README fetch
    expect(mockOctokit.rest.repos.getReadme).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
    });

    // Verify API calls were made
    expect(mockLastFM.user.getRecentTracks).toHaveBeenCalledWith('testuser', {
      limit: 8,
      extended: true,
    });

    expect(mockLastFM.user.getTopArtists).toHaveBeenCalledWith('testuser', {
      limit: 3,
      period: '1month',
    });

    // Verify README update
    expect(
      mockOctokit.rest.repos.createOrUpdateFileContents,
    ).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      path: 'README.md',
      message: 'chore: update Last.fm sections',
      content: expect.any(String) as string,
      sha: 'original-sha',
      committer: {
        name: 'lastfm-readme-bot',
        email: 'lastfm-readme@proton.me',
      },
    });

    // Verify outputs
    expect(logger.setOutput).toHaveBeenCalledWith('readme-updated', 'true');
    expect(logger.setOutput).toHaveBeenCalledWith(
      'readme_hash',
      'original-sha',
    );
  });

  it('should skip update when content is unchanged', async () => {
    // Mock current content that would generate the same result after processing
    const unchangedReadme = `# Test Profile
<!--START_LASTFM_RECENT-->
<a href="https://last.fm" target="_blank"><img src="https://user-images.githubusercontent.com/17434202/215290617-e793598d-d7c9-428f-9975-156db1ba89cc.svg" alt="Last.fm Logo" width="18" height="13"/></a> **Recent Tracks**

> ∙ **[Test Recent Track](https://last.fm/music/Test+Artist/_/Test+Recent+Track)** - Test Artist<br/>
<!--END_LASTFM_RECENT-->

<!--START_LASTFM_ARTISTS:{"period": "1month", "rows": 3}-->
<a href="https://last.fm" target="_blank"><img src="https://user-images.githubusercontent.com/17434202/215290617-e793598d-d7c9-428f-9975-156db1ba89cc.svg" alt="Last.fm Logo" width="18" height="13"/></a> **Top Artists - Past Month**

> \`100 ▶️\` ∙ **[Top Artist](https://last.fm/music/Top+Artist)**<br/>
<!--END_LASTFM_ARTISTS-->`;

    // Both calls return the same content to simulate no change
    mockOctokit.rest.repos.getReadme.mockResolvedValue({
      data: {
        content: Buffer.from(unchangedReadme).toString('base64'),
        encoding: 'base64',
        sha: 'original-sha',
      },
    });

    await run();

    // Should not update README
    expect(
      mockOctokit.rest.repos.createOrUpdateFileContents,
    ).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      '🕓 Skipping update, chart content is up to date',
    );
    expect(logger.setOutput).toHaveBeenCalledWith('readme-updated', 'false');
  });

  it('should handle multiple sections of different types', async () => {
    const multiSectionReadme = `# Test Profile
<!--START_LASTFM_RECENT-->
Old content
<!--END_LASTFM_RECENT-->

<!--START_LASTFM_ARTISTS-->
Old content
<!--END_LASTFM_ARTISTS-->

<!--START_LASTFM_TRACKS:{"period": "overall", "rows": 5}-->
Old content
<!--END_LASTFM_TRACKS-->

<!--START_LASTFM_ALBUMS-->
Old content
<!--END_LASTFM_ALBUMS-->

<!--START_LASTFM_USER_INFO:{"display": ["playcount", "artistCount"]}-->
Old content
<!--END_LASTFM_USER_INFO-->`;

    mockOctokit.rest.repos.getReadme.mockResolvedValue({
      data: {
        content: Buffer.from(multiSectionReadme).toString('base64'),
        encoding: 'base64',
        sha: 'multi-sha',
      },
    });

    // Mock additional API responses
    mockLastFM.user.getTopTracks.mockResolvedValue({
      tracks: [
        {
          name: 'Top Track',
          artist: { name: 'Artist' },
          url: 'https://test.com',
          playcount: 50,
        },
      ],
    });

    mockLastFM.user.getTopAlbums.mockResolvedValue({
      albums: [
        {
          name: 'Top Album',
          artist: { name: 'Artist', url: 'https://test.com' },
          url: 'https://test.com',
          playcount: 25,
        },
      ],
    });

    mockLastFM.user.getInfo.mockResolvedValue({
      playcount: 1000,
      artistCount: 500,
    });

    await run();

    // Verify all API calls were made
    expect(mockLastFM.user.getRecentTracks).toHaveBeenCalled();
    expect(mockLastFM.user.getTopArtists).toHaveBeenCalled();
    expect(mockLastFM.user.getTopTracks).toHaveBeenCalledWith('testuser', {
      limit: 5,
      period: 'overall',
    });
    expect(mockLastFM.user.getTopAlbums).toHaveBeenCalled();
    expect(mockLastFM.user.getInfo).toHaveBeenCalled();

    expect(
      mockOctokit.rest.repos.createOrUpdateFileContents,
    ).toHaveBeenCalled();
  });

  it('should handle API failures gracefully', async () => {
    mockLastFM.user.getRecentTracks.mockRejectedValue(
      new Error('Last.fm API error'),
    );

    await expect(run()).rejects.toThrow('Last.fm API error');
  });

  it('should handle GitHub API failures gracefully', async () => {
    mockOctokit.rest.repos.getReadme.mockRejectedValue(
      new Error('GitHub API error'),
    );

    await expect(run()).rejects.toThrow('GitHub API error');
  });

  it('should handle invalid input gracefully', async () => {
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      if (name === 'REPOSITORY') return 'invalid-format'; // Missing slash
      return name === 'LASTFM_API_KEY'
        ? 'test-key'
        : name === 'LASTFM_USER'
          ? 'test-user'
          : '';
    });

    await expect(run()).rejects.toThrow('Invalid REPOSITORY input');
  });

  it('should handle section parsing errors', async () => {
    const malformedReadme = `# Test Profile
<!--START_LASTFM_RECENT-->
Content
<!-- Missing end tag -->`; // Missing end tag

    mockOctokit.rest.repos.getReadme.mockResolvedValue({
      data: {
        content: Buffer.from(malformedReadme).toString('base64'),
        encoding: 'base64',
        sha: 'malformed-sha',
      },
    });

    await expect(run()).rejects.toThrow(
      'Start tag found without a corresponding end tag',
    );
  });

  it('should preserve content outside managed sections', async () => {
    const readmeWithExtraContent = `# My Profile

Some intro text here.

<!--START_LASTFM_RECENT-->
Old content
<!--END_LASTFM_RECENT-->

## Other Projects

More content here that should be preserved.

<!--START_LASTFM_ARTISTS-->
Old artists
<!--END_LASTFM_ARTISTS-->

Footer content.`;

    mockOctokit.rest.repos.getReadme.mockResolvedValue({
      data: {
        content: Buffer.from(readmeWithExtraContent).toString('base64'),
        encoding: 'base64',
        sha: 'preserve-sha',
      },
    });

    await run();

    expect(
      mockOctokit.rest.repos.createOrUpdateFileContents,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.any(String) as string,
      }),
    );

    const mockCall = vi.mocked(
      mockOctokit.rest.repos.createOrUpdateFileContents,
    );
    const callArguments = mockCall.mock.calls[0];

    if (!callArguments || !callArguments[0]) {
      throw new Error('Expected createOrUpdateFileContents to be called');
    }

    const parameters = callArguments[0] as { content: string };
    const updatedContent = Buffer.from(parameters.content, 'base64').toString(
      'utf8',
    );

    // Verify preserved content
    expect(updatedContent).toContain('Some intro text here.');
    expect(updatedContent).toContain('## Other Projects');
    expect(updatedContent).toContain(
      'More content here that should be preserved.',
    );
    expect(updatedContent).toContain('Footer content.');

    // Verify updated sections
    expect(updatedContent).toContain('Test Recent Track');
    expect(updatedContent).toContain('Top Artist');
  });

  it('should use default GitHub context when repository not specified', async () => {
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      if (name === 'REPOSITORY') return ''; // Empty repository
      return name === 'LASTFM_API_KEY'
        ? 'test-key'
        : name === 'LASTFM_USER'
          ? 'test-user'
          : 'default';
    });

    // Mock GitHub context
    vi.mocked(github.context).repo = {
      owner: 'context-owner',
      repo: 'context-repo',
    };

    await run();

    expect(mockOctokit.rest.repos.getReadme).toHaveBeenCalledWith({
      owner: 'context-owner',
      repo: 'context-repo',
    });
  });
});
