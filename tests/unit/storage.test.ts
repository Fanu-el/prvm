import fs from 'fs';
import path from 'path';
import {
  getPromptsDir,
  isInitialized,
  initStorage,
  getConfig,
  getPromptDir,
  getMetaPath,
  getVersionPath,
  promptExists,
  getMeta,
  saveMeta,
  getVersion,
  saveVersion,
  listAllPrompts,
} from '../../src/lib/storage';
import { PromptMeta, PromptVersion, PRVMConfig } from '../../src/types';

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  readdirSync: jest.fn(),
  statSync: jest.fn(),
  rmSync: jest.fn(),
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe('Storage', () => {
  const originalCwd = process.cwd();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock cwd to a test directory
    jest.spyOn(process, 'cwd').mockReturnValue('/test/project');
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('getPromptsDir', () => {
    it('should return the .prompts directory path', () => {
      const result = getPromptsDir();
      expect(result).toBe(path.join('/test/project', '.prompts'));
    });
  });

  describe('isInitialized', () => {
    it('should return true when config file exists', () => {
      mockFs.existsSync.mockReturnValue(true);
      expect(isInitialized()).toBe(true);
    });

    it('should return false when config file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      expect(isInitialized()).toBe(false);
    });
  });

  describe('initStorage', () => {
    it('should create .prompts directory and config file', () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => '');

      initStorage();

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        path.join('/test/project', '.prompts'),
        { recursive: true }
      );
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('should not overwrite existing config', () => {
      mockFs.existsSync.mockReturnValue(true);

      initStorage();

      expect(mockFs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe('getConfig', () => {
    it('should return parsed config', () => {
      const mockConfig: PRVMConfig = {
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        temperature: 0.7,
        max_runs_per_version: 20,
      };
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

      const result = getConfig();
      expect(result).toEqual(mockConfig);
    });

    it('should throw when config file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      expect(() => getConfig()).toThrow('No config found');
    });

    it('should throw when config is invalid JSON', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid json');
      expect(() => getConfig()).toThrow('Config file is corrupted');
    });
  });

  describe('getPromptDir', () => {
    it('should return the prompt directory path', () => {
      const result = getPromptDir('test-prompt');
      expect(result).toBe(path.join('/test/project', '.prompts', 'test-prompt'));
    });
  });

  describe('getMetaPath', () => {
    it('should return the meta.json path', () => {
      const result = getMetaPath('test-prompt');
      expect(result).toBe(path.join('/test/project', '.prompts', 'test-prompt', 'meta.json'));
    });
  });

  describe('getVersionPath', () => {
    it('should return the version file path', () => {
      const result = getVersionPath('test-prompt', 2);
      expect(result).toBe(path.join('/test/project', '.prompts', 'test-prompt', 'v2.json'));
    });
  });

  describe('promptExists', () => {
    it('should return true when prompt meta file exists', () => {
      mockFs.existsSync.mockReturnValue(true);
      expect(promptExists('test-prompt')).toBe(true);
    });

    it('should return false when prompt meta file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      expect(promptExists('test-prompt')).toBe(false);
    });
  });

  describe('getMeta', () => {
    it('should return parsed meta', () => {
      const mockMeta: PromptMeta = {
        name: 'test-prompt',
        active_version: 2,
        versions: [1, 2],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockMeta));

      const result = getMeta('test-prompt');
      expect(result).toEqual(mockMeta);
    });

    it('should throw when meta file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      expect(() => getMeta('test-prompt')).toThrow('exists but is missing meta.json');
    });

    it('should throw when meta file is corrupted', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid json');
      expect(() => getMeta('test-prompt')).toThrow('corrupted');
    });
  });

  describe('saveMeta', () => {
    it('should write meta to file', () => {
      const mockMeta: PromptMeta = {
        name: 'test-prompt',
        active_version: 1,
        versions: [1],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      saveMeta('test-prompt', mockMeta);

      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('getVersion', () => {
    it('should return parsed version', () => {
      const mockVersion: PromptVersion = {
        version: 1,
        created_at: '2024-01-01T00:00:00Z',
        prompt: 'You are a helpful assistant.',
        model: 'claude-sonnet-4-6',
        provider: 'anthropic',
        temperature: 0.7,
        notes: 'Initial version',
      };
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockVersion));

      const result = getVersion('test-prompt', 1);
      expect(result).toEqual(mockVersion);
    });

    it('should throw when version file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      expect(() => getVersion('test-prompt', 1)).toThrow('not found');
    });

    it('should throw when version file is corrupted', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid json');
      expect(() => getVersion('test-prompt', 1)).toThrow('corrupted');
    });
  });

  describe('saveVersion', () => {
    it('should create directory and write version file', () => {
      const mockVersion: PromptVersion = {
        version: 1,
        created_at: '2024-01-01T00:00:00Z',
        prompt: 'You are a helpful assistant.',
        model: 'claude-sonnet-4-6',
        provider: 'anthropic',
        temperature: 0.7,
        notes: 'Initial version',
      };

      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => '');

      saveVersion('test-prompt', mockVersion);

      expect(mockFs.mkdirSync).toHaveBeenCalled();
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('listAllPrompts', () => {
    it('should return list of prompt directories', () => {
      mockFs.readdirSync.mockReturnValue(['prompt-1', 'prompt-2', 'file.txt'] as any);
      mockFs.statSync.mockImplementation((): any => ({
        isDirectory: () => true,
      }));

      const result = listAllPrompts();
      expect(result).toEqual(['prompt-1', 'prompt-2', 'file.txt']);
    });
  });
});
