import chalk from 'chalk';
import Table from 'cli-table3';

/**
 * CLI utility functions for terminal output
 */
export class CLI {
  static printHeader(title: string): void {
    const width = 60;
    const border = '═'.repeat(width);

    console.log();
    console.log(chalk.white(`╔${border}╗`));
    console.log(
      chalk.white('║') +
        chalk.bold.red(
          title.padStart((width + title.length) / 2).padEnd(width),
        ) +
        chalk.white('║'),
    );

    console.log(chalk.white(`╚${border}╝`));
    console.log();
  }

  /**
   * @param config - Configuration object
   */
  static printConfig(config: Record<string, string>): void {
    console.log();

    console.log(chalk.bold.blue('📋 Configuration'));
    console.log(chalk.blue('─'.repeat(40)));

    for (const [key, value] of Object.entries(config)) {
      console.log(
        `${chalk.gray('•')} ${chalk.cyan(key)}: ${chalk.white(value)}`,
      );
    }

    console.log();
  }

  /**
   * Print a status message
   * @param text - Status text to display
   */
  static printStatus(text: string): void {
    console.log(chalk.yellow(`🔄 ${text}`));
  }

  /**
   * Print a success message
   * @param text - Success text to display
   */
  static printSuccess(text: string): void {
    console.log(chalk.green(`✅ ${text}`));
  }

  /**
   * Print an info message
   * @param text - Info text to display
   */
  static printInfo(text: string): void {
    console.log(chalk.blue(`ℹ️  ${text}`));
  }

  /**
   * Print a failure message
   * @param text - Failure text to display
   */
  static printFailure(text: string): void {
    console.log(chalk.red(`❌ ${text}`));
  }

  /**
   * Print a warning message
   * @param text - Warning text to display
   */
  static printWarning(text: string): void {
    console.log(chalk.red(`⚠️ ${text}`));
  }

  /**
   * Print section processing status
   * @param sections - Array of section results
   */
  static printSectionResults(
    sections: Array<{
      name: string;
      count: number;
      processed: number;
      updated: number;
      status: 'success' | 'error' | 'unchanged';
      error?: string;
    }>,
  ): void {
    if (sections.length === 0) {
      console.log(chalk.yellow('ℹ️  No sections found in README'));
      return;
    }

    const table = new Table({
      head: [
        chalk.bold.white('Section'),
        chalk.bold.white('Count'),
        chalk.bold.white('Status'),
        chalk.bold.white('Message'),
      ],
      colWidths: [20, 8, 12, 30],
      style: {
        head: [],
        border: ['cyan'],
      },
    });

    for (const section of sections) {
      const sectionName = section.name
        .replace('LASTFM_', '')
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      let statusText = '';
      let message = '';

      switch (section.status) {
        case 'success': {
          if (section.updated > 0) {
            statusText = chalk.green('Updated');
            message = chalk.green(`${section.updated} updated`);
          } else {
            statusText = chalk.blue('Unchanged');
            message = chalk.gray('No changes needed');
          }
          break;
        }
        case 'error': {
          statusText = chalk.red('Error');
          message = chalk.red(section.error || 'Unknown error');

          break;
        }
        case 'unchanged': {
          statusText = chalk.blue('Unchanged');
          message = chalk.gray('No changes needed');

          break;
        }
      }

      table.push([
        chalk.white(sectionName),
        chalk.yellow(section.count.toString()),
        statusText,
        message,
      ]);
    }

    console.log();
    console.log(chalk.bold.blue('📊 Processing Results'));
    console.log(table.toString());
    console.log();
  }

  /**
   * Print final summary statistics
   * @param stats - Summary statistics
   */
  static printSummary(stats: {
    sectionsProcessed: number;
    sectionsUpdated: number;
    duration: number;
    hasChanges: boolean;
    readmePath: string;
  }): void {
    const header = stats.hasChanges
      ? chalk.bold.green('🎉 README Updated Successfully!')
      : chalk.bold.yellow('ℹ️  No Changes Made');

    console.log('\n' + header + '\n');

    console.log(
      `${chalk.gray('•')} Sections processed: ${chalk.yellow(stats.sectionsProcessed)}`,
    );
    console.log(
      `${chalk.gray('•')} Sections updated:   ${stats.sectionsUpdated > 0 ? chalk.green(stats.sectionsUpdated) : chalk.dim(stats.sectionsUpdated.toString())}`,
    );
    console.log(
      `${chalk.gray('•')} Duration:           ${chalk.blue(CLI.formatDuration(stats.duration))}`,
    );
    console.log(
      `${chalk.gray('•')} README:             ${chalk.magenta(stats.readmePath.split('/').pop() || stats.readmePath)}\n`,
    );
  }

  /**
   * Print error message with nice formatting
   * @param error - Error object or message
   */
  static printError(error: Error | string): void {
    const message = typeof error === 'string' ? error : error.message;
    const width = Math.min(60, Math.max(40, message.length + 10));
    const border = '═'.repeat(width);

    console.log();
    console.log(chalk.red(`╔${border}╗`));
    console.log(
      chalk.red('║') +
        chalk.bold.red(
          '❌ Operation Failed'
            .padStart((width + '❌ Operation Failed'.length) / 2)
            .padEnd(width),
        ) +
        chalk.red('║'),
    );
    console.log(chalk.red(`╠${border}╣`));

    // Word wrap the error message
    const words = message.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + word).length > width - 4) {
        if (currentLine) lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    }

    if (currentLine) lines.push(currentLine.trim());

    for (const line of lines) {
      console.log(
        chalk.red('║') + chalk.white(` ${line}`.padEnd(width)) + chalk.red('║'),
      );
    }

    console.log(chalk.red(`╚${border}╝`));
    console.log();
    console.log(chalk.yellow('💡 Check your configuration and try again'));
    console.log();
  }

  /**
   * Format duration in a human-readable way
   * @param ms - Duration in milliseconds
   * @returns Formatted duration string
   */
  private static formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  }
}
