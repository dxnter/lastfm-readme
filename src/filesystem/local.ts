import fs from 'node:fs/promises';
import path from 'node:path';

import type { FileSystemConfig, ReadmeFile, ReadmeFileSystem } from './types';

/**
 * Local file system implementation for development
 */
export class LocalFileSystem implements ReadmeFileSystem {
  constructor(private config: FileSystemConfig = {}) {}

  async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      }
      throw new Error(
        `Failed to read file ${filePath}: ${(error as Error).message}`,
      );
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      await this.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content, 'utf8');
    } catch (error) {
      throw new Error(
        `Failed to write file ${filePath}: ${(error as Error).message}`,
      );
    }
  }

  async ensureDir(directoryPath: string): Promise<void> {
    try {
      await fs.mkdir(directoryPath, { recursive: true });
    } catch (error) {
      throw new Error(
        `Failed to create directory ${directoryPath}: ${(error as Error).message}`,
      );
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Reads the README file from the local filesystem.
   * @param filePath - Optional path to the README file
   * @returns A promise resolving to the README content
   * @throws Error if the README file cannot be found or read.
   */
  async getReadme(filePath?: string): Promise<ReadmeFile> {
    const path = filePath || this.config.readmePath || './local/README.md';

    if (!(await this.fileExists(path))) {
      throw new Error(`README file not found: ${path}`);
    }

    const content = await this.readFile(path);
    return {
      content,
    };
  }

  /**
   * Updates the README file with new content in the local filesystem.
   * @param content - The updated content to be written to the README.
   * @param _options - Options containing hash and message (ignored for local operations)
   * @returns A promise resolving when the update is complete.
   * @throws Error if the update operation fails.
   */
  async updateReadme(
    content: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options?: { hash?: string; message?: string },
  ): Promise<void> {
    const filePath = this.config.readmePath || './README.md';
    await this.writeFile(filePath, content);
  }
}
