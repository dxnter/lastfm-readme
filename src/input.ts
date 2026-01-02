import * as core from '@actions/core';
import * as github from '@actions/github';
import LastFMTyped from 'lastfm-typed';
import * as R from 'ramda';

import { InvalidInputError } from './error';
import { logger } from './utils/logger';

/**
 * Structure representing parsed input parameters for the GitHub Action.
 */
export interface GithubActionInput {
  lastfm_api_key: string;
  lastfm_user: string;
  gh_token: string;
  repository: { owner: string; repo: string };
  target_file: string;
  commit_message: string;
  show_title: string;
  locale: string;
  date_format: string;
}

/**
 * Parses and validates the provided workflow input.
 * @returns A promise resolving to the validated input.
 * @throws InvalidInputError if any required input is missing or in an invalid format.
 */
export async function parseInput(): Promise<GithubActionInput> {
  logger.debug('🔍 Validating input variables');

  // Required inputs
  const lastfmApiKey = core
    .getInput('LASTFM_API_KEY', { required: true })
    .trim();
  const lastfmUser = core.getInput('LASTFM_USER', { required: true }).trim();

  // Optional inputs
  const ghToken = core.getInput('GH_TOKEN').trim();
  const targetFile = core.getInput('TARGET_FILE').trim() || 'README.md';
  const commitMessage =
    core.getInput('COMMIT_MESSAGE').trim() || 'chore: update Last.fm sections';
  const showTitle =
    R.defaultTo('true', core.getInput('SHOW_TITLE') || 'true') === 'true'
      ? 'true'
      : 'false';
  const locale = core.getInput('LOCALE').trim() || 'en-US';
  const dateFormat = core.getInput('DATE_FORMAT').trim() || 'MM/dd/yyyy';

  const repositoryInput = core.getInput('REPOSITORY').trim();
  const repository = parseRepository(repositoryInput);

  await validateLastFmApiKey(lastfmApiKey);

  return {
    lastfm_api_key: lastfmApiKey,
    lastfm_user: lastfmUser,
    gh_token: ghToken,
    repository,
    target_file: targetFile,
    commit_message: commitMessage,
    show_title: showTitle,
    locale,
    date_format: dateFormat,
  };
}

/**
 * Parses and validates the repository input.
 * @param repositoryInput - The repository string input.
 * @returns An object containing owner and repo properties.
 * @throws InvalidInputError if the repository input format is invalid.
 */
function parseRepository(repositoryInput: string): {
  owner: string;
  repo: string;
} {
  if (repositoryInput) {
    const [owner, repo] = repositoryInput.split('/').map((s) => s.trim());
    if (!owner || !repo) {
      throw new InvalidInputError(
        '❌ Invalid REPOSITORY input. Please provide it in the format "owner/repo".',
      );
    }
    return { owner, repo };
  }
  return github.context.repo;
}

/**
 * Validates the provided Last.fm API key by making a test request.
 * @param apiKey - The Last.fm API key to validate.
 * @throws Error if the API key is invalid.
 */
async function validateLastFmApiKey(apiKey: string): Promise<void> {
  try {
    await new LastFMTyped(apiKey).auth.getToken();
    logger.debug('✅ Last.fm API key validation successful');
  } catch {
    throw new InvalidInputError(
      '❌ Failed to validate Last.fm API key. Please check its validity.',
    );
  }
}
