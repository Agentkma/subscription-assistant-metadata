import { pathToFileURL } from 'node:url';

// True when the module was launched directly (e.g. `tsx src/buildBundle.ts`), false when imported by tests or other modules.
export function isRunAsScript(moduleUrl: string): boolean {
  const launchedScriptPath = process.argv[1];
  return launchedScriptPath !== undefined && moduleUrl === pathToFileURL(launchedScriptPath).href;
}
