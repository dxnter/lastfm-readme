import type { Section } from '../section';
import type { Input } from 'src/input';
import { getLastFMData } from 'src/lastfm';
import { formatSectionData, generateMarkdownSection } from '../section';

export async function updateRecentSection(
  input: Input,
  section: Section,
  readme: string,
): Promise<string> {
  const { tracks } = await getLastFMData('RecentTracks', input, section);
  const recentSection = formatSectionData(input, section, tracks);

  const newSection = generateMarkdownSection(
    input,
    section,
    `Recent Tracks`,
    recentSection,
  );

  return readme.replace(section.currentSection, newSection);
}
