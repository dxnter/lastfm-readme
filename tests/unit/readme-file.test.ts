import * as core from '@actions/core';
import * as github from '@actions/github';
import type { GithubActionInput } from 'src/input';
import { getReadmeFile, updateReadmeFile } from 'src/readme-file';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('readme file operations', () => {
  const mockInput: GithubActionInput = {
    lastfm_api_key: 'test-api-key',
    lastfm_user: 'test-user',
    gh_token: 'test-token',
    repository: { owner: 'test-owner', repo: 'test-repo' },
    commit_message: 'test commit message',
    show_title: 'true',
    locale: 'en-US',
    date_format: 'MM/dd/yyyy',
  };

  const mockOctokit = {
    rest: {
      repos: {
        getReadme: vi.fn(),
        createOrUpdateFileContents: vi.fn(),
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(github.getOctokit).mockReturnValue(
      mockOctokit as unknown as ReturnType<typeof github.getOctokit>,
    );
  });

  describe('getReadmeFile', () => {
    it('should fetch README file successfully', async () => {
      const mockReadmeContent = String.raw`# Test README\n<!--START_LASTFM_RECENT-->\n<!--END_LASTFM_RECENT-->`;
      const mockReadmeData = {
        data: {
          content: Buffer.from(mockReadmeContent).toString('base64'),
          encoding: 'base64',
          sha: 'test-sha-123',
        },
      };

      mockOctokit.rest.repos.getReadme.mockResolvedValue(mockReadmeData);

      const result = await getReadmeFile(mockInput);

      expect(mockOctokit.rest.repos.getReadme).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
      });

      expect(core.setOutput).toHaveBeenCalledWith(
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

      mockOctokit.rest.repos.getReadme.mockResolvedValue(mockReadmeData);

      const result = await getReadmeFile(mockInput);

      expect(result.content).toBe(mockReadmeContent);
      expect(result.hash).toBe('test-sha-456');
    });

    it('should throw error when README fetch fails', async () => {
      const error = new Error('Repository not found');
      mockOctokit.rest.repos.getReadme.mockRejectedValue(error);

      await expect(getReadmeFile(mockInput)).rejects.toThrow(
        '❌ Failed to fetch README.md from test-owner/test-repo: Repository not found',
      );
    });

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network timeout');
      mockOctokit.rest.repos.getReadme.mockRejectedValue(networkError);

      await expect(getReadmeFile(mockInput)).rejects.toThrow(
        '❌ Failed to fetch README.md from test-owner/test-repo: Network timeout',
      );
    });
  });

  describe('updateReadmeFile', () => {
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

      await updateReadmeFile(mockInput, mockFileHash, mockNewContent);

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
          name: 'lastfm-readme-bot',
          email: 'lastfm-readme@proton.me',
        },
      });

      expect(core.info).toHaveBeenCalledWith(
        '✅ README successfully updated with new charts',
      );
    });

    it('should handle custom commit messages', async () => {
      const customInput = {
        ...mockInput,
        commit_message: 'feat: update Last.fm metrics',
      };

      mockOctokit.rest.repos.createOrUpdateFileContents.mockResolvedValue({
        data: { commit: { sha: 'test' } },
      });

      await updateReadmeFile(customInput, mockFileHash, mockNewContent);

      expect(
        mockOctokit.rest.repos.createOrUpdateFileContents,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'feat: update Last.fm metrics',
        }),
      );
    });

    it('should encode content properly for different character sets', async () => {
      const contentWithUnicode =
        '# README with émojis 🎵 and special characters: äöü';

      mockOctokit.rest.repos.createOrUpdateFileContents.mockResolvedValue({
        data: { commit: { sha: 'test' } },
      });

      await updateReadmeFile(mockInput, mockFileHash, contentWithUnicode);

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

    it('should throw error when update fails', async () => {
      const updateError = new Error('Insufficient permissions');
      mockOctokit.rest.repos.createOrUpdateFileContents.mockRejectedValue(
        updateError,
      );

      await expect(
        updateReadmeFile(mockInput, mockFileHash, mockNewContent),
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
        updateReadmeFile(mockInput, mockFileHash, mockNewContent),
      ).rejects.toThrow(
        '❌ Failed to update README.md for test-owner/test-repo: File was modified since last fetch',
      );
    });

    it('should use correct committer information', async () => {
      mockOctokit.rest.repos.createOrUpdateFileContents.mockResolvedValue({
        data: { commit: { sha: 'test' } },
      });

      await updateReadmeFile(mockInput, mockFileHash, mockNewContent);

      expect(
        mockOctokit.rest.repos.createOrUpdateFileContents,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          committer: {
            name: 'lastfm-readme-bot',
            email: 'lastfm-readme@proton.me',
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

      await updateReadmeFile(mockInput, mockFileHash, largeContent);

      expect(
        mockOctokit.rest.repos.createOrUpdateFileContents,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          content: Buffer.from(largeContent, 'utf8').toString('base64'),
        }),
      );
    });
  });
});
