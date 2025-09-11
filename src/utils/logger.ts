import * as core from '@actions/core';

/**
 * Logger utility that conditionally outputs debug messages based on environment
 */
export const logger = {
  /**
   * Debug logging that only outputs in GitHub Actions environment
   * @param message - Debug message to log
   */
  debug: (message: string): void => {
    if (process.env.GITHUB_ACTIONS) {
      core.debug(message);
    }
  },

  /**
   * Info logging that only outputs in GitHub Actions environment
   * @param message - Info message to log
   */
  info: (message: string): void => {
    if (process.env.GITHUB_ACTIONS) {
      core.info(message);
    }
  },

  /**
   * Always output error messages
   * @param message - Error message to log
   */
  error: (message: string): void => {
    core.error(message);
  },

  /**
   * Set output only in GitHub Actions environment
   * @param name - Output name
   * @param value - Output value
   */
  setOutput: (name: string, value: string): void => {
    if (process.env.GITHUB_ACTIONS) {
      core.setOutput(name, value);
    }
  },

  /**
   * Set failed only in GitHub Actions environment
   * @param message - Failure message
   */
  setFailed: (message: string): void => {
    if (process.env.GITHUB_ACTIONS) {
      core.setFailed(message);
    } else if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
      // In test environment, just log the error instead of throwing
      console.error(`Error: ${message || 'Unknown error'}`);
    } else {
      // In local development, throw the error
      throw new Error(message || 'Unknown error');
    }
  },
};
