import type { GithubActionInput } from 'src/input';
import { getLastFMData, readableTimePeriod } from 'src/lastfm';

import {
  formatSectionData,
  generateMarkdownSection,
  type Section,
} from '../section';

/**
 * Updates a Last.fm top artists section within a README file.
 * Fetches the user's most played artists for the configured time period and
 * generates a formatted Markdown section with play counts and links.
 *
 * @param input - GitHub action input containing API credentials and user preferences
 * @param section - Section configuration including time period and display limits
 * @param readme - Complete README content to be updated
 * @returns Promise resolving to the updated README content with the new artists section
 * @throws Error if Last.fm data fetching or section generation fails
 *
 * @example
 * The generated section might look like:
 * ```markdown
 * <!--START_LASTFM_ARTISTS-->
 * # Top Artists - Past Week
 * > `127 ▶️` ∙ **[Artist Name](https://last.fm/artist/...)**
 * <!--END_LASTFM_ARTISTS-->
 * ```
 */
export async function updateArtistSection(
  input: GithubActionInput,
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
