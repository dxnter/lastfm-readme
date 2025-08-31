import * as core from '@actions/core';
import { parseInput } from 'src/input';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('input validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseInput', () => {
    it('should parse valid inputs correctly', async () => {
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          LASTFM_API_KEY: 'test-api-key',
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

      const result = await parseInput();

      expect(result).toEqual({
        lastfm_api_key: 'test-api-key',
        lastfm_user: 'test-user',
        gh_token: 'test-token',
        repository: { owner: 'owner', repo: 'repo' },
        commit_message: 'test commit',
        show_title: 'true',
        locale: 'en-US',
        date_format: 'MM/dd/yyyy',
      });
    });

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
  });
});
