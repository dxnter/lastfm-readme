import * as core from '@actions/core';
import * as github from '@actions/github';
import * as R from 'ramda';
import LastFMTyped from 'lastfm-typed';
import { InvalidInputError } from './error';

export interface Input {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  lastfm_api_key: string;
  lastfm_user: string;
  gh_token: string;
  repository: { owner: string; repo: string };
  commit_message: string;
  show_title: string;
}

/**
 * Parse and validate the provided workflow input
 * @returns The parsed and validated workflow input
 */
export async function parseInput(): Promise<Input> {
  core.debug('Validating input variables');

  const input = {
    lastfm_api_key: core.getInput('LASTFM_API_KEY', { required: true }),
    lastfm_user: core.getInput('LASTFM_USER', { required: true }),
    gh_token: core.getInput('GH_TOKEN'),
    repository: {
      owner: '',
      repo: '',
    },
    commit_message:
      core.getInput('COMMIT_MESSAGE') || 'chore: update Last.fm charts',
    show_title:
      R.defaultTo('true', core.getInput('SHOW_TITLE') || 'true') === 'true'
        ? 'true'
        : 'false',
  };

  await new LastFMTyped(input.lastfm_api_key).auth.getToken();

  const repositoryInput = core.getInput('REPOSITORY');
  if (repositoryInput) {
    const [owner, repo] = repositoryInput.split('/');
    if (!owner || !repo) {
      throw new InvalidInputError(
        'The REPOSITORY input was provided in an invalid format. Please provide it in the format of "owner/repo"',
      );
    }
    input.repository = { owner, repo };
  } else {
    input.repository = github.context.repo;
  }

  if (!input.commit_message) {
    throw new InvalidInputError('The COMMIT_MESSAGE input cannot be empty.');
  }

  core.debug('Input validation complete\n');
  core.setOutput('input_parsed', 'true');
  return input;
}
