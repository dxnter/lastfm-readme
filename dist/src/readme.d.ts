import type { Input } from './input';
interface Readme {
    content: string;
    hash: string;
}
export declare function getReadmeFile(input: Input): Promise<Readme>;
export declare function updateReadmeFile(input: Input, fileHash: string, newContent: string): Promise<void>;
export {};
