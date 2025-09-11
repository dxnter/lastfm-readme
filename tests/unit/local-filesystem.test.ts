import fs from 'node:fs/promises';
import path from 'node:path';

import { LocalFileSystem } from 'src/filesystem/local';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock fs module
vi.mock('node:fs/promises');
const mockFs = vi.mocked(fs);

describe('localFileSystem', () => {
  let localFs: LocalFileSystem;

  beforeEach(() => {
    vi.clearAllMocks();
    localFs = new LocalFileSystem();
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      const fs = new LocalFileSystem();
      expect(fs).toBeInstanceOf(LocalFileSystem);
    });

    it('should create instance with custom config', () => {
      const fs = new LocalFileSystem({ readmePath: './custom/README.md' });
      expect(fs).toBeInstanceOf(LocalFileSystem);
    });
  });

  describe('readFile', () => {
    it('should read file successfully', async () => {
      const content = 'file content';
      mockFs.readFile.mockResolvedValue(content);

      const result = await localFs.readFile('/path/to/file.txt');

      expect(result).toBe(content);
      expect(mockFs.readFile).toHaveBeenCalledWith('/path/to/file.txt', 'utf8');
    });

    it('should throw error when file not found', async () => {
      const error = new Error('ENOENT') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockFs.readFile.mockRejectedValue(error);

      await expect(localFs.readFile('/nonexistent/file.txt')).rejects.toThrow(
        'File not found: /nonexistent/file.txt',
      );
    });

    it('should throw error for other file read errors', async () => {
      const error = new Error('Permission denied');
      mockFs.readFile.mockRejectedValue(error);

      await expect(localFs.readFile('/restricted/file.txt')).rejects.toThrow(
        'Failed to read file /restricted/file.txt: Permission denied',
      );
    });
  });

  describe('writeFile', () => {
    it('should write file successfully', async () => {
      mockFs.mkdir.mockResolvedValue('');
      mockFs.writeFile.mockResolvedValue();

      await localFs.writeFile('/path/to/file.txt', 'content');

      expect(mockFs.mkdir).toHaveBeenCalledWith(
        path.dirname('/path/to/file.txt'),
        { recursive: true },
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '/path/to/file.txt',
        'content',
        'utf8',
      );
    });

    it('should throw error when write fails', async () => {
      mockFs.mkdir.mockResolvedValue('');
      const error = new Error('Disk full');
      mockFs.writeFile.mockRejectedValue(error);

      await expect(
        localFs.writeFile('/path/to/file.txt', 'content'),
      ).rejects.toThrow('Failed to write file /path/to/file.txt: Disk full');
    });

    it('should throw error when directory creation fails', async () => {
      const error = new Error('Permission denied');
      mockFs.mkdir.mockRejectedValue(error);

      await expect(
        localFs.writeFile('/path/to/file.txt', 'content'),
      ).rejects.toThrow(
        'Failed to write file /path/to/file.txt: Failed to create directory /path/to: Permission denied',
      );
    });
  });

  describe('ensureDir', () => {
    it('should create directory successfully', async () => {
      mockFs.mkdir.mockResolvedValue('');

      await localFs.ensureDir('/path/to/dir');

      expect(mockFs.mkdir).toHaveBeenCalledWith('/path/to/dir', {
        recursive: true,
      });
    });

    it('should throw error when directory creation fails', async () => {
      const error = new Error('Permission denied');
      mockFs.mkdir.mockRejectedValue(error);

      await expect(localFs.ensureDir('/restricted/dir')).rejects.toThrow(
        'Failed to create directory /restricted/dir: Permission denied',
      );
    });
  });

  describe('fileExists', () => {
    it('should return true when file exists', async () => {
      mockFs.access.mockResolvedValue();

      const result = await localFs.fileExists('/path/to/file.txt');

      expect(result).toBe(true);
      expect(mockFs.access).toHaveBeenCalledWith('/path/to/file.txt');
    });

    it('should return false when file does not exist', async () => {
      mockFs.access.mockRejectedValue(new Error('ENOENT'));

      const result = await localFs.fileExists('/nonexistent/file.txt');

      expect(result).toBe(false);
      expect(mockFs.access).toHaveBeenCalledWith('/nonexistent/file.txt');
    });
  });

  describe('getReadme', () => {
    it('should get README with custom path', async () => {
      const content = '# README\n\nContent here';
      mockFs.access.mockResolvedValue();
      mockFs.readFile.mockResolvedValue(content);

      const result = await localFs.getReadme('/custom/README.md');

      expect(result).toEqual({ content });
      expect(mockFs.access).toHaveBeenCalledWith('/custom/README.md');
      expect(mockFs.readFile).toHaveBeenCalledWith('/custom/README.md', 'utf8');
    });

    it('should get README with config path', async () => {
      const content = '# README\n\nContent here';
      const fs = new LocalFileSystem({ readmePath: './config/README.md' });
      mockFs.access.mockResolvedValue();
      mockFs.readFile.mockResolvedValue(content);

      const result = await fs.getReadme();

      expect(result).toEqual({ content });
      expect(mockFs.access).toHaveBeenCalledWith('./config/README.md');
      expect(mockFs.readFile).toHaveBeenCalledWith(
        './config/README.md',
        'utf8',
      );
    });

    it('should get README with default path', async () => {
      const content = '# README\n\nContent here';
      mockFs.access.mockResolvedValue();
      mockFs.readFile.mockResolvedValue(content);

      const result = await localFs.getReadme();

      expect(result).toEqual({ content });
      expect(mockFs.access).toHaveBeenCalledWith('./local/README.md');
      expect(mockFs.readFile).toHaveBeenCalledWith('./local/README.md', 'utf8');
    });

    it('should throw error when README file not found', async () => {
      mockFs.access.mockRejectedValue(new Error('ENOENT'));

      await expect(localFs.getReadme('/nonexistent/README.md')).rejects.toThrow(
        'README file not found: /nonexistent/README.md',
      );
    });

    it('should propagate read errors', async () => {
      mockFs.access.mockResolvedValue();
      const error = new Error('Permission denied') as NodeJS.ErrnoException;
      mockFs.readFile.mockRejectedValue(error);

      await expect(localFs.getReadme('/restricted/README.md')).rejects.toThrow(
        'Failed to read file /restricted/README.md: Permission denied',
      );
    });
  });

  describe('updateReadme', () => {
    it('should update README with custom config path', async () => {
      const fs = new LocalFileSystem({ readmePath: './custom/README.md' });
      mockFs.mkdir.mockResolvedValue('');
      mockFs.writeFile.mockResolvedValue();

      await fs.updateReadme('updated content', {
        hash: 'abc123',
        message: 'Update README',
      });

      expect(mockFs.mkdir).toHaveBeenCalledWith(
        path.dirname('./custom/README.md'),
        { recursive: true },
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        './custom/README.md',
        'updated content',
        'utf8',
      );
    });

    it('should update README with default path', async () => {
      mockFs.mkdir.mockResolvedValue('');
      mockFs.writeFile.mockResolvedValue();

      await localFs.updateReadme('updated content');

      expect(mockFs.mkdir).toHaveBeenCalledWith(path.dirname('./README.md'), {
        recursive: true,
      });
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        './README.md',
        'updated content',
        'utf8',
      );
    });

    it('should ignore options parameter', async () => {
      mockFs.mkdir.mockResolvedValue('');
      mockFs.writeFile.mockResolvedValue();

      // Options should be ignored for local filesystem
      await localFs.updateReadme('updated content', {
        hash: 'abc123',
        message: 'Update',
      });

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        './README.md',
        'updated content',
        'utf8',
      );
    });

    it('should propagate write errors', async () => {
      const error = new Error('Disk full');
      mockFs.mkdir.mockResolvedValue('');
      mockFs.writeFile.mockRejectedValue(error);

      await expect(localFs.updateReadme('content')).rejects.toThrow(
        'Failed to write file ./README.md: Disk full',
      );
    });
  });
});
