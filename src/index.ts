import { GitHubFileSystem } from './filesystem';
import { type GithubActionInput, parseInput } from './input';
import {
  getSectionsFromReadme,
  type Section,
  type SectionComment,
} from './section';
import {
  updateAlbumSection,
  updateArtistSection,
  updateRecentSection,
  updateTrackSection,
  updateUserInfoSection,
} from './sections';
import { logger } from './utils/logger';

/**
 * Represents a section update function with its associated name and update logic.
 * @template T - The type of input data required for the section update
 */
interface SectionUpdater<T extends GithubActionInput = GithubActionInput> {
  /** The comment name that identifies this section in the README */
  name: SectionComment;
  /**
   * Function to update the section content
   * @param input - GitHub Action input configuration
   * @param section - The section data containing current content and bounds
   * @param content - The full README content
   * @returns Promise resolving to the updated README content
   */
  update: (input: T, section: Section, content: string) => Promise<string>;
}

/**
 * Main entry point for the GitHub Action that updates Last.fm sections in README files.
 * Orchestrates the entire workflow of reading, updating, and writing README content.
 * @returns Promise that resolves when the README update is complete
 * @throws Error if any part of the workflow fails
 */
export async function run(): Promise<void> {
  const input = await parseInput();
  const fileSystem = new GitHubFileSystem(input, {
    commitMessage: input.commit_message,
    readmePath: input.target_file,
  });

  const readme = await fileSystem.getReadme();
  const originalContent = readme.content;
  let currentContent = readme.content;
  let updated = false;

  const sections: SectionUpdater[] = [
    { name: 'LASTFM_TRACKS', update: updateTrackSection },
    { name: 'LASTFM_ARTISTS', update: updateArtistSection },
    { name: 'LASTFM_ALBUMS', update: updateAlbumSection },
    { name: 'LASTFM_RECENT', update: updateRecentSection },
    { name: 'LASTFM_USER_INFO', update: updateUserInfoSection },
  ];

  for (const { name, update } of sections) {
    const matchingSections = getSectionsFromReadme(name, currentContent);
    if (!matchingSections?.length) continue;

    for (const section of matchingSections) {
      currentContent = await update(input, section, currentContent);
    }
  }

  if (originalContent === currentContent) {
    logger.info('🕓 Skipping update, chart content is up to date');
  } else {
    await fileSystem.updateReadme(currentContent, {
      hash: readme.hash,
      message: input.commit_message,
    });
    updated = true;
  }

  logger.setOutput('readme-updated', String(updated));
}

try {
  await run();
} catch (error: unknown) {
  if (error instanceof Error) {
    logger.setFailed(error.message);
  }
}
