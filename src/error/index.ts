export class InvalidInputError extends Error {
  constructor(message = 'InvalidInputError') {
    super(message);
    this.name = 'InvalidInputError';
  }
}

export class EndTagWithoutStartTagError extends Error {
  constructor(endTag: string) {
    super(`End tag found without a corresponding start tag: "${endTag}"`);
    this.name = 'EndTagWithoutStartTagError';
  }
}

export class StartTagWithoutEndTagError extends Error {
  constructor(startTag: string) {
    super(`Start tag found without a corresponding end tag: "${startTag}"`);
    this.name = 'StartTagWithoutEndTagError';
  }
}
