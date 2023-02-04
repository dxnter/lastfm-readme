import type { Input } from 'src/input';
import { getTopAlbums, readableTimePeriod } from 'src/lastfm';
import { Section, formatChartData, generateMarkdownChart } from '../chart';

export async function createAlbumChart(
  section: Section,
  input: Input,
): Promise<string> {
  const { albums } = await getTopAlbums(input, section);
  return formatChartData(section, albums);
}

export function generateNewAlbumChartSection(
  input: Input,
  section: Section,
  trackChart: string,
): string {
  const chartTitle = `Top Albums - ${readableTimePeriod(section)}`;
  return generateMarkdownChart(input, section, chartTitle, trackChart);
}
