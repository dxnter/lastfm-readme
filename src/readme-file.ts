import * as core from '@actions/core';
import * as github from '@actions/github';

import type { Input } from './input';

interface Readme {
  content: string;
  hash: string;
}

export async function getReadmeFile(input: Input): Promise<Readme> {
  core.debug('Connecting to GitHub API');
  const octokit = github.getOctokit(input.gh_token);
  const { owner, repo } = input.repository;

  const readme = await octokit.rest.repos.getReadme({ owner, repo });
  core.setOutput('readme_hash', readme.data.sha);
  core.debug(`Fetched README content from ${owner}/${repo}\n`);

  return {
    content: Buffer.from(
      readme.data.content,
      readme.data.encoding as BufferEncoding,
    ).toString('utf8'),
    hash: readme.data.sha,
  };
}

export async function updateReadmeFile(
  input: Input,
  fileHash: string,
  newContent: string,
): Promise<void> {
  const octokit = github.getOctokit(input.gh_token);
  const { owner, repo } = input.repository;
  core.debug(`Updating README.md content for ${owner}/${repo}\n`);

  octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: 'README.md',
    message: input.commit_message,
    content: Buffer.from(newContent).toString('base64'),
    sha: fileHash,
    committer: {
      name: 'lastfm-readme-bot',
      email: 'lastfm-readme@proton.me',
    },
  });

  core.info(`✅ README successfully updated with new charts`);
}
