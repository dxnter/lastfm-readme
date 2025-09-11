import { CLI } from 'src/utils/cli';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('cLI', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('printHeader', () => {
    it('should print formatted header', () => {
      CLI.printHeader('Test Title');

      expect(consoleLogSpy).toHaveBeenCalledTimes(5);
      expect(consoleLogSpy.mock.calls[0]![0]).toBeUndefined(); // Empty line
      expect(consoleLogSpy.mock.calls[1]![0]).toContain('╔'); // Top border
      expect(consoleLogSpy.mock.calls[2]![0]).toContain('Test Title'); // Title line
      expect(consoleLogSpy.mock.calls[3]![0]).toContain('╚'); // Bottom border
      expect(consoleLogSpy.mock.calls[4]![0]).toBeUndefined(); // Empty line
    });
  });

  describe('printConfig', () => {
    it('should print configuration object', () => {
      const config = {
        'Key 1': 'Value 1',
        'Key 2': 'Value 2',
      };

      CLI.printConfig(config);

      expect(consoleLogSpy).toHaveBeenCalledTimes(6);
      expect(consoleLogSpy.mock.calls[1]![0]).toContain('Configuration');
      expect(consoleLogSpy.mock.calls[3]![0]).toContain('Key 1');
      expect(consoleLogSpy.mock.calls[3]![0]).toContain('Value 1');
      expect(consoleLogSpy.mock.calls[4]![0]).toContain('Key 2');
      expect(consoleLogSpy.mock.calls[4]![0]).toContain('Value 2');
    });

    it('should handle empty configuration object', () => {
      CLI.printConfig({});

      expect(consoleLogSpy).toHaveBeenCalledTimes(4); // Empty line, header, separator, empty line
      expect(consoleLogSpy.mock.calls[1]![0]).toContain('Configuration');
    });
  });

  describe('printStatus', () => {
    it('should print status message', () => {
      CLI.printStatus('Processing data');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('🔄 Processing data'),
      );
    });
  });

  describe('printSuccess', () => {
    it('should print success message', () => {
      CLI.printSuccess('Operation completed');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅ Operation completed'),
      );
    });
  });

  describe('printInfo', () => {
    it('should print info message', () => {
      CLI.printInfo('Information message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('ℹ️  Information message'),
      );
    });
  });

  describe('printFailure', () => {
    it('should print failure message', () => {
      CLI.printFailure('Operation failed');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ Operation failed'),
      );
    });
  });

  describe('printWarning', () => {
    it('should print warning message', () => {
      CLI.printWarning('Warning message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('⚠️ Warning message'),
      );
    });
  });

  describe('printSectionResults', () => {
    it('should print no sections message when empty array', () => {
      CLI.printSectionResults([]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('No sections found'),
      );
    });

    it('should print table for success sections', () => {
      const sections = [
        {
          name: 'LASTFM_ARTISTS',
          count: 3,
          processed: 3,
          updated: 2,
          status: 'success' as const,
        },
      ];

      CLI.printSectionResults(sections);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(
        consoleLogSpy.mock.calls.some(
          (call) => typeof call[0] === 'string' && call[0].includes('Artists'),
        ),
      ).toBe(true);
    });

    it('should handle success sections with no updates', () => {
      const sections = [
        {
          name: 'LASTFM_TRACKS',
          count: 2,
          processed: 2,
          updated: 0,
          status: 'success' as const,
        },
      ];

      CLI.printSectionResults(sections);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should print table for error sections', () => {
      const sections = [
        {
          name: 'LASTFM_RECENT',
          count: 1,
          processed: 1,
          updated: 0,
          status: 'error' as const,
          error: 'API connection failed',
        },
      ];

      CLI.printSectionResults(sections);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(
        consoleLogSpy.mock.calls.some(
          (call) =>
            typeof call[0] === 'string' &&
            call[0].includes('API connection failed'),
        ),
      ).toBe(true);
    });

    it('should handle error sections without error message', () => {
      const sections = [
        {
          name: 'LASTFM_ALBUMS',
          count: 1,
          processed: 1,
          updated: 0,
          status: 'error' as const,
        },
      ];

      CLI.printSectionResults(sections);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should print table for unchanged sections', () => {
      const sections = [
        {
          name: 'LASTFM_USER_INFO',
          count: 1,
          processed: 1,
          updated: 0,
          status: 'unchanged' as const,
        },
      ];

      CLI.printSectionResults(sections);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should format section names correctly', () => {
      const sections = [
        {
          name: 'LASTFM_USER_INFO',
          count: 1,
          processed: 1,
          updated: 0,
          status: 'success' as const,
        },
      ];

      CLI.printSectionResults(sections);

      // Should convert LASTFM_USER_INFO to "User Info"
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(
        consoleLogSpy.mock.calls.some(
          (call) =>
            typeof call[0] === 'string' && call[0].includes('User Info'),
        ),
      ).toBe(true);
    });
  });

  describe('printSummary', () => {
    it('should print success summary when changes made', () => {
      const stats = {
        sectionsProcessed: 5,
        sectionsUpdated: 3,
        duration: 1500,
        hasChanges: true,
        readmePath: '/path/to/README.md',
      };

      CLI.printSummary(stats);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(
        consoleLogSpy.mock.calls.some(
          (call) =>
            typeof call[0] === 'string' &&
            call[0].includes('README Updated Successfully'),
        ),
      ).toBe(true);
      expect(
        consoleLogSpy.mock.calls.some(
          (call) => typeof call[0] === 'string' && call[0].includes('5'),
        ),
      ).toBe(true);
      expect(
        consoleLogSpy.mock.calls.some(
          (call) => typeof call[0] === 'string' && call[0].includes('3'),
        ),
      ).toBe(true);
    });

    it('should print no changes summary when no changes made', () => {
      const stats = {
        sectionsProcessed: 2,
        sectionsUpdated: 0,
        duration: 800,
        hasChanges: false,
        readmePath: './local/DEVELOPMENT.md',
      };

      CLI.printSummary(stats);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(
        consoleLogSpy.mock.calls.some(
          (call) =>
            typeof call[0] === 'string' && call[0].includes('No Changes Made'),
        ),
      ).toBe(true);
      expect(
        consoleLogSpy.mock.calls.some(
          (call) =>
            typeof call[0] === 'string' && call[0].includes('DEVELOPMENT.md'),
        ),
      ).toBe(true);
    });

    it('should handle path with just filename', () => {
      const stats = {
        sectionsProcessed: 1,
        sectionsUpdated: 0,
        duration: 500,
        hasChanges: false,
        readmePath: 'README.md',
      };

      CLI.printSummary(stats);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(
        consoleLogSpy.mock.calls.some(
          (call) =>
            typeof call[0] === 'string' && call[0].includes('README.md'),
        ),
      ).toBe(true);
    });

    it('should handle empty path gracefully', () => {
      const stats = {
        sectionsProcessed: 1,
        sectionsUpdated: 0,
        duration: 500,
        hasChanges: false,
        readmePath: '',
      };

      CLI.printSummary(stats);

      expect(consoleLogSpy).toHaveBeenCalled();
      // Should fall back to the original empty readmePath when split("/").pop() returns empty
    });
  });

  describe('printError', () => {
    it('should print error with Error object', () => {
      const error = new Error('Test error message');

      CLI.printError(error);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(
        consoleLogSpy.mock.calls.some(
          (call) =>
            typeof call[0] === 'string' && call[0].includes('Operation Failed'),
        ),
      ).toBe(true);
      expect(
        consoleLogSpy.mock.calls.some(
          (call) =>
            typeof call[0] === 'string' &&
            call[0].includes('Test error message'),
        ),
      ).toBe(true);
    });

    it('should print error with string message', () => {
      CLI.printError('Simple error message');

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(
        consoleLogSpy.mock.calls.some(
          (call) =>
            typeof call[0] === 'string' &&
            call[0].includes('Simple error message'),
        ),
      ).toBe(true);
    });

    it('should handle very long error messages with word wrapping', () => {
      const longMessage =
        'This is a very long error message that should be wrapped across multiple lines when displayed in the terminal because it exceeds the maximum width';

      CLI.printError(longMessage);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(
        consoleLogSpy.mock.calls.some(
          (call) =>
            typeof call[0] === 'string' &&
            call[0].includes('This is a very long error message'),
        ),
      ).toBe(true);
    });

    it('should handle short error messages', () => {
      CLI.printError('Short');

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(
        consoleLogSpy.mock.calls.some(
          (call) => typeof call[0] === 'string' && call[0].includes('Short'),
        ),
      ).toBe(true);
    });
  });

  describe('formatDuration (private method behavior)', () => {
    it('should format duration in milliseconds for values under 1000ms', () => {
      const stats = {
        sectionsProcessed: 1,
        sectionsUpdated: 0,
        duration: 500, // Less than 1000 ms
        hasChanges: false,
        readmePath: 'README.md',
      };

      CLI.printSummary(stats);

      expect(
        consoleLogSpy.mock.calls.some(
          (call) => typeof call[0] === 'string' && call[0].includes('500ms'),
        ),
      ).toBe(true);
    });

    it('should format duration in seconds for values 1000ms and above', () => {
      const stats = {
        sectionsProcessed: 1,
        sectionsUpdated: 0,
        duration: 2500, // 2.5 seconds
        hasChanges: false,
        readmePath: 'README.md',
      };

      CLI.printSummary(stats);

      expect(
        consoleLogSpy.mock.calls.some(
          (call) => typeof call[0] === 'string' && call[0].includes('2.5s'),
        ),
      ).toBe(true);
    });
  });
});
