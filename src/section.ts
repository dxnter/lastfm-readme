import * as core from '@actions/core';
import * as R from 'ramda';
import { z } from 'zod';

import {
  EndTagWithoutStartTagError,
  StartTagWithoutEndTagError,
} from './error';
import type { GithubActionInput } from './input';
import { userInfoDisplayOptions } from './lastfm';
import {
  type Album,
  type Artist,
  ConfigTimePeriod,
  ConfigUserInfoDisplayOption,
  type RecentTrack,
  type Track,
  type UserInfo,
} from './lastfm/types';

/**
 * Enum representing possible section names.
 */
export enum SectionName {
  RECENT = 'RECENT',
  TRACKS = 'TRACKS',
  ARTISTS = 'ARTISTS',
  ALBUMS = 'ALBUMS',
  USER_INFO = 'USER_INFO',
}

/**
 * Zod schema for validating section configuration.
 */
const SectionConfigSchema = z.object({
  rows: z.number().min(1).max(50).optional(),
  period: z.nativeEnum(ConfigTimePeriod).optional(),
  display: z.array(z.nativeEnum(ConfigUserInfoDisplayOption)).optional(),
});

type SectionConfig = z.infer<typeof SectionConfigSchema>;

/**
 * Interface representing a section in the README.
 */
export interface Section {
  name: SectionName;
  start: string;
  end: string;
  content: string[];
  currentSection: string;
  config: SectionConfig;
}

export type SectionComment =
  | 'LASTFM_RECENT'
  | 'LASTFM_TRACKS'
  | 'LASTFM_ARTISTS'
  | 'LASTFM_ALBUMS'
  | 'LASTFM_USER_INFO';

const SectionNameMap: { [key in SectionComment]: SectionName } = {
  LASTFM_RECENT: SectionName.RECENT,
  LASTFM_TRACKS: SectionName.TRACKS,
  LASTFM_ARTISTS: SectionName.ARTISTS,
  LASTFM_ALBUMS: SectionName.ALBUMS,
  LASTFM_USER_INFO: SectionName.USER_INFO,
};

/**
 * Extract existing sections from the README content.
 * @param sectionComment - The section comment identifier.
 * @param readmeContent - The full README content.
 * @returns Extracted sections or undefined if none are found.
 */
export function getSectionsFromReadme(
  sectionComment: SectionComment,
  readmeContent: string,
): Section[] | undefined {
  core.debug(`🔍 Searching for ${sectionComment} sections in README`);

  const sections: Record<string, Section> = {};
  const sectionStack: string[] = [];
  const startPrefix = `<!--START_${sectionComment}`;
  const endPrefix = `<!--END_${sectionComment}`;

  for (const line of readmeContent.split('\n')) {
    if (line.startsWith(startPrefix)) {
      const startMatch = line.match(
        `(?<start>${startPrefix}(?::(?<config>{.*}))?-->)`,
      );

      if (startMatch?.groups?.start) {
        const config = SectionConfigSchema.safeParse(
          JSON.parse(startMatch.groups.config || '{}'),
        );

        if (!config.success) {
          throw new Error(config.error.message);
        }

        sections[startMatch.groups.start] = {
          name: SectionNameMap[sectionComment],
          start: startMatch.groups.start,
          end: '',
          content: [],
          currentSection: '',
          config: config.data,
        };
        sectionStack.push(startMatch.groups.start);
      }
    } else if (line.startsWith(endPrefix)) {
      if (sectionStack.length === 0) {
        throw new EndTagWithoutStartTagError(line);
      } else {
        const lastStart = sectionStack.shift()!;
        sections[lastStart]!.end = line;
        sections[lastStart]!.currentSection = R.ifElse(
          () => R.gt(R.length(sections[lastStart]!.content), 0),
          () => `${sections[lastStart]!.start}
${`${sections[lastStart]!.content.join('\n')}`}
${sections[lastStart]!.end}`,
          () => `${sections[lastStart]!.start}
${sections[lastStart]!.end}`,
        )();
      }
    } else {
      if (sectionStack.length === 1) {
        const currentGroup = sectionStack.at(0)!;
        sections[currentGroup]!.content.push(line);
      }
    }
  }

  if (sectionStack.length > 0) {
    throw new StartTagWithoutEndTagError(sectionStack.join(''));
  }

  core.debug(
    `Found ${R.length(R.keys(sections))} ${sectionComment} sections in README`,
  );

  return R.length(R.keys(sections)) > 0 ? R.values(sections) : undefined;
}

/**
 * Format the listening data into a markdown-compatible string.
 * @param input - The GitHub action input.
 * @param section - The section to format data for.
 * @param listeningData - The listening data retrieved.
 * @returns A formatted markdown string.
 */
export const formatSectionData = (
  input: GithubActionInput,
  section: Section,
  listeningData: unknown[],
): string => {
  const formatMarkdownData = <T>(section: Section, data: T[]): string[] => {
    const numberFormat = new Intl.NumberFormat(input.locale);

    switch (section.name) {
      case SectionName.ALBUMS: {
        return (data as Album[]).map((album: Album) => {
          return `> \`${numberFormat.format(album.playcount)} ▶️\` ∙ **[${
            album.name
          }](${album.url})** - [${album.artist.name}](${
            album.artist.url
          })<br/>`;
        });
      }
      case SectionName.ARTISTS: {
        return (data as Artist[]).map((artist: Artist) => {
          return `> \`${numberFormat.format(artist.playcount)} ▶️\` ∙ **[${
            artist.name
          }](${artist.url})**<br/>`;
        });
      }
      case SectionName.TRACKS: {
        return (data as Track[]).map((track: Track) => {
          return `> \`${numberFormat.format(track.playcount)} ▶️\` ∙ **[${
            track.name
          }](${track.url})** - [${track.artist.name}](${
            track.artist.url
          })<br/>`;
        });
      }
      case SectionName.RECENT: {
        return (data as RecentTrack[])
          .map(
            (track, index) =>
              `> ${
                index === 0 &&
                ((section.config.rows && data.length > section.config.rows) ||
                  data.length > 8)
                  ? '🎶'
                  : '∙'
              } **[${track.name}](${track.url})** - ${track.artist.name}<br/>`,
          )
          .slice(0, section.config.rows || 8);
      }

      case SectionName.USER_INFO: {
        const userInfo = data.at(0) as UserInfo;
        return Object.entries(userInfo).map(([key, value]) => {
          return `> **${userInfoDisplayOptions.get(
            key as ConfigUserInfoDisplayOption,
          )}**: ${value}<br/>`;
        });
      }

      default: {
        return [];
      }
    }
  };

  return R.ifElse(
    R.isEmpty,
    () => 'No listening data found for the selected time period.',
    () => formatMarkdownData(section, listeningData).join('\n'),
  )(listeningData);
};

/**
 * Generate a Markdown chart for a section.
 *
 * @returns An updated Markdown chart surrounded by the section start and end comments.
 */
export function generateMarkdownSection(
  input: GithubActionInput,
  section: Section,
  title: string,
  content: string,
) {
  core.debug(`🔧 Generating ${section.name} section for ${section.start}`);

  const chartTitle =
    input.show_title === 'true'
      ? `\n<a href="https://last.fm" target="_blank"><img src="https://user-images.githubusercontent.com/17434202/215290617-e793598d-d7c9-428f-9975-156db1ba89cc.svg" alt="Last.fm Logo" width="18" height="13"/></a> **${title}**\n`
      : '';

  return `${section.start}${chartTitle}
${content}
${section.end}`;
}
