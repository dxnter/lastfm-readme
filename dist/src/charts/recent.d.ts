import type { Section } from './../chart';
import type { Input } from 'src/input';
export declare function createRecentChart(section: Section, input: Input): Promise<string>;
export declare function generateNewRecentChartSection(input: Input, section: Section, recentChart: string): string;
