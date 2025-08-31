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
  console.log('🚀 Starting Last.fm README local development mode...\n');

  try {
    const localConfig = parseLocalInput();
    const input = convertToGithubActionInput(localConfig);
    const fs = new LocalFileSystem({
      readmePath: localConfig.readmePath,
    });

    // Read current README content
    console.log('📖 Reading README file...');
    const readmeFile = await fs.getReadme();
    let readme = readmeFile.content;
    const originalReadme = readme;

    const sections: LocalSectionUpdater[] = [
      { name: 'LASTFM_TRACKS', update: updateTrackSection },
      { name: 'LASTFM_ARTISTS', update: updateArtistSection },
      { name: 'LASTFM_ALBUMS', update: updateAlbumSection },
      { name: 'LASTFM_RECENT', update: updateRecentSection },
      { name: 'LASTFM_USER_INFO', update: updateUserInfoSection },
    ];

    let sectionsProcessed = 0;
    let sectionsUpdated = 0;

    // Process each section type
    for (const { name, update } of sections) {
      const matchingSections = getSectionsFromReadme(name, readme);
      if (!matchingSections?.length) continue;

      console.log(
        `\n🔄 Processing ${matchingSections.length} ${name} section(s)...`,
      );

      for (const section of matchingSections) {
        sectionsProcessed++;
        const originalSection = section.currentSection;

        try {
          readme = await update(input, section, readme, localConfig);

          if (
            originalSection ===
            getSectionFromReadme(name, readme, section.start)
          ) {
            console.log(`  ℹ️ No changes: ${section.start}`);
          } else {
            sectionsUpdated++;
            console.log(`  ✅ Updated section: ${section.start}`);
          }
        } catch (error) {
          console.error(
            `  ❌ Failed to update section ${section.start}: ${(error as Error).message}`,
          );
        }
      }
    }

    if (readme === originalReadme) {
      console.log(`\nℹ️ No changes made to README file.`);
    } else {
      console.log(`\n💾 Writing updated README file...`);
      await fs.updateReadme(readme);
      console.log(`✅ README updated successfully!`);
    }

    const duration = Date.now() - startTime;
    console.log(`\n🎉 Local development complete!`);
    console.log(`   Sections processed: ${sectionsProcessed}`);
    console.log(`   Sections updated: ${sectionsUpdated}`);
    console.log(`   Duration: ${duration}ms`);
  } catch (error) {
    console.error(`\n❌ Local development failed: ${(error as Error).message}`);
    // Only exit if running as main module, otherwise throw for testing
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

// Run if this file is executed directly
if (process.argv[1] === import.meta.url.replace('file://', '')) {
  // eslint-disable-next-line unicorn/prefer-top-level-await
  runLocalDevelopment().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
