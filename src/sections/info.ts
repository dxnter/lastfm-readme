import type { Input } from 'src/input';
import { getLastFMData } from 'src/lastfm';
import {
  Section,
  formatSectionData,
  generateMarkdownSection,
} from '../section';

export async function updateUserInfoSection(
  input: Input,
  section: Section,
  readme: string,
): Promise<string> {
  const chartTitle = `[User Info - ${input.lastfm_user}](https://www.last.fm/user/${input.lastfm_user})`;
  const userInfo = await getLastFMData('UserInfo', input, section);
  const infoSection = formatSectionData(input, section, [userInfo]);

  const newSection = generateMarkdownSection(
    input,
    section,
    chartTitle,
    infoSection,
  );

  return readme.replace(section.currentSection, newSection);
}
