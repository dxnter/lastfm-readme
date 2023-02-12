import * as core from '@actions/core';
import { format as dateFormat } from 'date-fns';
import * as R from 'ramda';

import {
  InvalidPeriodError,
  InvalidRowsError,
  InvalidUserInfoDisplayError,
  InvalidUserInfoDisplayOptionError,
} from './error';
import type { Input } from './input';
import { isValidDisplayOptions, isValidTimePeriod } from './lastfm';
import type {
  Album,
  Artist,
  ConfigTimePeriod,
  ConfigUserInfoDisplayOption,
  RecentTrack,
  Track,
  UserInfo,
} from './lastfm/types';

export enum SectionName {
  RECENT = 'RECENT',
  TRACKS = 'TRACKS',
  ARTISTS = 'ARTISTS',
  ALBUMS = 'ALBUMS',
  USER_INFO = 'USER_INFO',
}

export interface Section {
  name: SectionName;
  start: string;
  end: string;
  content: string[];
  currentSection: string;
  config: Partial<{
    rows: number;
    period: ConfigTimePeriod;
    display: ConfigUserInfoDisplayOption[];
  }>;
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
 * Get the existing chart sections from a README file.
 *
 * @throws {@link InvalidRowsError} if the number of rows is invalid for a section.
 * @throws {@link InvalidPeriodError} if the time period is invalid for a section.
 */
export function getSectionsFromReadme(
  sectionComment: SectionComment,
  readmeContent: string,
): Section[] | undefined {
  core.debug(`Searching for ${sectionComment} sections in README`);
  const sections: { [key: string]: Section } = {};
  const sectionStack: string[] = [];
  const startPrefix = `<!--START_${sectionComment}`;
  const endPrefix = `<!--END_${sectionComment}`;

  readmeContent.split('\n').forEach((line) => {
    if (line.startsWith(startPrefix)) {
      const startComment = line.match(
        `(?<start>${startPrefix}(?::(?<config>{.*}))?-->)`,
      );
      if (startComment && startComment.groups?.start) {
        const startSectionComment = startComment.groups.start;
        const config = JSON.parse(
          startComment.groups?.config || '{}',
          (key, value) => {
            if (key === 'period' && !isValidTimePeriod(value)) {
              throw new InvalidPeriodError(value);
            }

            if (key === 'rows' && (value < 1 || value > 50)) {
              throw new InvalidRowsError(value);
            }

            if (key === 'display') {
              if (!Array.isArray(value)) {
                throw new InvalidUserInfoDisplayError(value);
              }
              if (!isValidDisplayOptions(value)) {
                throw new InvalidUserInfoDisplayOptionError(value);
              }
            }

            return value;
          },
        );

        sections[startSectionComment] = {
          name: SectionNameMap[sectionComment],
          start: startSectionComment,
          end: '',
          content: [],
          currentSection: '',
          config,
        };
        sectionStack.push(startSectionComment);
      }
    } else if (line.startsWith(endPrefix)) {
      if (sectionStack.length === 0) {
        core.error(
          `Found an end tag without a corresponding start tag: ${line}`,
        );
        process.exit(1);
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
  });

  if (sectionStack.length > 0) {
    core.error(
      `Start section(s) without end section found: ${sectionStack.join('')}`,
    );
    process.exit(1);
  }

  core.debug(
    `Found ${R.length(R.keys(sections))} ${sectionComment} sections in README`,
  );

  return R.length(R.keys(sections)) > 0 ? R.values(sections) : undefined;
}

/**
 * Format the listening data for a section.
 *
 * @returns A string containing the formatted listening data.
 */
export const formatSectionData = (
  input: Input,
  section: Section,
  listeningData: unknown[],
): string => {
  const formatMarkdownData = <T>(section: Section, data: T[]): string[] => {
    const numberFormat = new Intl.NumberFormat(input.locale);

    switch (section.name) {
      case SectionName.ALBUMS:
        return (data as Album[]).map((album: Album) => {
          return `> \`${numberFormat.format(album.playcount)} ▶️\` ∙ **[${
            album.name
          }](${album.url})** - [${album.artist.name}](${
            album.artist.url
          })<br/>`;
        });
      case SectionName.ARTISTS:
        return (data as Artist[]).map((artist: Artist) => {
          return `> \`${numberFormat.format(artist.playcount)} ▶️\` ∙ **[${
            artist.name
          }](${artist.url})**<br/>`;
        });
      case SectionName.TRACKS:
        return (data as Track[]).map((track: Track) => {
          return `> \`${numberFormat.format(track.playcount)} ▶️\` ∙ **[${
            track.name
          }](${track.url})** - [${track.artist.name}](${
            track.artist.url
          })<br/>`;
        });
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
          return `> **${key}**: ${formatUserInfoValue(input, key, value)}<br/>`;
        });
      }

      default:
        return [];
    }
  };

  return R.ifElse(
    R.isEmpty,
    () => 'No listening data found for the selected time period.',
    () => formatMarkdownData(section, listeningData).join('\n'),
  )(listeningData);
};

/**
 * Generate a markdown chart for a section.
 *
 * @returns An updated Markdown chart surrounded by the section start and end comments.
 */
export function generateMarkdownSection(
  input: Input,
  section: Section,
  title: string,
  content: string,
) {
  core.debug(`Generating ${section.name} section for ${section.start}`);

  const chartTitle = input.show_title
    ? `\n<a href="https://last.fm" target="_blank"><img src="https://user-images.githubusercontent.com/17434202/215290617-e793598d-d7c9-428f-9975-156db1ba89cc.svg" alt="Last.fm Logo" width="18" height="13"/></a> **${title}**\n`
    : '';

  return `${section.start}${chartTitle}
${content}
${section.end}`;
}

function formatUserInfoValue(
  input: Input,
  key: string,
  value: string | number,
) {
  const numberFormat = new Intl.NumberFormat(input.locale);

  if (typeof value === 'number') {
    if (['Playcount', 'Artists', 'Albums', 'Tracks'].includes(key)) {
      return numberFormat.format(value);
    } else if (key === 'Registered') {
      return dateFormat(value * 1000, input.date_format);
    }
  }

  return value;
}
