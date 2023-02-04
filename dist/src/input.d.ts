export interface Input {
    [key: string]: any;
    lastfm_api_key: string;
    lastfm_user: string;
    gh_token: string;
    repository: {
        owner: string;
        repo: string;
    };
    commit_message: string;
    show_title: string;
}
/**
 * Parse and validate the provided workflow input
 * @returns The parsed and validated workflow input
 */
export declare function parseInput(): Promise<Input>;
