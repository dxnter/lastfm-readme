import type { Input } from 'src/input';
import { getTopTracks, readableTimePeriod } from 'src/lastfm';
import { Section, formatChartData, generateMarkdownChart } from '../chart';

export async function createTrackChart(
  section: Section,
  input: Input,
): Promise<string> {
  const { tracks } = await getTopTracks(input, section);
  return formatChartData(section, tracks);
}

export function generateNewTrackChartSection(
  input: Input,
  section: Section,
  trackChart: string,
): string {
  const chartTitle = `Top Tracks - ${readableTimePeriod(section)}`;
  return generateMarkdownChart(input, section, chartTitle, trackChart);
}
