import fs from 'node:fs/promises';
import path from 'node:path';
import { Ajv, type ErrorObject } from 'ajv';
import { providerSchema } from './schema.js';

const ajv = new Ajv({ allErrors: true, strict: false, allowUnionTypes: true });
const validate = ajv.compile(providerSchema);

const formatValidationError = (error: ErrorObject): string => {
  const location = error.instancePath || '/';
  const message = error.message ?? 'validation failed';
  return `${location} ${message}`;
};

export interface ProviderValidationResult {
  file: string;
  valid: boolean;
  errors: string[];
}

export async function validateProviderFile(filePath: string): Promise<ProviderValidationResult> {
  const fullPath = path.resolve(filePath);

  try {
    const raw = await fs.readFile(fullPath, 'utf8');
    const data = JSON.parse(raw);
    const valid = validate(data);

    if (valid) {
      return { file: filePath, valid: true, errors: [] };
    }

    return {
      file: filePath,
      valid: false,
      errors: (validate.errors ?? []).map(formatValidationError)
    };
  } catch (error) {
    return {
      file: filePath,
      valid: false,
      errors: [error instanceof Error ? error.message : 'Unknown validation error']
    };
  }
}

async function listJsonFiles(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listJsonFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }

  return files;
}

export async function validateProvidersDirectory(dirPath: string): Promise<ProviderValidationResult[]> {
  const resolvedDir = path.resolve(dirPath);
  const jsonFiles = await listJsonFiles(resolvedDir);
  const results = await Promise.all(jsonFiles.map((file) => validateProviderFile(file)));
  return results;
}

async function main() {
  const results = await validateProvidersDirectory('metadata/providers');

  for (const result of results) {
    if (!result.valid) {
      console.error(`Invalid provider: ${result.file}`);
      for (const error of result.errors) {
        console.error(`  - ${error}`);
      }
      process.exitCode = 1;
    }
  }

  if (results.length === 0) {
    console.error('No provider files found in metadata/providers');
    process.exitCode = 1;
  }

  if (process.exitCode === undefined) {
    console.log(`Validated ${results.length} provider file(s) successfully.`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
