import fs from 'fs';
import path from 'path';

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
  isInitialized: jest.fn(),
  initStorage: jest.fn(),
  getConfig: jest.fn(),
  promptExists: jest.fn(),
  getMeta: jest.fn(),
  saveMeta: jest.fn(),
  saveVersion: jest.fn(),
  getVersion: jest.fn(),
  listAllPrompts: jest.fn(),
  getPromptsDir: () => '/test/project/.prompts',
}));

// Mock inquirer
jest.mock('inquirer', () => ({
  prompt: jest.fn(),
}));

const mockFs = fs as jest.Mocked<typeof fs>;
const mockStorage = require('../../src/lib/storage');
const mockInquirer = require('inquirer');

describe('Command Actions', () => {
  const originalCwd = process.cwd();
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(process, 'cwd').mockReturnValue('/test/project');
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('init command', () => {
    it('should initialize storage when not already initialized', async () => {
      mockStorage.isInitialized.mockReturnValue(false);
      mockStorage.initStorage.mockImplementation(() => {});

      const { initCommand } = await import('../../src/commands/init');
      const cmd = initCommand();
      await cmd.parseAsync(['node', 'test']);

      expect(mockStorage.initStorage).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Initialized prvm'));
    });

    it('should not reinitialize when already initialized', async () => {
      mockStorage.isInitialized.mockReturnValue(true);

      const { initCommand } = await import('../../src/commands/init');
      const cmd = initCommand();
      await cmd.parseAsync(['node', 'test']);

      expect(mockStorage.initStorage).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('already initialized'));
    });
  });

  describe('list command', () => {
    it('should show message when no prompts exist', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockStorage.listAllPrompts.mockReturnValue([]);

      const { listCommand } = await import('../../src/commands/list');
      const cmd = listCommand();
      await cmd.parseAsync(['node', 'test']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No prompts saved'));
    });

    it('should list all prompts with version info', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockStorage.listAllPrompts.mockReturnValue(['prompt-1', 'prompt-2']);
      mockStorage.getMeta
        .mockReturnValueOnce({ name: 'prompt-1', active_version: 2, versions: [1, 2] })
        .mockReturnValueOnce({ name: 'prompt-2', active_version: 1, versions: [1] });

      const { listCommand } = await import('../../src/commands/list');
      const cmd = listCommand();
      await cmd.parseAsync(['node', 'test']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Saved Prompts'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('prompt-1'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('prompt-2'));
    });

    it('should fail when not initialized', async () => {
      mockStorage.isInitialized.mockReturnValue(false);

      const { listCommand } = await import('../../src/commands/list');
      const cmd = listCommand();
      await cmd.parseAsync(['node', 'test']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('prvm init'));
      expect(mockStorage.listAllPrompts).not.toHaveBeenCalled();
    });
  });

  describe('show command', () => {
    it('should show prompt version details', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockStorage.promptExists.mockReturnValue(true);
      mockStorage.getMeta.mockReturnValue({ name: 'test-prompt', active_version: 2, versions: [1, 2] });
      mockStorage.getVersion.mockReturnValue({
        version: 2,
        created_at: '2024-01-01T12:00:00Z',
        prompt: 'You are a helpful assistant.',
        model: 'claude-sonnet-4-6',
        provider: 'anthropic',
        temperature: 0.7,
        notes: 'Test notes',
      });

      const { showCommand } = await import('../../src/commands/show');
      const cmd = showCommand();
      await cmd.parseAsync(['node', 'test', 'test-prompt']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('test-prompt v2'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('You are a helpful assistant.'));
    });

    it('should show specific version with --version flag', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockStorage.promptExists.mockReturnValue(true);
      mockStorage.getMeta.mockReturnValue({ name: 'test-prompt', active_version: 2, versions: [1, 2] });
      mockStorage.getVersion.mockReturnValue({
        version: 1,
        created_at: '2024-01-01T12:00:00Z',
        prompt: 'You are a helpful assistant v1.',
        model: 'claude-sonnet-4-6',
        provider: 'anthropic',
        temperature: 0.7,
        notes: '',
      });

      const { showCommand } = await import('../../src/commands/show');
      const cmd = showCommand();
      await cmd.parseAsync(['node', 'test', 'test-prompt', '--version', '1']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('test-prompt v1'));
    });

    it('should error when prompt does not exist', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockStorage.promptExists.mockReturnValue(false);

      const { showCommand } = await import('../../src/commands/show');
      const cmd = showCommand();
      await cmd.parseAsync(['node', 'test', 'nonexistent']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    });

    it('should error when version does not exist', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockStorage.promptExists.mockReturnValue(true);
      mockStorage.getMeta.mockReturnValue({ name: 'test-prompt', active_version: 2, versions: [1, 2] });

      const { showCommand } = await import('../../src/commands/show');
      const cmd = showCommand();
      await cmd.parseAsync(['node', 'test', 'test-prompt', '--version', '5']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('does not exist'));
    });
  });

  describe('use command', () => {
    it('should set active version', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockStorage.promptExists.mockReturnValue(true);
      mockStorage.getMeta.mockReturnValue({
        name: 'test-prompt',
        active_version: 2,
        versions: [1, 2, 3],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });
      mockStorage.saveMeta.mockImplementation(() => {});

      const { useCommand } = await import('../../src/commands/use');
      const cmd = useCommand();
      await cmd.parseAsync(['node', 'test', 'test-prompt', '1']);

      expect(mockStorage.saveMeta).toHaveBeenCalledWith('test-prompt', expect.objectContaining({ active_version: 1 }));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('now using v1'));
    });

    it('should error when version does not exist', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockStorage.promptExists.mockReturnValue(true);
      mockStorage.getMeta.mockReturnValue({ name: 'test-prompt', active_version: 2, versions: [1, 2] });

      const { useCommand } = await import('../../src/commands/use');
      const cmd = useCommand();
      await cmd.parseAsync(['node', 'test', 'test-prompt', '5']);

      expect(mockStorage.saveMeta).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('does not exist'));
    });
  });

  describe('rollback command', () => {
    it('should rollback to previous version', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockStorage.promptExists.mockReturnValue(true);
      mockStorage.getMeta.mockReturnValue({
        name: 'test-prompt',
        active_version: 3,
        versions: [1, 2, 3],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });
      mockStorage.saveMeta.mockImplementation(() => {});

      const { rollbackCommand } = await import('../../src/commands/rollback');
      const cmd = rollbackCommand();
      await cmd.parseAsync(['node', 'test', 'test-prompt']);

      expect(mockStorage.saveMeta).toHaveBeenCalledWith('test-prompt', expect.objectContaining({ active_version: 2 }));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Rolled back'));
    });

    it('should error when already at earliest version', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockStorage.promptExists.mockReturnValue(true);
      mockStorage.getMeta.mockReturnValue({
        name: 'test-prompt',
        active_version: 1,
        versions: [1],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });

      const { rollbackCommand } = await import('../../src/commands/rollback');
      const cmd = rollbackCommand();
      await cmd.parseAsync(['node', 'test', 'test-prompt']);

      expect(mockStorage.saveMeta).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('earliest version'));
    });
  });

  describe('diff command', () => {
    it('should show diff between versions', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockStorage.promptExists.mockReturnValue(true);
      mockStorage.getMeta.mockReturnValue({
        name: 'test-prompt',
        active_version: 2,
        versions: [1, 2],
      });
      mockStorage.getVersion
        .mockReturnValueOnce({
          version: 2,
          prompt: 'Line 1\nLine 2 changed\nLine 3',
          created_at: '2024-01-01T12:00:00Z',
          model: 'claude-sonnet-4-6',
          provider: 'anthropic',
          temperature: 0.7,
        })
        .mockReturnValueOnce({
          version: 1,
          prompt: 'Line 1\nLine 2\nLine 3',
          created_at: '2024-01-01T12:00:00Z',
          model: 'claude-sonnet-4-6',
          provider: 'anthropic',
          temperature: 0.7,
        });

      const { diffCommand } = await import('../../src/commands/diff');
      const cmd = diffCommand();
      await cmd.parseAsync(['node', 'test', 'test-prompt']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Diff:'));
    });

    it('should show message when only one version exists', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockStorage.promptExists.mockReturnValue(true);
      mockStorage.getMeta.mockReturnValue({
        name: 'test-prompt',
        active_version: 1,
        versions: [1],
      });

      const { diffCommand } = await import('../../src/commands/diff');
      const cmd = diffCommand();
      await cmd.parseAsync(['node', 'test', 'test-prompt']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('nothing to diff'));
    });
  });

  describe('history command', () => {
    it('should show version history', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockStorage.promptExists.mockReturnValue(true);
      mockStorage.getMeta.mockReturnValue({
        name: 'test-prompt',
        active_version: 2,
        versions: [1, 2],
      });
      mockStorage.getVersion
        .mockReturnValueOnce({
          version: 1,
          created_at: '2024-01-01T12:00:00Z',
          prompt: 'v1 prompt',
          model: 'claude-sonnet-4-6',
          provider: 'anthropic',
          temperature: 0.7,
          notes: 'Initial',
        })
        .mockReturnValueOnce({
          version: 2,
          created_at: '2024-01-02T12:00:00Z',
          prompt: 'v2 prompt',
          model: 'claude-sonnet-4-6',
          provider: 'anthropic',
          temperature: 0.7,
          notes: 'Updated',
        });

      const { historyCommand } = await import('../../src/commands/history');
      const cmd = historyCommand();
      await cmd.parseAsync(['node', 'test', 'test-prompt']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('History for'));
    });
  });

  describe('current command', () => {
    it('should show active version details', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockStorage.promptExists.mockReturnValue(true);
      mockStorage.getMeta.mockReturnValue({
        name: 'test-prompt',
        active_version: 2,
        versions: [1, 2],
      });
      mockStorage.getVersion.mockReturnValue({
        version: 2,
        created_at: '2024-01-01T12:00:00Z',
        prompt: 'Active prompt content',
        model: 'claude-sonnet-4-6',
        provider: 'anthropic',
        temperature: 0.7,
        notes: 'Current version',
      });

      const { currentCommand } = await import('../../src/commands/current');
      const cmd = currentCommand();
      await cmd.parseAsync(['node', 'test', 'test-prompt']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('active: v2'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Active prompt content'));
    });
  });

  describe('export command', () => {
    it('should export prompt to JSON file', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockStorage.promptExists.mockReturnValue(true);
      mockStorage.getMeta.mockReturnValue({
        name: 'test-prompt',
        active_version: 2,
        versions: [1, 2],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      });
      mockStorage.getVersion
        .mockReturnValueOnce({
          version: 1,
          created_at: '2024-01-01T12:00:00Z',
          prompt: 'v1 prompt',
          model: 'claude-sonnet-4-6',
          provider: 'anthropic',
          temperature: 0.7,
        })
        .mockReturnValueOnce({
          version: 2,
          created_at: '2024-01-02T12:00:00Z',
          prompt: 'v2 prompt',
          model: 'claude-sonnet-4-6',
          provider: 'anthropic',
          temperature: 0.7,
        });

      const { exportCommand } = await import('../../src/commands/export');
      const cmd = exportCommand();
      await cmd.parseAsync(['node', 'test', 'test-prompt', 'output.json']);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith('output.json', expect.stringContaining('test-prompt'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Exported'));
    });
  });

  describe('config command', () => {
    it('should show current config with --show', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockStorage.getConfig.mockReturnValue({
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        temperature: 0.7,
        max_runs_per_version: 20,
      });

      const { configCommand } = await import('../../src/commands/config');
      const cmd = configCommand();
      await cmd.parseAsync(['node', 'test', '--show']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Current config'));
    });

    it('should update max-runs', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockStorage.getConfig.mockReturnValue({
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        temperature: 0.7,
        max_runs_per_version: 20,
      });
      mockFs.writeFileSync.mockImplementation(() => {});

      const { configCommand } = await import('../../src/commands/config');
      const cmd = configCommand();
      await cmd.parseAsync(['node', 'test', '--max-runs', '50']);

      expect(mockFs.writeFileSync).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Config updated'));
    });

    it('should validate max-runs is positive', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockStorage.getConfig.mockReturnValue({
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        temperature: 0.7,
        max_runs_per_version: 20,
      });

      const { configCommand } = await import('../../src/commands/config');
      const cmd = configCommand();
      await cmd.parseAsync(['node', 'test', '--max-runs', '-5']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('positive number'));
      expect(mockFs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should update provider and model', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockStorage.getConfig.mockReturnValue({
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        temperature: 0.7,
        max_runs_per_version: 20,
      });
      mockFs.writeFileSync.mockImplementation(() => {});

      const { configCommand } = await import('../../src/commands/config');
      const cmd = configCommand();
      await cmd.parseAsync(['node', 'test', '--provider', 'openai', '--model', 'gpt-4']);

      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('should update max-tokens', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockStorage.getConfig.mockReturnValue({
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        temperature: 0.7,
        max_runs_per_version: 20,
      });
      mockFs.writeFileSync.mockImplementation(() => {});

      const { configCommand } = await import('../../src/commands/config');
      const cmd = configCommand();
      await cmd.parseAsync(['node', 'test', '--max-tokens', '2048']);

      expect(mockFs.writeFileSync).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Config updated'));
    });

    it('should validate max-tokens is positive', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockStorage.getConfig.mockReturnValue({
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        temperature: 0.7,
        max_runs_per_version: 20,
      });

      const { configCommand } = await import('../../src/commands/config');
      const cmd = configCommand();
      await cmd.parseAsync(['node', 'test', '--max-tokens', '-100']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('positive number'));
      expect(mockFs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should show max_tokens in config when set', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockStorage.getConfig.mockReturnValue({
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        temperature: 0.7,
        max_runs_per_version: 20,
        max_tokens: 4096,
      });

      const { configCommand } = await import('../../src/commands/config');
      const cmd = configCommand();
      await cmd.parseAsync(['node', 'test', '--show']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('4096'));
    });
  });

  describe('gitignore command', () => {
    it('should add entry to .gitignore with --add', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('node_modules/\n');
      mockFs.writeFileSync.mockImplementation(() => {});

      const { gitignoreCommand } = await import('../../src/commands/gitignore');
      const cmd = gitignoreCommand();
      await cmd.parseAsync(['node', 'test', '--add']);

      expect(mockFs.writeFileSync).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Added'));
    });

    it('should not add if already ignored', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('.prompts/.runs/\nnode_modules/\n');

      const { gitignoreCommand } = await import('../../src/commands/gitignore');
      const cmd = gitignoreCommand();
      await cmd.parseAsync(['node', 'test', '--add']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Already ignored'));
      expect(mockFs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should remove entry from .gitignore with --remove', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('.prompts/.runs/\nnode_modules/\n');
      mockFs.writeFileSync.mockImplementation(() => {});

      const { gitignoreCommand } = await import('../../src/commands/gitignore');
      const cmd = gitignoreCommand();
      await cmd.parseAsync(['node', 'test', '--remove']);

      expect(mockFs.writeFileSync).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Removed'));
    });

    it('should skip confirmation with --yes flag', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockFs.existsSync.mockReturnValue(false);
      mockFs.readFileSync.mockReturnValue('');
      mockFs.writeFileSync.mockImplementation(() => {});

      const { gitignoreCommand } = await import('../../src/commands/gitignore');
      const cmd = gitignoreCommand();
      await cmd.parseAsync(['node', 'test', '--add', '--yes']);

      expect(mockInquirer.prompt).not.toHaveBeenCalled();
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('save command', () => {
    it('should save new prompt', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockStorage.promptExists.mockReturnValue(false);
      mockStorage.getConfig.mockReturnValue({
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        temperature: 0.7,
      });
      mockStorage.saveVersion.mockImplementation(() => {});
      mockStorage.saveMeta.mockImplementation(() => {});
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('You are a helpful assistant.');

      const { saveCommand } = await import('../../src/commands/save');
      const cmd = saveCommand();
      await cmd.parseAsync(['node', 'test', 'test-prompt', 'prompt.txt']);

      expect(mockStorage.saveVersion).toHaveBeenCalled();
      expect(mockStorage.saveMeta).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Saved test-prompt v1'));
    });

    it('should save new version of existing prompt', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockStorage.promptExists.mockReturnValue(true);
      mockStorage.getConfig.mockReturnValue({
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        temperature: 0.7,
      });
      mockStorage.getMeta.mockReturnValue({
        name: 'test-prompt',
        active_version: 1,
        versions: [1],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });
      mockStorage.getVersion.mockReturnValue({
        version: 1,
        prompt: 'Old prompt',
        created_at: '2024-01-01T12:00:00Z',
        model: 'claude-sonnet-4-6',
        provider: 'anthropic',
        temperature: 0.7,
      });
      mockStorage.saveVersion.mockImplementation(() => {});
      mockStorage.saveMeta.mockImplementation(() => {});
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('New prompt content');

      const { saveCommand } = await import('../../src/commands/save');
      const cmd = saveCommand();
      await cmd.parseAsync(['node', 'test', 'test-prompt', 'prompt.txt']);

      expect(mockStorage.saveVersion).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Saved test-prompt v2'));
    });

    it('should warn on identical content', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockStorage.promptExists.mockReturnValue(true);
      mockStorage.getConfig.mockReturnValue({
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        temperature: 0.7,
      });
      mockStorage.getMeta.mockReturnValue({
        name: 'test-prompt',
        active_version: 1,
        versions: [1],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });
      mockStorage.getVersion.mockReturnValue({
        version: 1,
        prompt: 'Same content',
        created_at: '2024-01-01T12:00:00Z',
        model: 'claude-sonnet-4-6',
        provider: 'anthropic',
        temperature: 0.7,
      });
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('Same content');

      const { saveCommand } = await import('../../src/commands/save');
      const cmd = saveCommand();
      await cmd.parseAsync(['node', 'test', 'test-prompt', 'prompt.txt']);

      expect(mockStorage.saveVersion).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('identical'));
    });

    it('should error when file not found', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockFs.existsSync.mockReturnValue(false);

      const { saveCommand } = await import('../../src/commands/save');
      const cmd = saveCommand();
      await cmd.parseAsync(['node', 'test', 'test-prompt', 'nonexistent.txt']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('File not found'));
      expect(mockStorage.saveVersion).not.toHaveBeenCalled();
    });

    it('should error when file is empty', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('   \n\t  ');

      const { saveCommand } = await import('../../src/commands/save');
      const cmd = saveCommand();
      await cmd.parseAsync(['node', 'test', 'test-prompt', 'empty.txt']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('empty'));
      expect(mockStorage.saveVersion).not.toHaveBeenCalled();
    });

    it('should error when prompt exceeds max length', async () => {
      mockStorage.isInitialized.mockReturnValue(true);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('a'.repeat(60000));

      const { saveCommand } = await import('../../src/commands/save');
      const cmd = saveCommand();
      await cmd.parseAsync(['node', 'test', 'test-prompt', 'large.txt']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('exceeds'));
      expect(mockStorage.saveVersion).not.toHaveBeenCalled();
    });

    it('should error when name format is invalid', async () => {
      mockStorage.isInitialized.mockReturnValue(true);

      const { saveCommand } = await import('../../src/commands/save');
      const cmd = saveCommand();
      await cmd.parseAsync(['node', 'test', 'Invalid_Name', 'prompt.txt']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid prompt name'));
      expect(mockStorage.saveVersion).not.toHaveBeenCalled();
    });
  });
});