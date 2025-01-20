import type { GithubActionInput } from 'src/input';
import { getLastFMData, readableTimePeriod } from 'src/lastfm';

import {
  formatSectionData,
  generateMarkdownSection,
  type Section,
} from '../section';

export async function updateTrackSection(
  input: GithubActionInput,
  section: Section,
  readme: string,
): Promise<string> {
  const chartTitle = `Top Tracks - ${readableTimePeriod(section)}`;
  const { tracks } = await getLastFMData('TopTracks', input, section);
  const trackSection = formatSectionData(input, section, tracks);

  const newSection = generateMarkdownSection(
    input,
    section,
    chartTitle,
    trackSection,
  );

  return readme.replace(section.currentSection, newSection);
}
