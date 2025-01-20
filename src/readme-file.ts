import * as core from '@actions/core';
import * as github from '@actions/github';

import type { GithubActionInput } from './input';

interface Readme {
  content: string;
  hash: string;
}

/**
 * Fetches the README file content from the specified GitHub repository.
 * @param input - The input containing GitHub credentials and repository details.
 * @returns A promise resolving to the README content and hash.
 * @throws Error if the README file cannot be retrieved.
 */
export async function getReadmeFile(input: GithubActionInput): Promise<Readme> {
  core.debug('🔍 Connecting to GitHub API to fetch README');
  const octokit = github.getOctokit(input.gh_token);
  const { owner, repo } = input.repository;

  try {
    const readme = await octokit.rest.repos.getReadme({ owner, repo });
    core.setOutput('readme_hash', readme.data.sha);
    core.debug(`📥 Successfully fetched README content from ${owner}/${repo}`);

    return {
      content: Buffer.from(
        readme.data.content,
        readme.data.encoding as BufferEncoding,
      ).toString('utf8'),
      hash: readme.data.sha,
    };
  } catch (error) {
    throw new Error(
      `❌ Failed to fetch README.md from ${owner}/${repo}: ${(error as Error).message}`,
    );
  }
}

/**
 * Updates the README file with new content in the specified GitHub repository.
 * @param input - The input containing GitHub credentials and repository details.
 * @param fileHash - The current hash of the README file to ensure content integrity.
 * @param newContent - The updated content to be written to the README.
 * @returns A promise resolving when the update is complete.
 * @throws Error if the update operation fails.
 */
export async function updateReadmeFile(
  input: GithubActionInput,
  fileHash: string,
  newContent: string,
): Promise<void> {
  core.debug(
    `🚀 Preparing to update README.md for ${input.repository.owner}/${input.repository.repo}`,
  );
  const octokit = github.getOctokit(input.gh_token);
  const { owner, repo } = input.repository;

  try {
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'README.md',
      message: input.commit_message,
      content: Buffer.from(newContent, 'utf8').toString('base64'),
      sha: fileHash,
      committer: {
        name: 'lastfm-readme-bot',
        email: 'lastfm-readme@proton.me',
      },
    });

    core.info('✅ README successfully updated with new charts');
  } catch (error) {
    throw new Error(
      `❌ Failed to update README.md for ${owner}/${repo}: ${(error as Error).message}`,
    );
  }
}
