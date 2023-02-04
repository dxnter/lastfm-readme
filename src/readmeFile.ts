import * as core from '@actions/core';
import * as github from '@actions/github';
import type { Input } from './input';

interface Readme {
  content: string;
  hash: string;
}

export async function getReadmeFile(input: Input): Promise<Readme> {
  const octokit = github.getOctokit(input.gh_token);
  const { owner, repo } = input.repository;
  core.info(`Getting README content from ${owner}/${repo}`);

  const readme = await octokit.rest.repos.getReadme({ owner, repo });
  core.setOutput('readme_content', readme.data.content);
  core.setOutput('readme_hash', readme.data.sha);

  return {
    content: Buffer.from(
      readme.data.content,
      readme.data.encoding as BufferEncoding,
    ).toString('utf-8'),
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

  core.info(`Updated README.md contents for ${owner}/${repo}`);
}
