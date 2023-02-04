import type { Input } from 'src/input';
import { Section } from '../chart';
export declare function createArtistChart(section: Section, input: Input): Promise<string>;
export declare function generateNewArtistChartSection(input: Input, section: Section, trackChart: string): string;
