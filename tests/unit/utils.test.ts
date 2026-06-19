import {
  requireInit,
  requirePrompt,
  requireVersion,
  formatDate,
  truncate,
  parseVersionArg,
  applyTemplate,
} from '../../src/lib/utils';

describe('Utils', () => {
  describe('requireInit', () => {
    it('should return false and log error when not initialized', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const result = requireInit(false);
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('prvm is not initialized'));
      consoleSpy.mockRestore();
    });

    it('should return true when already initialized', () => {
      const result = requireInit(true);
      expect(result).toBe(true);
    });
  });

  describe('requirePrompt', () => {
    it('should return false and log error when prompt does not exist', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const result = requirePrompt(false, 'test-prompt');
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
      consoleSpy.mockRestore();
    });

    it('should return true when prompt exists', () => {
      const result = requirePrompt(true, 'test-prompt');
      expect(result).toBe(true);
    });
  });

  describe('requireVersion', () => {
    const meta = { versions: [1, 2, 3] };

    it('should return false when version does not exist', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const result = requireVersion(meta, 5, 'test-prompt');
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('does not exist'));
      consoleSpy.mockRestore();
    });

    it('should return true when version exists', () => {
      const result = requireVersion(meta, 2, 'test-prompt');
      expect(result).toBe(true);
    });
  });

  describe('formatDate', () => {
    it('should format ISO date string to locale string', () => {
      const result = formatDate('2024-01-15T10:30:00Z');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('truncate', () => {
    it('should truncate string longer than default length', () => {
      const longString = 'a'.repeat(100);
      const result = truncate(longString);
      expect(result.length).toBeLessThanOrEqual(83); // 80 + '...'
      expect(result.endsWith('...')).toBe(true);
    });

    it('should not truncate string shorter than length', () => {
      const shortString = 'short';
      const result = truncate(shortString);
      expect(result).toBe(shortString);
    });

    it('should respect custom length', () => {
      const result = truncate('1234567890', 5);
      expect(result).toBe('12345...');
    });
  });

  describe('parseVersionArg', () => {
    it('should parse version number', () => {
      expect(parseVersionArg('1')).toBe(1);
      expect(parseVersionArg('10')).toBe(10);
    });

    it('should strip v prefix', () => {
      expect(parseVersionArg('v1')).toBe(1);
      expect(parseVersionArg('V2')).toBe(2);
    });

    it('should return NaN for invalid input', () => {
      expect(parseVersionArg('abc')).toBeNaN();
    });
  });

  describe('applyTemplate', () => {
    it('should replace single placeholder', () => {
      const result = applyTemplate('Hello {{name}}!', { name: 'World' });
      expect(result).toBe('Hello World!');
    });

    it('should replace multiple placeholders', () => {
      const result = applyTemplate('{{greeting}} {{name}}!', { greeting: 'Hello', name: 'World' });
      expect(result).toBe('Hello World!');
    });

    it('should leave unknown placeholders unchanged', () => {
      const result = applyTemplate('Hello {{unknown}}!', { name: 'World' });
      expect(result).toBe('Hello {{unknown}}!');
    });

    it('should handle empty vars object', () => {
      const result = applyTemplate('Hello {{name}}!', {});
      expect(result).toBe('Hello {{name}}!');
    });

    it('should handle prompt with no placeholders', () => {
      const result = applyTemplate('Hello World!', { name: 'Test' });
      expect(result).toBe('Hello World!');
    });

    it('should handle special characters in values', () => {
      const result = applyTemplate('Input: {{input}}', { input: 'Special chars: @#$%^&*()' });
      expect(result).toBe('Input: Special chars: @#$%^&*()');
    });

    it('should handle newlines in values', () => {
      const result = applyTemplate('Text: {{text}}', { text: 'Line 1\nLine 2' });
      expect(result).toBe('Text: Line 1\nLine 2');
    });
  });
});