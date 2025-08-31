import path from 'node:path';
import { loadEnvFile } from 'node:process';

import { z } from 'zod';

import { InvalidInputError } from '../error';
import type { GithubActionInput } from '../input';
import type { LocalConfig, LocalInput } from './types';

const LocalInputSchema = z.object({
  LASTFM_API_KEY: z.string().min(1, 'LASTFM_API_KEY is required'),
  LASTFM_USER: z.string().min(1, 'LASTFM_USER is required'),
  README_PATH: z.string().optional().default('local/README.md'),
  SHOW_TITLE: z.string().optional().default('true'),
  LOCALE: z.string().optional().default('en-US'),
  DATE_FORMAT: z.string().optional().default('MM/dd/yyyy'),
  COMMIT_MESSAGE: z
    .string()
    .optional()
    .default('chore: update Last.fm sections'),
});

export function parseLocalInput(): LocalConfig {
  console.log('🔍 Loading local environment configuration...');

  try {
    loadEnvFile('.env');
    console.log('✅ Loaded .env file');
  } catch {
    console.warn('⚠️ No .env file found, using environment variables');
  }

  const environmentValidation = LocalInputSchema.safeParse(process.env);

  if (!environmentValidation.success) {
    const errors = environmentValidation.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new InvalidInputError(
      `Invalid environment configuration:\n${errors}`,
    );
  }

  const environment = environmentValidation.data;

  const localInput: LocalInput = {
    lastfm_api_key: environment.LASTFM_API_KEY,
    lastfm_user: environment.LASTFM_USER,
    readme_path: environment.README_PATH,
    show_title: environment.SHOW_TITLE,
    locale: environment.LOCALE,
    date_format: environment.DATE_FORMAT,
    commit_message: environment.COMMIT_MESSAGE,
  };

  const readmePath = path.resolve(environment.README_PATH);

  const config: LocalConfig = {
    readmePath,
    input: localInput,
  };

  console.log(`📄 README path: ${config.readmePath}`);
  console.log(`👤 Last.fm user: ${localInput.lastfm_user}`);

  return config;
}
export function convertToGithubActionInput(
  localConfig: LocalConfig,
): GithubActionInput {
  return {
    lastfm_api_key: localConfig.input.lastfm_api_key,
    lastfm_user: localConfig.input.lastfm_user,
    gh_token: '',
    repository: { owner: 'local', repo: 'dev' },
    commit_message:
      localConfig.input.commit_message || 'chore: update Last.fm sections',
    show_title: localConfig.input.show_title || 'true',
    locale: localConfig.input.locale || 'en-US',
    date_format: localConfig.input.date_format || 'MM/dd/yyyy',
  };
}
