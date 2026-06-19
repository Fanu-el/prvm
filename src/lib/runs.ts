import fs from 'fs';
import path from 'path';
import { RunResult } from '../types';
import { getPromptsDir, getConfig } from './storage';

function getRunsDir(name: string, version: number): string {
  return path.join(getPromptsDir(), '.runs', name, `v${version}`);
}

export function saveRun(name: string, version: number, run: RunResult): void {
  const dir = getRunsDir(name, version);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const timestamp = run.ran_at.replace(/[:.]/g, '-');
  const filePath = path.join(dir, `run-${timestamp}.json`);
  fs.writeFileSync(filePath, JSON.stringify(run, null, 2));

  pruneOldRuns(name, version);
}

export function listRuns(name: string, version: number): RunResult[] {
  const dir = getRunsDir(name, version);
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir)
    .sort()
    .map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')));
}

export function pruneOldRuns(name: string, version: number): void {
  const config = getConfig();
  const maxRuns = config.max_runs_per_version ?? 20;

  const dir = getRunsDir(name, version);
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir).sort(); // filenames are timestamp-sortable
  if (files.length > maxRuns) {
    const toDelete = files.slice(0, files.length - maxRuns);
    toDelete.forEach(f => fs.rmSync(path.join(dir, f)));
  }
}