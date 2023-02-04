import type { Section } from './../chart';
import type { Input } from 'src/input';
import { getRecentTracks } from 'src/lastfm';
import { formatChartData, generateMarkdownChart } from './../chart';

export async function createRecentChart(
  section: Section,
  input: Input,
): Promise<string> {
  const { tracks } = await getRecentTracks(input, section);
  return formatChartData(section, tracks);
}

export function generateNewRecentChartSection(
  input: Input,
  section: Section,
  recentChart: string,
): string {
  return generateMarkdownChart(input, section, `Recent Tracks`, recentChart);
}
