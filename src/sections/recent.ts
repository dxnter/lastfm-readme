import type { GithubActionInput } from 'src/input';
import { getLastFMData } from 'src/lastfm';
import type { RecentTrack } from 'src/lastfm/types';

import type { Section } from '../section';
import { formatSectionData, generateMarkdownSection } from '../section';

export async function updateRecentSection(
  input: GithubActionInput,
  section: Section,
  readme: string,
): Promise<string> {
  const { tracks } = await getLastFMData('RecentTracks', input, section);
  const recentSection = formatSectionData(
    input,
    section,
    tracks as RecentTrack[],
  );

  const newSection = generateMarkdownSection(
    input,
    section,
    `Recent Tracks`,
    recentSection,
  );

  return readme.replace(section.currentSection, newSection);
}
