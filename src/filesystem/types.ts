/**
 * Core file system operations interface
 */
export interface FileSystemOperations {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  ensureDir(path: string): Promise<void>;
  fileExists(path: string): Promise<boolean>;
}

/**
 * README-specific operations with content tracking
 */
export interface ReadmeFile {
  content: string;
  hash?: string; // Optional hash for GitHub operations
}

/**
 * Enhanced file system operations for README management
 */
export interface ReadmeFileSystem extends FileSystemOperations {
  /**
   * Read README file with metadata
   */
  getReadme(path?: string): Promise<ReadmeFile>;

  /**
   * Update README file with content tracking
   */
  updateReadme(
    content: string,
    options?: { hash?: string; message?: string },
  ): Promise<void>;
}

/**
 * Configuration for different file system implementations
 */
export interface FileSystemConfig {
  readmePath?: string;
  commitMessage?: string;
}
