/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/filesystem');
vi.mock('../../src/lastfm');
vi.mock('../../src/local/input');

describe('local development workflow integration', () => {
  let mockLocalConfig: any;
  let mockInput: any;

  beforeEach(() => {
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    mockLocalConfig = {
      readmePath: '/Users/test/project/README.md',
      input: {
        lastfmApiKey: 'test-key',
        lastfmUser: 'testuser',
        showTitle: true,
        locale: 'en-US',
        dateFormat: 'MM/dd/yyyy',
      },
    };

    mockInput = {
      lastfm_api_key: 'test-key',
      lastfm_user: 'testuser',
      gh_token: 'test-token',
      repository: { owner: 'testowner', repo: 'testrepo' },
      commit_message: 'test commit',
      show_title: 'true',
      locale: 'en-US',
      date_format: 'MM/dd/yyyy',
    };

    vi.clearAllMocks();
  });

  describe('basic workflow', () => {
    it('should run the complete local development workflow', async () => {
      // Mock local input parsing
      const { parseLocalInput, convertToGithubActionInput } = await import(
        '../../src/local/input'
      );
      (parseLocalInput as any).mockReturnValue(mockLocalConfig);
      (convertToGithubActionInput as any).mockReturnValue(mockInput);

      // Mock filesystem operations
      const { LocalFileSystem } = await import('../../src/filesystem');
      const mockFs = {
        getReadme: vi.fn().mockResolvedValue({
          content: `
# My Profile

<!--START_LASTFM_TRACKS-->
<!--END_LASTFM_TRACKS-->

<!--START_LASTFM_ARTISTS-->
<!--END_LASTFM_ARTISTS-->

Some other content
`,
        }),
        updateReadme: vi.fn().mockResolvedValue(''),
        fileExists: vi.fn().mockResolvedValue(true),
        readFile: vi.fn().mockResolvedValue(''),
        writeFile: vi.fn().mockResolvedValue(''),
        ensureDir: vi.fn().mockResolvedValue(''),
      };
      (LocalFileSystem as any).mockImplementation(() => mockFs);

      // Mock Last.fm data
      const { getLastFMData } = await import('../../src/lastfm');
      (getLastFMData as any)
        .mockResolvedValueOnce({
          tracks: [
            {
              name: 'Test Track',
              artist: { name: 'Test Artist', url: 'https://artist.com' },
              playcount: 50,
            },
          ],
        })
        .mockResolvedValueOnce({
          artists: [
            {
              name: 'Test Artist',
              url: 'https://artist.com',
              playcount: 100,
            },
          ],
        });

      // Run the development workflow
      const { runLocalDevelopment } = await import('../../src/development');
      await runLocalDevelopment();

      // Verify the workflow executed
      expect(parseLocalInput).toHaveBeenCalled();
      expect(convertToGithubActionInput).toHaveBeenCalledWith(mockLocalConfig);
      expect(mockFs.getReadme).toHaveBeenCalled();
      expect(getLastFMData).toHaveBeenCalledTimes(2);
    });

    it('should handle README file not found', async () => {
      const { parseLocalInput, convertToGithubActionInput } = await import(
        '../../src/local/input'
      );
      (parseLocalInput as any).mockReturnValue(mockLocalConfig);
      (convertToGithubActionInput as any).mockReturnValue(mockInput);

      const { LocalFileSystem } = await import('../../src/filesystem');
      const mockFs = {
        getReadme: vi
          .fn()
          .mockRejectedValue(
            new Error('README file not found: /Users/test/project/README.md'),
          ),
        updateReadme: vi.fn().mockResolvedValue(''),
        fileExists: vi.fn().mockResolvedValue(false),
        readFile: vi.fn().mockResolvedValue(''),
        writeFile: vi.fn().mockResolvedValue(''),
        ensureDir: vi.fn().mockResolvedValue(''),
      };
      (LocalFileSystem as any).mockImplementation(() => mockFs);

      const { runLocalDevelopment } = await import('../../src/development');

      await expect(runLocalDevelopment()).rejects.toThrow(
        'README file not found',
      );
    });

    it('should complete successfully with no sections found', async () => {
      const { parseLocalInput, convertToGithubActionInput } = await import(
        '../../src/local/input'
      );
      (parseLocalInput as any).mockReturnValue(mockLocalConfig);
      (convertToGithubActionInput as any).mockReturnValue(mockInput);

      const { LocalFileSystem } = await import('../../src/filesystem');
      const mockFs = {
        getReadme: vi.fn().mockResolvedValue({
          content: `
# My Profile

Just some regular content without any Last.fm sections.
`,
        }),
        updateReadme: vi.fn().mockResolvedValue(''),
        fileExists: vi.fn().mockResolvedValue(true),
        readFile: vi.fn().mockResolvedValue(''),
        writeFile: vi.fn().mockResolvedValue(''),
        ensureDir: vi.fn().mockResolvedValue(''),
      };
      (LocalFileSystem as any).mockImplementation(() => mockFs);

      const { runLocalDevelopment } = await import('../../src/development');

      // Should complete without error
      await expect(runLocalDevelopment()).resolves.not.toThrow();
      expect(mockFs.getReadme).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle Last.fm API failures gracefully', async () => {
      const { parseLocalInput, convertToGithubActionInput } = await import(
        '../../src/local/input'
      );
      (parseLocalInput as any).mockReturnValue(mockLocalConfig);
      (convertToGithubActionInput as any).mockReturnValue(mockInput);

      const { LocalFileSystem } = await import('../../src/filesystem');
      const mockFs = {
        getReadme: vi.fn().mockResolvedValue({
          content: `
<!--START_LASTFM_TRACKS-->
<!--END_LASTFM_TRACKS-->
`,
        }),
        updateReadme: vi.fn().mockResolvedValue(''),
        fileExists: vi.fn().mockResolvedValue(true),
        readFile: vi.fn().mockResolvedValue(''),
        writeFile: vi.fn().mockResolvedValue(''),
        ensureDir: vi.fn().mockResolvedValue(''),
      };
      (LocalFileSystem as any).mockImplementation(() => mockFs);

      const { getLastFMData } = await import('../../src/lastfm');
      (getLastFMData as any).mockRejectedValue(new Error('Last.fm API error'));

      const { runLocalDevelopment } = await import('../../src/development');

      // Should complete despite API errors (sections handle errors gracefully)
      await expect(runLocalDevelopment()).resolves.not.toThrow();
      expect(mockFs.getReadme).toHaveBeenCalled();
    });
  });

  describe('input configuration', () => {
    it('should use parsed local configuration correctly', async () => {
      const customConfig = {
        readmePath: '/custom/README.md',
        input: {
          lastfmApiKey: 'custom-key',
          lastfmUser: 'custom-user',
          showTitle: false,
          locale: 'es-ES',
          dateFormat: 'dd/MM/yyyy',
        },
      };

      const { parseLocalInput, convertToGithubActionInput } = await import(
        '../../src/local/input'
      );
      (parseLocalInput as any).mockReturnValue(customConfig);
      (convertToGithubActionInput as any).mockReturnValue({
        ...mockInput,
        lastfm_user: 'custom-user',
      });

      const { LocalFileSystem } = await import('../../src/filesystem');
      const mockFs = {
        getReadme: vi
          .fn()
          .mockResolvedValue({ content: '# Profile\n\nNo sections.' }),
        updateReadme: vi.fn().mockResolvedValue(''),
        fileExists: vi.fn().mockResolvedValue(true),
        readFile: vi.fn().mockResolvedValue(''),
        writeFile: vi.fn().mockResolvedValue(''),
        ensureDir: vi.fn().mockResolvedValue(''),
      };
      (LocalFileSystem as any).mockImplementation(() => mockFs);

      const { runLocalDevelopment } = await import('../../src/development');

      await runLocalDevelopment();

      expect(parseLocalInput).toHaveBeenCalled();
      expect(convertToGithubActionInput).toHaveBeenCalledWith(customConfig);
      expect(mockFs.getReadme).toHaveBeenCalled();
    });
  });

  describe('file operations', () => {
    it('should write README only when changes are made', async () => {
      const { parseLocalInput, convertToGithubActionInput } = await import(
        '../../src/local/input'
      );
      (parseLocalInput as any).mockReturnValue(mockLocalConfig);
      (convertToGithubActionInput as any).mockReturnValue(mockInput);

      const originalContent = `
<!--START_LASTFM_ARTISTS-->
<!--END_LASTFM_ARTISTS-->
`;

      const { LocalFileSystem } = await import('../../src/filesystem');
      const mockFs = {
        getReadme: vi.fn().mockResolvedValue({ content: originalContent }),
        updateReadme: vi.fn().mockResolvedValue(''),
        fileExists: vi.fn().mockResolvedValue(true),
        readFile: vi.fn().mockResolvedValue(''),
        writeFile: vi.fn().mockResolvedValue(''),
        ensureDir: vi.fn().mockResolvedValue(''),
      };
      (LocalFileSystem as any).mockImplementation(() => mockFs);

      const { getLastFMData } = await import('../../src/lastfm');
      (getLastFMData as any).mockResolvedValue({
        artists: [
          {
            name: 'Test Artist',
            url: 'https://artist.com',
            playcount: 100,
          },
        ],
      });

      const { runLocalDevelopment } = await import('../../src/development');

      await runLocalDevelopment();

      expect(mockFs.getReadme).toHaveBeenCalled();
      // updateReadme should be called since we have artist data that changes the content
      expect(mockFs.updateReadme).toHaveBeenCalled();
    });
  });
});
