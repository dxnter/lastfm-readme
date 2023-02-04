import type { Input } from 'src/input';
import { Section } from '../chart';
export declare function createAlbumChart(section: Section, input: Input): Promise<string>;
export declare function generateNewAlbumChartSection(input: Input, section: Section, trackChart: string): string;
