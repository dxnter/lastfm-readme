import type { GithubActionInput } from 'src/input';
import { getLastFMData, readableTimePeriod } from 'src/lastfm';

import {
  formatSectionData,
  generateMarkdownSection,
  type Section,
} from '../section';

/**
 * Updates a Last.fm top tracks section within a README file.
 * Fetches the user's most played tracks for the configured time period and
 * generates a formatted markdown section with play counts and links.
 *
 * @param input - GitHub action input containing API credentials and user preferences
 * @param section - Section configuration including time period and display limits
 * @param readme - Complete README content to be updated
 * @returns Promise resolving to the updated README content with the new tracks section
 * @throws Error if Last.fm data fetching or section generation fails
 *
 * @example
 * The generated section might look like:
 * ```markdown
 * <!--START_LASTFM_TRACKS-->
 * # Top Tracks - Past Week
 * > `42 ▶️` ∙ **[Song Title](https://last.fm/track/...)** - [Artist Name](https://last.fm/artist/...)
 * <!--END_LASTFM_TRACKS-->
 * ```
 */
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
