import {
  EndTagWithoutStartTagError,
  InvalidInputError,
  StartTagWithoutEndTagError,
} from 'src/error';
import { describe, expect, it } from 'vitest';

describe('custom error classes', () => {
  describe('invalid input error', () => {
    it('should be created with default message', () => {
      const error = new InvalidInputError();

      expect(error.name).toBe('InvalidInputError');
      expect(error.message).toBe('InvalidInputError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should be created with custom message', () => {
      const customMessage = 'Custom validation error';
      const error = new InvalidInputError(customMessage);

      expect(error.name).toBe('InvalidInputError');
      expect(error.message).toBe(customMessage);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('end tag without start tag error', () => {
    it('should be created with tag information', () => {
      const endTag = '<!--END_LASTFM_RECENT-->';
      const error = new EndTagWithoutStartTagError(endTag);

      expect(error.name).toBe('EndTagWithoutStartTagError');
      expect(error.message).toBe(
        `End tag found without a corresponding start tag: "${endTag}"`,
      );
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('start tag without end tag error', () => {
    it('should be created with tag information', () => {
      const startTag = '<!--START_LASTFM_RECENT-->';
      const error = new StartTagWithoutEndTagError(startTag);

      expect(error.name).toBe('StartTagWithoutEndTagError');
      expect(error.message).toBe(
        `Start tag found without a corresponding end tag: "${startTag}"`,
      );
      expect(error).toBeInstanceOf(Error);
    });
  });
});
