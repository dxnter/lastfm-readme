import type { Input } from 'src/input';
import { getTopArtists, readableTimePeriod } from 'src/lastfm';
import { Section, formatChartData, generateMarkdownChart } from '../chart';

export async function createArtistChart(
  section: Section,
  input: Input,
): Promise<string> {
  const { artists } = await getTopArtists(input, section);
  return formatChartData(section, artists);
}

export function generateNewArtistChartSection(
  input: Input,
  section: Section,
  trackChart: string,
): string {
  const chartTitle = `Top Artists - ${readableTimePeriod(section)}`;
  return generateMarkdownChart(input, section, chartTitle, trackChart);
}
