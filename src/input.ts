import * as core from '@actions/core';
import * as github from '@actions/github';
import * as R from 'ramda';
import LastFMTyped from 'lastfm-typed';
import { InvalidInputError } from './error';

export interface Input {
  lastfm_api_key: string;
  lastfm_user: string;
  gh_token: string;
  repository: { owner: string; repo: string };
  commit_message: string;
  show_title: string;
  locale: string;
  date_format: string;
}

/**
 * Parse and validate the provided workflow input
 * @returns The parsed and validated workflow input
 */
export async function parseInput(): Promise<Input> {
  core.debug('Validating input variables');

  const lastfmApiKey = core.getInput('LASTFM_API_KEY', { required: true });
  const lastfmUser = core.getInput('LASTFM_USER', { required: true });
  const ghToken = core.getInput('GH_TOKEN');
  const commitMessage =
    core.getInput('COMMIT_MESSAGE') || 'chore: update Last.fm sections';
  const showTitle =
    R.defaultTo('true', core.getInput('SHOW_TITLE') || 'true') === 'true'
      ? 'true'
      : 'false';
  const locale = core.getInput('LOCALE') || 'en-US';
  const dateFormat = core.getInput('DATE_FORMAT') || 'MM/dd/yyyy';

  const repositoryInput = core.getInput('REPOSITORY');
  let repository: { owner: string; repo: string };
  if (repositoryInput) {
    const [owner, repo] = repositoryInput.split('/');
    if (!owner || !repo) {
      throw new InvalidInputError(
        'The REPOSITORY input was provided in an invalid format. Please provide it in the format of "owner/repo"',
      );
    }
    repository = { owner, repo };
  } else {
    repository = github.context.repo;
  }

  await new LastFMTyped(lastfmApiKey).auth.getToken();

  return {
    lastfm_api_key: lastfmApiKey,
    lastfm_user: lastfmUser,
    gh_token: ghToken,
    repository,
    commit_message: commitMessage,
    show_title: showTitle,
    locale,
    date_format: dateFormat,
  };
}
