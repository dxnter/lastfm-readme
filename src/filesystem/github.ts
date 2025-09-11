import * as github from '@actions/github';

import type { GithubActionInput } from '../input';
import { logger } from '../utils/logger';
import type { FileSystemConfig, ReadmeFile, ReadmeFileSystem } from './types';

/**
 * GitHub Actions file system implementation using Octokit
 */
export class GitHubFileSystem implements ReadmeFileSystem {
  private readonly octokit: ReturnType<typeof github.getOctokit>;
  private readonly owner: string;
  private readonly repo: string;

  constructor(
    private input: GithubActionInput,
    private config: FileSystemConfig = {},
  ) {
    this.octokit = github.getOctokit(input.gh_token);
    this.owner = input.repository.owner;
    this.repo = input.repository.repo;
  }

  async readFile(path: string): Promise<string> {
    try {
      logger.debug(`🔍 Reading file: ${path}`);
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
      });

      if ('content' in data) {
        return Buffer.from(data.content, 'base64').toString('utf8');
      } else {
        throw new Error(`${path} is not a file`);
      }
    } catch (error) {
      throw new Error(
        `Failed to read file ${path} from ${this.owner}/${this.repo}: ${(error as Error).message}`,
      );
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    try {
      logger.debug(`📝 Writing file: ${path}`);

      // Try to get an existing file first for SHA
      let sha: string | undefined;
      try {
        const { data } = await this.octokit.rest.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path,
        });
        if ('sha' in data) {
          sha = data.sha;
        }
      } catch {
        // File doesn't exist, that's fine
      }

      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path,
        message: this.config.commitMessage || `Update ${path}`,
        content: Buffer.from(content, 'utf8').toString('base64'),
        sha,
        committer: {
          name: 'lastfm-readme-bot',
          email: 'lastfm-readme@proton.me',
        },
      });

      logger.debug(`✅ Successfully wrote file: ${path}`);
    } catch (error) {
      throw new Error(
        `Failed to write file ${path} to ${this.owner}/${this.repo}: ${(error as Error).message}`,
      );
    }
  }

  ensureDir(path: string): Promise<void> {
    // GitHub doesn't require directory creation - directories are implicit
    logger.debug(`📁 Directory ensured (implicit in GitHub): ${path}`);
    return Promise.resolve();
  }

  async fileExists(path: string): Promise<boolean> {
    try {
      await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fetches the README file content from the specified GitHub repository.
   * @param _path - Optional path to the README file (defaults to 'README.md') - currently unused
   * @returns A promise resolving to the README content and hash.
   * @throws Error if the README file cannot be retrieved.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getReadme(_path?: string): Promise<ReadmeFile> {
    try {
      logger.debug('🔍 Connecting to GitHub API to fetch README');
      const readme = await this.octokit.rest.repos.getReadme({
        owner: this.owner,
        repo: this.repo,
      });

      logger.setOutput('readme_hash', readme.data.sha);
      logger.debug(
        `📥 Successfully fetched README content from ${this.owner}/${this.repo}`,
      );

      return {
        content: Buffer.from(
          readme.data.content,
          readme.data.encoding as BufferEncoding,
        ).toString('utf8'),
        hash: readme.data.sha,
      };
    } catch (error) {
      throw new Error(
        `❌ Failed to fetch README.md from ${this.owner}/${this.repo}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Updates the README file with new content in the specified GitHub repository.
   * @param content - The updated content to be written to the README.
   * @param options - Options containing hash and commit message
   * @param options.hash - The current hash of the README file to ensure content integrity.
   * @param options.message - Optional custom commit message
   * @returns A promise resolving when the update is complete.
   * @throws Error if the update operation fails.
   */
  async updateReadme(
    content: string,
    options?: { hash?: string; message?: string },
  ): Promise<void> {
    try {
      logger.debug(
        `🚀 Preparing to update README.md for ${this.owner}/${this.repo}`,
      );

      const message =
        options?.message ||
        this.config.commitMessage ||
        this.input.commit_message;
      const sha = options?.hash;

      if (!sha) {
        throw new Error(
          'Hash is required for README updates in GitHub Actions',
        );
      }

      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: 'README.md',
        message,
        content: Buffer.from(content, 'utf8').toString('base64'),
        sha,
        committer: {
          name: 'lastfm-readme-bot',
          email: 'lastfm-readme@proton.me',
        },
      });

      logger.info('✅ README successfully updated with new charts');
    } catch (error) {
      throw new Error(
        `❌ Failed to update README.md for ${this.owner}/${this.repo}: ${(error as Error).message}`,
      );
    }
  }
}
