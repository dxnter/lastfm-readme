import type { Input } from 'src/input';
import { getLastFMData, readableTimePeriod } from 'src/lastfm';

import {
  formatSectionData,
  generateMarkdownSection,
  Section,
} from '../section';

export async function updateArtistSection(
  input: Input,
  section: Section,
  readme: string,
): Promise<string> {
  const chartTitle = `Top Artists - ${readableTimePeriod(section)}`;
  const { artists } = await getLastFMData('TopArtists', input, section);
  const artistSection = formatSectionData(input, section, artists);

  const newSection = generateMarkdownSection(
    input,
    section,
    chartTitle,
    artistSection,
  );

  return readme.replace(section.currentSection, newSection);
}
