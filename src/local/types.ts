/**
 * Interface representing raw input parameters for local development mode.
 * These parameters are typically loaded from environment variables or .env files.
 */
export interface LocalInput {
  /** Last.fm API key for authentication */
  lastfm_api_key: string;
  /** Last.fm username to fetch data for */
  lastfm_user: string;
  /** Optional path to the README file (defaults to './README.md') */
  readme_path?: string;
  /** Whether to show section titles (defaults to 'true') */
  show_title?: string;
  /** Locale for number and date formatting (defaults to 'en-US') */
  locale?: string;
  /** Date format string for user info display (defaults to 'MM/dd/yyyy') */
  date_format?: string;
  /** Commit message for local development (not used in local mode) */
  commit_message?: string;
}

/**
 * Interface representing processed configuration for local development.
 * Contains validated and normalized input parameters ready for use.
 */
export interface LocalConfig {
  /** Absolute path to the README file to be updated */
  readmePath: string;
  /** Processed and validated input parameters */
  input: LocalInput;
}
