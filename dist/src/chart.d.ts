import type { Input } from './input';
import type { ConfigTimePeriod } from './lastfm/types';
declare enum SectionName {
    RECENT = "RECENT",
    TRACKS = "TRACKS",
    ARTISTS = "ARTISTS",
    ALBUMS = "ALBUMS"
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
    }>;
}
export type SectionComment = 'LASTFM_RECENT' | 'LASTFM_TRACKS' | 'LASTFM_ARTISTS' | 'LASTFM_ALBUMS';
/**
 * Get the existing chart sections from a README file.
 *
 * @throws {@link InvalidRowsError} if the number of rows is invalid for a section.
 * @throws {@link InvalidPeriodError} if the time period is invalid for a section.
 */
export declare function getSectionsFromReadme(sectionComment: SectionComment, readmeContent: string): Section[] | undefined;
/**
 * Format the chart data for a section.
 *
 * @returns A string containing the formatted chart data.
 */
export declare const formatChartData: (section: Section, listeningData: unknown[]) => string;
/**
 * Generate a markdown chart for a section.
 *
 * @returns An updated Markdown chart surrounded by the section start and end comments.
 */
export declare function generateMarkdownChart(input: Input, section: Section, title: string, content: string): string;
export {};
