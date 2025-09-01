import type { GithubActionInput } from 'src/input';
import { getLastFMData, readableTimePeriod } from 'src/lastfm';

import {
  formatSectionData,
  generateMarkdownSection,
  type Section,
} from '../section';

/**
 * Updates a Last.fm top albums section within a README file.
 * Fetches the user's most played albums for the configured time period and
 * generates a formatted Markdown section with play counts, album, and artist links.
 *
 * @param input - GitHub action input containing API credentials and user preferences
 * @param section - Section configuration including time period and display limits
 * @param readme - Complete README content to be updated
 * @returns Promise resolving to the updated README content with the new albums section
 * @throws Error if Last.fm data fetching or section generation fails
 *
 * @example
 * The generated section might look like:
 * ```markdown
 * <!--START_LASTFM_ALBUMS-->
 * # Top Albums - Past Week
 * > `38 ▶️` ∙ **[Album Title](https://last.fm/album/...)** - [Artist Name](https://last.fm/artist/...)
 * <!--END_LASTFM_ALBUMS-->
 * ```
 */
export async function updateAlbumSection(
  input: GithubActionInput,
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
