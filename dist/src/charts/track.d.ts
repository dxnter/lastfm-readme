import type { Input } from 'src/input';
import { Section } from '../chart';
export declare function createTrackChart(section: Section, input: Input): Promise<string>;
export declare function generateNewTrackChartSection(input: Input, section: Section, trackChart: string): string;
