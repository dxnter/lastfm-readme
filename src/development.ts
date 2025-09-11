#!/usr/bin/env node

import { LocalFileSystem } from './filesystem';
import { convertToGithubActionInput, parseLocalInput } from './local';
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
import { CLI } from './utils/cli';

/**
 * Represents a section update function for local development.
 */
type LocalSectionUpdater = {
  name: SectionComment;
  update: (
    input: ReturnType<typeof convertToGithubActionInput>,
    section: Section,
    content: string,
    localConfig?: ReturnType<typeof parseLocalInput>,
  ) => Promise<string>;
};

export async function runLocalDevelopment(): Promise<void> {
  const startTime = Date.now();

  try {
    CLI.printHeader('🎵 Last.fm README');

    CLI.printStatus('Loading configuration...');

    const localConfig = parseLocalInput();
    const input = convertToGithubActionInput(localConfig);
    const fs = new LocalFileSystem({
      readmePath: localConfig.readmePath,
    });

    CLI.printSuccess('Configuration loaded successfully');

    CLI.printConfig({
      'Last.fm User': input.lastfm_user,
      'README Path': localConfig.readmePath,
      Locale: input.locale,
      'Date Format': input.date_format,
    });

    CLI.printStatus('Reading README file...');

    const readmeFile = await fs.getReadme();
    let readme = readmeFile.content;
    const originalReadme = readme;

    CLI.printSuccess('README file loaded');

    const sections: LocalSectionUpdater[] = [
      { name: 'LASTFM_TRACKS', update: updateTrackSection },
      { name: 'LASTFM_ARTISTS', update: updateArtistSection },
      { name: 'LASTFM_ALBUMS', update: updateAlbumSection },
      { name: 'LASTFM_RECENT', update: updateRecentSection },
      { name: 'LASTFM_USER_INFO', update: updateUserInfoSection },
    ];

    // Find all sections that exist in the README
    const foundSections: Array<{
      name: string;
      count: number;
      processed: number;
      updated: number;
      status: 'success' | 'error' | 'unchanged';
      error?: string;
    }> = [];

    let totalSectionsProcessed = 0;
    let totalSectionsUpdated = 0;

    // Process each section type
    for (const { name, update } of sections) {
      const matchingSections = getSectionsFromReadme(name, readme);
      if (!matchingSections?.length) continue;

      const sectionResult = {
        name,
        count: matchingSections.length,
        processed: 0,
        updated: 0,
        status: 'success' as 'success' | 'error' | 'unchanged',
        error: undefined as string | undefined,
      };

      CLI.printStatus(
        `Processing ${matchingSections.length} ${name.replace('LASTFM_', '').toLowerCase()} section(s)...`,
      );

      try {
        for (const section of matchingSections) {
          totalSectionsProcessed++;
          sectionResult.processed++;

          const originalSection = section.currentSection;
          readme = await update(input, section, readme, localConfig);

          // Check if section changed
          const updatedSection = getSectionFromReadme(
            name,
            readme,
            section.start,
          );
          if (originalSection !== updatedSection) {
            totalSectionsUpdated++;
            sectionResult.updated++;
          }
        }

        if (sectionResult.updated > 0) {
          CLI.printSuccess(
            `Updated ${sectionResult.updated} ${name.replace('LASTFM_', '').toLowerCase()} section(s)`,
          );
        } else {
          CLI.printInfo(
            `No changes needed for ${name.replace('LASTFM_', '').toLowerCase()} sections`,
          );
          sectionResult.status = 'unchanged';
        }
      } catch (error) {
        const errorMessage = (error as Error).message;
        sectionResult.status = 'error';
        sectionResult.error = errorMessage;
        CLI.printFailure(
          `Failed to update ${name.replace('LASTFM_', '').toLowerCase()} sections: ${errorMessage}`,
        );
      }

      foundSections.push(sectionResult);
    }

    CLI.printSectionResults(foundSections);

    const hasChanges = readme !== originalReadme;
    if (hasChanges) {
      CLI.printStatus('Writing updated README...');
      await fs.updateReadme(readme);
    }

    const duration = Date.now() - startTime;
    CLI.printSummary({
      sectionsProcessed: totalSectionsProcessed,
      sectionsUpdated: totalSectionsUpdated,
      duration,
      hasChanges,
      readmePath: localConfig.readmePath,
    });
  } catch (error) {
    CLI.printError(error as Error);
    if (process.argv[1] === import.meta.url.replace('file://', '')) {
      process.exit(1);
    } else {
      throw error;
    }
  }
}

function getSectionFromReadme(
  sectionComment: SectionComment,
  readmeContent: string,
  sectionStart: string,
): string | undefined {
  const sections = getSectionsFromReadme(sectionComment, readmeContent);
  const section = sections?.find((s) => s.start === sectionStart);
  return section?.currentSection;
}

if (process.argv[1] === import.meta.url.replace('file://', '')) {
  // eslint-disable-next-line unicorn/prefer-top-level-await
  runLocalDevelopment().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
