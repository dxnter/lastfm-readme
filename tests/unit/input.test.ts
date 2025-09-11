import * as core from '@actions/core';
import type LastFMTyped from 'lastfm-typed';
import { parseInput } from 'src/input';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the lastfm-typed module
vi.mock('lastfm-typed');

describe('input validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseInput', () => {
    it('should throw InvalidInputError for invalid repository format', async () => {
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          LASTFM_API_KEY: 'test-api-key',
          LASTFM_USER: 'test-user',
          GH_TOKEN: 'test-token',
          REPOSITORY: 'invalid-format',
          COMMIT_MESSAGE: 'test commit',
          SHOW_TITLE: 'true',
          LOCALE: 'en-US',
          DATE_FORMAT: 'MM/dd/yyyy',
        };
        return inputs[name] || '';
      });

      await expect(parseInput()).rejects.toThrow('Invalid REPOSITORY input');
    });

    it('should throw InvalidInputError for API key validation failure', async () => {
      // Import the lastfm mock
      const { default: LastFm } = await import('lastfm-typed');
      const mockLastFm = vi.mocked(LastFm);

      mockLastFm.mockImplementation(
        () =>
          ({
            user: {
              getInfo: vi.fn().mockRejectedValue(new Error('Invalid API key')),
            },
          }) as unknown as LastFMTyped,
      );

      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          LASTFM_API_KEY: 'invalid-api-key',
          LASTFM_USER: 'test-user',
          GH_TOKEN: 'test-token',
          REPOSITORY: 'owner/repo',
          COMMIT_MESSAGE: 'test commit',
          SHOW_TITLE: 'true',
          LOCALE: 'en-US',
          DATE_FORMAT: 'MM/dd/yyyy',
        };
        return inputs[name] || '';
      });

      await expect(parseInput()).rejects.toThrow(
        '❌ Failed to validate Last.fm API key. Please check its validity.',
      );
    });
  });
});
