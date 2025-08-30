import { vi } from 'vitest';

export const createMockOctokit = () => ({
  rest: {
    repos: {
      getReadme: vi.fn().mockResolvedValue({
        data: {
          content: Buffer.from(
            '# Test README\n<!--START_LASTFM_RECENT-->\n<!--END_LASTFM_RECENT-->',
          ).toString('base64'),
          encoding: 'base64',
          sha: 'test-sha',
        },
      }),
      createOrUpdateFileContents: vi.fn().mockResolvedValue({
        data: { commit: { sha: 'new-sha' } },
      }),
    },
  },
});
