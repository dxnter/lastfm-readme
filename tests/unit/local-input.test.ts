/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { convertToGithubActionInput, parseLocalInput } from '../../src/local';

vi.mock('dotenv', () => ({
  config: vi.fn(() => ({ error: undefined })),
}));

describe('local input parsing', () => {
  const originalEnvironment = process.env;

  beforeEach(() => {
    process.env = { ...originalEnvironment };
    vi.clearAllMocks();
  });

  describe('parseLocalInput', () => {
    it('should parse valid environment variables', () => {
      process.env.LASTFM_API_KEY = 'test-api-key';
      process.env.LASTFM_USER = 'testuser';
      process.env.README_PATH = './test-readme.md';

      const config = parseLocalInput();

      expect(config.input.lastfm_api_key).toBe('test-api-key');
      expect(config.input.lastfm_user).toBe('testuser');
      expect(config.input.readme_path).toBe('./test-readme.md');
      expect(config.readmePath).toMatch(/test-readme\.md$/);
    });

    it('should use default values for optional environment variables', () => {
      process.env.LASTFM_API_KEY = 'test-api-key';
      process.env.LASTFM_USER = 'testuser';

      const config = parseLocalInput();

      expect(config.input.readme_path).toBe('./README.md');
      expect(config.input.show_title).toBe('true');
      expect(config.input.locale).toBe('en-US');
      expect(config.input.date_format).toBe('MM/dd/yyyy');
      expect(config.input.commit_message).toBe(
        'chore: update Last.fm sections',
      );
    });

    it('should throw error for missing required environment variables', () => {
      process.env.LASTFM_USER = 'testuser';
      // Missing LASTFM_API_KEY

      expect(() => parseLocalInput()).toThrow(
        'Invalid environment configuration',
      );
    });

    it('should throw error for empty required environment variables', () => {
      process.env.LASTFM_API_KEY = '';
      process.env.LASTFM_USER = 'testuser';

      expect(() => parseLocalInput()).toThrow('LASTFM_API_KEY is required');
    });

    it('should handle custom optional values', () => {
      process.env.LASTFM_API_KEY = 'test-key';
      process.env.LASTFM_USER = 'testuser';
      process.env.README_PATH = './docs/custom.md';
      process.env.SHOW_TITLE = 'false';
      process.env.LOCALE = 'fr-FR';
      process.env.DATE_FORMAT = 'dd/MM/yyyy';
      process.env.COMMIT_MESSAGE = 'custom: update music stats';

      const config = parseLocalInput();

      expect(config.input.readme_path).toBe('./docs/custom.md');
      expect(config.input.show_title).toBe('false');
      expect(config.input.locale).toBe('fr-FR');
      expect(config.input.date_format).toBe('dd/MM/yyyy');
      expect(config.input.commit_message).toBe('custom: update music stats');
    });

    it('should create absolute path for README', () => {
      process.env.LASTFM_API_KEY = 'test-key';
      process.env.LASTFM_USER = 'testuser';
      process.env.README_PATH = './relative-path.md';

      const config = parseLocalInput();

      expect(config.readmePath).toMatch(/^\/.*relative-path\.md$/);
    });
  });

  describe('convertToGithubActionInput', () => {
    it('should convert local config to GitHub Action input format', () => {
      const localConfig = {
        readmePath: '/path/to/README.md',
        input: {
          lastfm_api_key: 'test-key',
          lastfm_user: 'testuser',
          show_title: 'false',
          locale: 'fr-FR',
          date_format: 'dd/MM/yyyy',
          commit_message: 'custom commit',
        },
      };

      const githubInput = convertToGithubActionInput(localConfig);

      expect(githubInput).toEqual({
        lastfm_api_key: 'test-key',
        lastfm_user: 'testuser',
        gh_token: '',
        repository: { owner: 'local', repo: 'dev' },
        commit_message: 'custom commit',
        show_title: 'false',
        locale: 'fr-FR',
        date_format: 'dd/MM/yyyy',
      });
    });

    it('should use defaults for missing optional values', () => {
      const localConfig = {
        readmePath: '/path/to/README.md',
        assetsDir: '/path/to/assets',
        gridsDir: '/path/to/grids',
        input: {
          lastfm_api_key: 'test-key',
          lastfm_user: 'testuser',
        },
      };

      const githubInput = convertToGithubActionInput(localConfig);

      expect(githubInput.commit_message).toBe('chore: update Last.fm sections');
      expect(githubInput.show_title).toBe('true');
      expect(githubInput.locale).toBe('en-US');
      expect(githubInput.date_format).toBe('MM/dd/yyyy');
      expect(githubInput.gh_token).toBe('');
      expect(githubInput.repository).toEqual({ owner: 'local', repo: 'dev' });
    });
  });

  describe('dotenv integration', () => {
    it('should handle missing .env file gracefully', async () => {
      const { config } = await import('dotenv');
      (config as any).mockReturnValue({ error: new Error('File not found') });

      process.env.LASTFM_API_KEY = 'test-key';
      process.env.LASTFM_USER = 'testuser';

      expect(() => parseLocalInput()).not.toThrow();
    });

    it('should load .env file successfully', async () => {
      const { config } = await import('dotenv');
      (config as any).mockReturnValue({ error: undefined });

      process.env.LASTFM_API_KEY = 'test-key';
      process.env.LASTFM_USER = 'testuser';

      expect(() => parseLocalInput()).not.toThrow();
    });
  });
});
