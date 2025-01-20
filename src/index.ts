import * as core from '@actions/core';

import { type GithubActionInput, parseInput } from './input';
import { getReadmeFile, updateReadmeFile } from './readme-file';
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
 * Represents a section update function.
 */
type SectionUpdater = {
  name: SectionComment;
  update: (
    input: GithubActionInput,
    section: Section,
    content: string,
  ) => Promise<string>;
};

export async function run(): Promise<void> {
  const input = await parseInput();
  const readme = await getReadmeFile(input);
  let updated = false;

  const sections: SectionUpdater[] = [
    { name: 'LASTFM_TRACKS', update: updateTrackSection },
    { name: 'LASTFM_ARTISTS', update: updateArtistSection },
    { name: 'LASTFM_ALBUMS', update: updateAlbumSection },
    { name: 'LASTFM_RECENT', update: updateRecentSection },
    { name: 'LASTFM_USER_INFO', update: updateUserInfoSection },
  ];

  for (const { name, update } of sections) {
    const matchingSections = getSectionsFromReadme(name, readme.content);
    if (!matchingSections?.length) continue;

    for (const section of matchingSections) {
      readme.content = await update(input, section, readme.content);
    }
  }

  const unmodifiedReadme = await getReadmeFile(input);

  if (unmodifiedReadme.content === readme.content) {
    core.info('🕓 Skipping update, chart content is up to date');
  } else {
    await updateReadmeFile(input, readme.hash, readme.content);
    updated = true;
  }

  core.setOutput('readme-updated', updated);
}

try {
  await run();
} catch (error: unknown) {
  if (error instanceof Error) {
    core.setFailed(error.message);
  }
}
