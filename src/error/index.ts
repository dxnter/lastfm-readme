/**
 * Custom error class for invalid user input or configuration.
 * Thrown when GitHub Action inputs fail validation or are malformed.
 *
 * @example
 * ```typescript
 * throw new InvalidInputError('Last.fm API key is required');
 * ```
 */
export class InvalidInputError extends Error {
  constructor(message = 'InvalidInputError') {
    super(message);
    this.name = 'InvalidInputError';
  }
}

/**
 * Error thrown when a README section end tag is found without a corresponding start tag.
 * Indicates malformed HTML comments in the README file structure.
 *
 * @example
 * ```typescript
 * // This would throw an EndTagWithoutStartTagError:
 * // <!--END_LASTFM_TRACKS-->  (missing start tag)
 * ```
 */
export class EndTagWithoutStartTagError extends Error {
  constructor(endTag: string) {
    super(`End tag found without a corresponding start tag: "${endTag}"`);
    this.name = 'EndTagWithoutStartTagError';
  }
}

/**
 * Error thrown when a README section start tag is found without a corresponding end tag.
 * Indicates incomplete or malformed HTML comment sections in the README file.
 *
 * @example
 * ```typescript
 * // This would throw a StartTagWithoutEndTagError:
 * // <!--START_LASTFM_TRACKS-->  (missing end tag)
 * ```
 */
export class StartTagWithoutEndTagError extends Error {
  constructor(startTag: string) {
    super(`Start tag found without a corresponding end tag: "${startTag}"`);
    this.name = 'StartTagWithoutEndTagError';
  }
}
