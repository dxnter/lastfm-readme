import * as core from '@actions/core';
import { logger } from 'src/utils/logger';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock @actions/core
vi.mock('@actions/core');
const mockCore = vi.mocked(core);

describe('logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear environment variables
    delete process.env.GITHUB_ACTIONS;
    delete process.env.NODE_ENV;
    delete process.env.VITEST;
  });

  describe('debug', () => {
    it('should call core.debug when in GitHub Actions environment', () => {
      process.env.GITHUB_ACTIONS = 'true';

      logger.debug('test debug message');

      expect(mockCore.debug).toHaveBeenCalledWith('test debug message');
    });

    it('should not call core.debug when not in GitHub Actions environment', () => {
      logger.debug('test debug message');

      expect(mockCore.debug).not.toHaveBeenCalled();
    });
  });

  describe('info', () => {
    it('should call core.info when in GitHub Actions environment', () => {
      process.env.GITHUB_ACTIONS = 'true';

      logger.info('test info message');

      expect(mockCore.info).toHaveBeenCalledWith('test info message');
    });

    it('should not call core.info when not in GitHub Actions environment', () => {
      logger.info('test info message');

      expect(mockCore.info).not.toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should always call core.error regardless of environment', () => {
      logger.error('test error message');

      expect(mockCore.error).toHaveBeenCalledWith('test error message');
    });

    it('should call core.error even in GitHub Actions environment', () => {
      process.env.GITHUB_ACTIONS = 'true';

      logger.error('test error message');

      expect(mockCore.error).toHaveBeenCalledWith('test error message');
    });
  });

  describe('setOutput', () => {
    it('should call core.setOutput when in GitHub Actions environment', () => {
      process.env.GITHUB_ACTIONS = 'true';

      logger.setOutput('output-name', 'output-value');

      expect(mockCore.setOutput).toHaveBeenCalledWith(
        'output-name',
        'output-value',
      );
    });

    it('should not call core.setOutput when not in GitHub Actions environment', () => {
      logger.setOutput('output-name', 'output-value');

      expect(mockCore.setOutput).not.toHaveBeenCalled();
    });
  });

  describe('setFailed', () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should call core.setFailed when in GitHub Actions environment', () => {
      process.env.GITHUB_ACTIONS = 'true';

      logger.setFailed('test failure message');

      expect(mockCore.setFailed).toHaveBeenCalledWith('test failure message');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should log error to console in test environment', () => {
      process.env.NODE_ENV = 'test';

      logger.setFailed('test failure message');

      expect(mockCore.setFailed).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error: test failure message',
      );
    });

    it('should log error to console in vitest environment', () => {
      process.env.VITEST = 'true';

      logger.setFailed('test failure message');

      expect(mockCore.setFailed).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error: test failure message',
      );
    });

    it('should handle undefined message in test environment', () => {
      process.env.NODE_ENV = 'test';

      logger.setFailed('');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Unknown error');
    });

    it('should throw error in local development environment', () => {
      // Not in GitHub Actions, test, or vitest environment
      expect(() => logger.setFailed('test failure message')).toThrow(
        'test failure message',
      );
    });

    it('should throw default error message in local development when message is empty', () => {
      expect(() => logger.setFailed('')).toThrow('Unknown error');
    });

    it('should prioritize GitHub Actions environment over test environment', () => {
      process.env.GITHUB_ACTIONS = 'true';
      process.env.NODE_ENV = 'test';

      logger.setFailed('test failure message');

      expect(mockCore.setFailed).toHaveBeenCalledWith('test failure message');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});
