import * as github from '@actions/github';
import { GitHubFileSystem } from 'src/filesystem';
import type { GithubActionInput } from 'src/input';
import { logger } from 'src/utils/logger';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    setOutput: vi.fn(),
    setFailed: vi.fn(),
  },
}));

describe('gitHub filesystem operations', () => {
  const mockInput: GithubActionInput = {
    lastfm_api_key: 'test-api-key',
    lastfm_user: 'test-user',
    gh_token: 'test-token',
    repository: { owner: 'test-owner', repo: 'test-repo' },
    target_file: 'README.md',
    commit_message: 'test commit message',
    show_title: 'true',
    locale: 'en-US',
    date_format: 'MM/dd/yyyy',
  };

  const mockOctokit = {
    rest: {
      repos: {
        getContent: vi.fn(),
        createOrUpdateFileContents: vi.fn(),
      },
    },
  };

  let filesystem: GitHubFileSystem;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(github.getOctokit).mockReturnValue(
      mockOctokit as unknown as ReturnType<typeof github.getOctokit>,
    );
    filesystem = new GitHubFileSystem(mockInput);
  });

  describe('getReadme', () => {
    it('should fetch README file successfully', async () => {
      const mockReadmeContent = String.raw`# Test README\n<!--START_LASTFM_RECENT-->\n<!--END_LASTFM_RECENT-->`;
      const mockReadmeData = {
        data: {
          content: Buffer.from(mockReadmeContent).toString('base64'),
          encoding: 'base64',
          sha: 'test-sha-123',
        },
      };

      mockOctokit.rest.repos.getContent.mockResolvedValue(mockReadmeData);

      const result = await filesystem.getReadme();

      expect(mockOctokit.rest.repos.getContent).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        path: 'README.md',
      });

      expect(logger.setOutput).toHaveBeenCalledWith(
        'readme_hash',
        'test-sha-123',
      );
      expect(result).toEqual({
        content: mockReadmeContent,
        hash: 'test-sha-123',
      });
    });

    it('should handle different encodings', async () => {
      const mockReadmeContent = '# Test README';
      const mockReadmeData = {
        data: {
          content: Buffer.from(mockReadmeContent, 'utf8').toString('base64'),
          encoding: 'base64',
          sha: 'test-sha-456',
        },
      };

      mockOctokit.rest.repos.getContent.mockResolvedValue(mockReadmeData);

      const result = await filesystem.getReadme();

      expect(result.content).toBe(mockReadmeContent);
      expect(result.hash).toBe('test-sha-456');
    });

    it('should throw error when README fetch fails', async () => {
      const error = new Error('Repository not found');
      mockOctokit.rest.repos.getContent.mockRejectedValue(error);

      await expect(filesystem.getReadme()).rejects.toThrow(
        '❌ Failed to fetch README.md from test-owner/test-repo: Repository not found',
      );
    });

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network timeout');
      mockOctokit.rest.repos.getContent.mockRejectedValue(networkError);

      await expect(filesystem.getReadme()).rejects.toThrow(
        '❌ Failed to fetch README.md from test-owner/test-repo: Network timeout',
      );
    });

    it('should fetch a custom target file when configured', async () => {
      const customFilesystem = new GitHubFileSystem(mockInput, {
        readmePath: 'docs/PROFILE.md',
      });
      const mockReadmeContent = '# Custom README';

      mockOctokit.rest.repos.getContent.mockResolvedValue({
        data: {
          content: Buffer.from(mockReadmeContent).toString('base64'),
          encoding: 'base64',
          sha: 'custom-sha',
        },
      });

      const result = await customFilesystem.getReadme();

      expect(mockOctokit.rest.repos.getContent).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        path: 'docs/PROFILE.md',
      });
      expect(result).toEqual({
        content: mockReadmeContent,
        hash: 'custom-sha',
      });
    });
  });

  describe('updateReadme', () => {
    const mockFileHash = 'existing-sha-123';
    const mockNewContent = String.raw`# Updated README\n<!--START_LASTFM_RECENT-->\nNew content\n<!--END_LASTFM_RECENT-->`;

    it('should update README file successfully', async () => {
      const mockUpdateResponse = {
        data: {
          commit: { sha: 'new-sha-456' },
        },
      };

      mockOctokit.rest.repos.createOrUpdateFileContents.mockResolvedValue(
        mockUpdateResponse,
      );

      await filesystem.updateReadme(mockNewContent, { hash: mockFileHash });

      expect(
        mockOctokit.rest.repos.createOrUpdateFileContents,
      ).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        path: 'README.md',
        message: 'test commit message',
        content: Buffer.from(mockNewContent, 'utf8').toString('base64'),
        sha: mockFileHash,
        committer: {
          name: 'github-actions[bot]',
          email: '41898282+github-actions[bot]@users.noreply.github.com',
        },
      });

      expect(logger.info).toHaveBeenCalledWith(
        '✅ README.md successfully updated with new charts',
      );
    });

    it('should handle custom commit messages', async () => {
      const customMessage = 'feat: update Last.fm metrics';

      mockOctokit.rest.repos.createOrUpdateFileContents.mockResolvedValue({
        data: { commit: { sha: 'test' } },
      });

      await filesystem.updateReadme(mockNewContent, {
        hash: mockFileHash,
        message: customMessage,
      });

      expect(
        mockOctokit.rest.repos.createOrUpdateFileContents,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          message: customMessage,
        }),
      );
    });

    it('should encode content properly for different character sets', async () => {
      const contentWithUnicode =
        '# README with émojis 🎵 and special characters: äöü';

      mockOctokit.rest.repos.createOrUpdateFileContents.mockResolvedValue({
        data: { commit: { sha: 'test' } },
      });

      await filesystem.updateReadme(contentWithUnicode, { hash: mockFileHash });

      const expectedEncodedContent = Buffer.from(
        contentWithUnicode,
        'utf8',
      ).toString('base64');

      expect(
        mockOctokit.rest.repos.createOrUpdateFileContents,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expectedEncodedContent,
        }),
      );
    });

    it('should throw error when hash is missing', async () => {
      await expect(filesystem.updateReadme(mockNewContent)).rejects.toThrow(
        'Hash is required for file updates in GitHub Actions',
      );
    });

    it('should throw error when update fails', async () => {
      const updateError = new Error('Insufficient permissions');
      mockOctokit.rest.repos.createOrUpdateFileContents.mockRejectedValue(
        updateError,
      );

      await expect(
        filesystem.updateReadme(mockNewContent, { hash: mockFileHash }),
      ).rejects.toThrow(
        '❌ Failed to update README.md for test-owner/test-repo: Insufficient permissions',
      );
    });

    it('should handle file conflicts gracefully', async () => {
      const conflictError = new Error('File was modified since last fetch');
      mockOctokit.rest.repos.createOrUpdateFileContents.mockRejectedValue(
        conflictError,
      );

      await expect(
        filesystem.updateReadme(mockNewContent, { hash: mockFileHash }),
      ).rejects.toThrow(
        '❌ Failed to update README.md for test-owner/test-repo: File was modified since last fetch',
      );
    });

    it('should use correct committer information', async () => {
      mockOctokit.rest.repos.createOrUpdateFileContents.mockResolvedValue({
        data: { commit: { sha: 'test' } },
      });

      await filesystem.updateReadme(mockNewContent, { hash: mockFileHash });

      expect(
        mockOctokit.rest.repos.createOrUpdateFileContents,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          committer: {
            name: 'github-actions[bot]',
            email: '41898282+github-actions[bot]@users.noreply.github.com',
          },
        }),
      );
    });

    it('should handle large README files', async () => {
      const largeContent =
        String.raw`# Large README\n` +
        'x'.repeat(100_000) +
        String.raw`\n<!--START_LASTFM_RECENT-->\nContent\n<!--END_LASTFM_RECENT-->`;

      mockOctokit.rest.repos.createOrUpdateFileContents.mockResolvedValue({
        data: { commit: { sha: 'test' } },
      });

      await filesystem.updateReadme(largeContent, { hash: mockFileHash });

      expect(
        mockOctokit.rest.repos.createOrUpdateFileContents,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          content: Buffer.from(largeContent, 'utf8').toString('base64'),
        }),
      );
    });
  });

  describe('file operations', () => {
    it('should read files correctly', async () => {
      const testContent = 'test file content';
      const mockFileData = {
        data: {
          content: Buffer.from(testContent).toString('base64'),
          sha: 'file-sha-123',
        },
      };

      mockOctokit.rest.repos.getContent.mockResolvedValue(mockFileData);

      const result = await filesystem.readFile('test.txt');

      expect(mockOctokit.rest.repos.getContent).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        path: 'test.txt',
      });
      expect(result).toBe(testContent);
    });

    it('should write files correctly', async () => {
      const testContent = 'new file content';

      // Mock file doesn't exist initially
      mockOctokit.rest.repos.getContent.mockRejectedValueOnce(
        new Error('Not found'),
      );

      mockOctokit.rest.repos.createOrUpdateFileContents.mockResolvedValue({
        data: { commit: { sha: 'new-file-sha' } },
      });

      await filesystem.writeFile('new-file.txt', testContent);

      expect(
        mockOctokit.rest.repos.createOrUpdateFileContents,
      ).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        path: 'new-file.txt',
        message: 'Update new-file.txt',
        content: Buffer.from(testContent, 'utf8').toString('base64'),
        sha: undefined,
        committer: {
          name: 'github-actions[bot]',
          email: '41898282+github-actions[bot]@users.noreply.github.com',
        },
      });
    });

    it('should check file existence correctly', async () => {
      mockOctokit.rest.repos.getContent.mockResolvedValueOnce({
        data: { type: 'file' },
      });

      const exists = await filesystem.fileExists('existing-file.txt');
      expect(exists).toBe(true);

      mockOctokit.rest.repos.getContent.mockRejectedValueOnce(
        new Error('Not found'),
      );

      const doesNotExist = await filesystem.fileExists('non-existent.txt');
      expect(doesNotExist).toBe(false);
    });
  });
});
