import * as core from '@actions/core';
import { Input, parseInput } from './input';
import { getReadmeFile, updateReadmeFile } from './readmeFile';
import { getSectionsFromReadme, Section, SectionComment } from './section';
import {
  updateTrackSection,
  updateAlbumSection,
  updateArtistSection,
  updateRecentSection,
  updateUserInfoSection,
} from './sections';

async function run() {
  const input = await parseInput();
  const readme = await getReadmeFile(input);
  let updated = false;

  const sections: {
    name: SectionComment;
    update: (
      input: Input,
      section: Section,
      content: string,
    ) => Promise<string>;
  }[] = [
    { name: 'LASTFM_TRACKS', update: updateTrackSection },
    { name: 'LASTFM_ARTISTS', update: updateArtistSection },
    { name: 'LASTFM_ALBUMS', update: updateAlbumSection },
    { name: 'LASTFM_RECENT', update: updateRecentSection },
    { name: 'LASTFM_USER_INFO', update: updateUserInfoSection },
  ];

  for (const { name, update } of sections) {
    const matchingSections = getSectionsFromReadme(name, readme.content);
    if (!matchingSections) continue;

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

run().catch((error) => {
  core.setFailed(error);
  process.exit(1);
});
