import fs from 'fs';
import { saveRun, listRuns, pruneOldRuns } from '../../src/lib/runs';
import { RunResult } from '../../src/types';

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  readdirSync: jest.fn(),
  rmSync: jest.fn(),
}));

// Mock storage module
jest.mock('../../src/lib/storage', () => ({
  getPromptsDir: () => '/test/project/.prompts',
  getConfig: () => ({ max_runs_per_version: 20 }),
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe('Runs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(process, 'cwd').mockReturnValue('/test/project');
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('saveRun', () => {
    it('should create runs directory and save run file', () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => '');

      const run: RunResult = {
        input: 'test input',
        output: 'test output',
        model: 'claude-sonnet-4-6',
        provider: 'anthropic',
        ran_at: '2024-01-01T12:00:00.000Z',
        tokens_used: 100,
      };

      saveRun('test-prompt', 1, run);

      expect(mockFs.mkdirSync).toHaveBeenCalled();
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('should not create directory if it already exists', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([] as any);

      const run: RunResult = {
        input: 'test input',
        output: 'test output',
        model: 'claude-sonnet-4-6',
        provider: 'anthropic',
        ran_at: '2024-01-01T12:00:00.000Z',
        tokens_used: 100,
      };

      saveRun('test-prompt', 1, run);

      expect(mockFs.mkdirSync).not.toHaveBeenCalled();
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('listRuns', () => {
    it('should return empty array when runs directory does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = listRuns('test-prompt', 1);
      expect(result).toEqual([]);
    });

    it('should return list of runs sorted by filename', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(['run-1.json', 'run-2.json'] as any);
      mockFs.readFileSync
        .mockReturnValueOnce(JSON.stringify({ input: 'a', output: 'b', model: 'm', provider: 'p', ran_at: '2024-01-01T12:00:00Z' }))
        .mockReturnValueOnce(JSON.stringify({ input: 'c', output: 'd', model: 'm', provider: 'p', ran_at: '2024-01-01T13:00:00Z' }));

      const result = listRuns('test-prompt', 1);
      expect(result).toHaveLength(2);
      expect(result[0].input).toBe('a');
      expect(result[1].input).toBe('c');
    });
  });

  describe('pruneOldRuns', () => {
    it('should not delete runs when under limit', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(['run-1.json', 'run-2.json'] as any);

      pruneOldRuns('test-prompt', 1);

      expect(mockFs.rmSync).not.toHaveBeenCalled();
    });

    it('should delete oldest runs when over limit', () => {
      mockFs.existsSync.mockReturnValue(true);
      const files = Array.from({ length: 25 }, (_, i) => `run-${i + 1}.json`);
      mockFs.readdirSync.mockReturnValue(files as any);

      pruneOldRuns('test-prompt', 1);

      // Should delete 5 oldest runs (25 - 20 = 5)
      expect(mockFs.rmSync).toHaveBeenCalledTimes(5);
    });

    it('should do nothing when runs directory does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      pruneOldRuns('test-prompt', 1);

      expect(mockFs.readdirSync).not.toHaveBeenCalled();
      expect(mockFs.rmSync).not.toHaveBeenCalled();
    });
  });
});