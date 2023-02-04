import * as core from '@actions/core';
import * as R from 'ramda';
import { InvalidPeriodError, InvalidRowsError } from './error';
import type { Input } from './input';
import { isValidTimePeriod } from './lastfm';
import type {
  ConfigTimePeriod,
  Album,
  Artist,
  Track,
  RecentTrack,
} from './lastfm/types';

enum SectionName {
  RECENT = 'RECENT',
  TRACKS = 'TRACKS',
  ARTISTS = 'ARTISTS',
  ALBUMS = 'ALBUMS',
}

export interface Section {
  name: SectionName;
  start: string;
  end: string;
  content: string[];
  currentSection: string;
  config: Partial<{ rows: number; period: ConfigTimePeriod }>;
}

export type SectionComment =
  | 'LASTFM_RECENT'
  | 'LASTFM_TRACKS'
  | 'LASTFM_ARTISTS'
  | 'LASTFM_ALBUMS';

const SectionNameMap: { [key in SectionComment]: SectionName } = {
  LASTFM_RECENT: SectionName.RECENT,
  LASTFM_TRACKS: SectionName.TRACKS,
  LASTFM_ARTISTS: SectionName.ARTISTS,
  LASTFM_ALBUMS: SectionName.ALBUMS,
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

  return R.length(R.keys(sections)) > 0 ? R.values(sections) : undefined;
}

/**
 * Format the chart data for a section.
 *
 * @returns A string containing the formatted chart data.
 */
export const formatChartData = (
  section: Section,
  listeningData: unknown[],
): string => {
  const formatTracks = <T>(section: Section, data: T[]): string[] => {
    switch (section.name) {
      case SectionName.ALBUMS:
        return (data as Album[]).map((album: Album) => {
          return `> \`${album.playcount.toLocaleString()} ▶️\` ∙ **[${
            album.name
          }](${album.url})** - [${album.artist.name}](${
            album.artist.url
          })<br/>`;
        });
      case SectionName.ARTISTS:
        return (data as Artist[]).map((artist: Artist) => {
          return `> \`${artist.playcount.toLocaleString()} ▶️\` ∙ **[${
            artist.name
          }](${artist.url})**<br/>`;
        });
      case SectionName.TRACKS:
        return (data as Track[]).map((track: Track) => {
          return `> \`${track.playcount.toLocaleString()} ▶️\` ∙ **[${
            track.name
          }](${track.url})** - [${track.artist.name}](${
            track.artist.url
          })<br/>`;
        });
      case SectionName.RECENT: {
        const tracks = data as RecentTrack[];
        console.log(section.config.rows);
        console.log(data.length);
        return tracks
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

      default:
        return [];
    }
  };

  return R.ifElse(
    R.isEmpty,
    () => 'No listening data found for the selected time period.',
    () => formatTracks(section, listeningData).join('\n'),
  )(listeningData);
};

/**
 * Generate a markdown chart for a section.
 *
 * @returns An updated Markdown chart surrounded by the section start and end comments.
 */
export function generateMarkdownChart(
  input: Input,
  section: Section,
  title: string,
  content: string,
) {
  const chartTitle = input.show_title
    ? `\n<a href="https://last.fm" target="_blank"><img src="https://user-images.githubusercontent.com/17434202/215290617-e793598d-d7c9-428f-9975-156db1ba89cc.svg" width="18" height="13"/></a> **${title}**\n`
    : '';

  return `${section.start}${chartTitle}
${content}
${section.end}`;
}
