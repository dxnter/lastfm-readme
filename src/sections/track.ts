import type { Input } from 'src/input';
import { getLastFMData, readableTimePeriod } from 'src/lastfm';

import {
  formatSectionData,
  generateMarkdownSection,
  Section,
} from '../section';

export async function updateTrackSection(
  input: Input,
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
