import type { Input } from 'src/input';
import { getLastFMData, readableTimePeriod } from 'src/lastfm';

import {
  formatSectionData,
  generateMarkdownSection,
  Section,
} from '../section';

export async function updateAlbumSection(
  input: Input,
  section: Section,
  readme: string,
): Promise<string> {
  const chartTitle = `Top Albums - ${readableTimePeriod(section)}`;
  const { albums } = await getLastFMData('TopAlbums', input, section);
  const albumSection = formatSectionData(input, section, albums);

  const newSection = generateMarkdownSection(
    input,
    section,
    chartTitle,
    albumSection,
  );

  return readme.replace(section.currentSection, newSection);
}
