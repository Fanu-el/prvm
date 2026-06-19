import { Command } from 'commander';

// Mock fs module
jest.mock('fs');

describe('Commands Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(process, 'cwd').mockReturnValue('/test/project');
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('Core Commands', () => {
    it('should have init command', async () => {
      const { initCommand } = await import('../../src/commands/init');
      expect(initCommand()).toBeInstanceOf(Command);
      expect(initCommand().name()).toBe('init');
    });

    it('should have save command', async () => {
      const { saveCommand } = await import('../../src/commands/save');
      expect(saveCommand()).toBeInstanceOf(Command);
      expect(saveCommand().name()).toBe('save');
    });

    it('should have list command', async () => {
      const { listCommand } = await import('../../src/commands/list');
      expect(listCommand()).toBeInstanceOf(Command);
      expect(listCommand().name()).toBe('list');
    });

    it('should have show command', async () => {
      const { showCommand } = await import('../../src/commands/show');
      expect(showCommand()).toBeInstanceOf(Command);
      expect(showCommand().name()).toBe('show');
    });

    it('should have use command', async () => {
      const { useCommand } = await import('../../src/commands/use');
      expect(useCommand()).toBeInstanceOf(Command);
      expect(useCommand().name()).toBe('use');
    });

    it('should have rollback command', async () => {
      const { rollbackCommand } = await import('../../src/commands/rollback');
      expect(rollbackCommand()).toBeInstanceOf(Command);
      expect(rollbackCommand().name()).toBe('rollback');
    });

    it('should have diff command', async () => {
      const { diffCommand } = await import('../../src/commands/diff');
      expect(diffCommand()).toBeInstanceOf(Command);
      expect(diffCommand().name()).toBe('diff');
    });

    it('should have history command', async () => {
      const { historyCommand } = await import('../../src/commands/history');
      expect(historyCommand()).toBeInstanceOf(Command);
      expect(historyCommand().name()).toBe('history');
    });

    it('should have export command', async () => {
      const { exportCommand } = await import('../../src/commands/export');
      expect(exportCommand()).toBeInstanceOf(Command);
      expect(exportCommand().name()).toBe('export');
    });

    it('should have current command', async () => {
      const { currentCommand } = await import('../../src/commands/current');
      expect(currentCommand()).toBeInstanceOf(Command);
      expect(currentCommand().name()).toBe('current');
    });

    it('should have config command', async () => {
      const { configCommand } = await import('../../src/commands/config');
      expect(configCommand()).toBeInstanceOf(Command);
      expect(configCommand().name()).toBe('config');
    });

    it('should have gitignore command', async () => {
      const { gitignoreCommand } = await import('../../src/commands/gitignore');
      expect(gitignoreCommand()).toBeInstanceOf(Command);
      expect(gitignoreCommand().name()).toBe('gitignore');
    });
  });

  describe('New Features - Eval Command', () => {
    it('should support --all-versions option', async () => {
      const { evalCommand } = await import('../../src/commands/eval');
      const cmd = evalCommand();
      
      const options = cmd.options;
      const allVersionsOption = options.find(o => o.long === '--all-versions');
      
      expect(allVersionsOption).toBeDefined();
      expect(allVersionsOption?.description).toContain('all versions');
    });

    it('should support --version option', async () => {
      const { evalCommand } = await import('../../src/commands/eval');
      const cmd = evalCommand();
      
      const options = cmd.options;
      const versionOption = options.find(o => o.long === '--version');
      
      expect(versionOption).toBeDefined();
    });

    it('should have correct name', async () => {
      const { evalCommand } = await import('../../src/commands/eval');
      expect(evalCommand().name()).toBe('eval');
    });
  });

  describe('New Features - Test Command', () => {
    it('should support temperature override', async () => {
      const { testCommand } = await import('../../src/commands/test');
      const cmd = testCommand();
      
      const options = cmd.options;
      const tempOption = options.find(o => o.long === '--temperature');
      
      expect(tempOption).toBeDefined();
      expect(tempOption?.description).toContain('temperature');
    });

    it('should support model override', async () => {
      const { testCommand } = await import('../../src/commands/test');
      const cmd = testCommand();
      
      const options = cmd.options;
      const modelOption = options.find(o => o.long === '--model');
      
      expect(modelOption).toBeDefined();
    });

    it('should support provider override', async () => {
      const { testCommand } = await import('../../src/commands/test');
      const cmd = testCommand();
      
      const options = cmd.options;
      const providerOption = options.find(o => o.long === '--provider');
      
      expect(providerOption).toBeDefined();
    });

    it('should have correct name', async () => {
      const { testCommand } = await import('../../src/commands/test');
      expect(testCommand().name()).toBe('test');
    });
  });
});