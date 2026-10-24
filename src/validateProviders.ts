import fs from 'node:fs/promises';
import path from 'node:path';
import { Ajv as JsonValidator, type ErrorObject } from 'ajv';
import { fullFormats } from 'ajv-formats/dist/formats.js';
import { isSupportedCurrencyCode, providerSchema, supportedCategories } from './schema.js';
import type { ProviderPlan, ProviderRecord } from './types.js';

const supportedCategorySet = new Set<string>(supportedCategories);

const jsonValidator = new JsonValidator({ allErrors: true, strict: false, allowUnionTypes: true });
jsonValidator.addFormat('uri', fullFormats.uri);
jsonValidator.addFormat('date', fullFormats.date);
jsonValidator.addFormat('iso4217', isSupportedCurrencyCode);
const validate = jsonValidator.compile(providerSchema);

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

export interface ProviderSemanticOptions {
  expectedProviderId?: string;
  expectedCategory?: string;
}

function findDuplicatePlanIdErrors(plans: ProviderPlan[] | undefined, location: string): string[] {
  if (!plans) {
    return [];
  }

  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const plan of plans) {
    if (seen.has(plan.plan_id)) {
      duplicates.add(plan.plan_id);
    }
    seen.add(plan.plan_id);
  }

  return [...duplicates].map((planId) => `${location} duplicate plan_id "${planId}"`);
}

export function findProviderSemanticErrors(
  provider: ProviderRecord,
  options: ProviderSemanticOptions = {}
): string[] {
  const errors: string[] = [];

  if (!provider.regions.includes(provider.default_region)) {
    errors.push(`/default_region "${provider.default_region}" must be included in /regions`);
  }

  errors.push(...findDuplicatePlanIdErrors(provider.default.plans, '/default/plans'));

  for (const [region, override] of Object.entries(provider.regional_overrides)) {
    errors.push(...findDuplicatePlanIdErrors(override?.plans, `/regional_overrides/${region}/plans`));
  }

  if (options.expectedProviderId && provider.provider_id !== options.expectedProviderId) {
    errors.push(`/provider_id "${provider.provider_id}" must match filename "${options.expectedProviderId}.json"`);
  }

  if (options.expectedCategory && provider.category !== options.expectedCategory) {
    errors.push(`/category "${provider.category}" must match directory "${options.expectedCategory}"`);
  }

  return errors;
}

export async function validateProviderFile(
  filePath: string,
  options: ProviderSemanticOptions = {}
): Promise<ProviderValidationResult> {
  const fullPath = path.resolve(filePath);
  const parentDir = path.basename(path.dirname(fullPath));
  const expectedProviderId = options.expectedProviderId ?? path.basename(fullPath, '.json');
  const expectedCategory =
    options.expectedCategory ?? (supportedCategorySet.has(parentDir) ? parentDir : undefined);

  try {
    const raw = await fs.readFile(fullPath, 'utf8');
    const data = JSON.parse(raw);
    const valid = validate(data);

    if (!valid) {
      return {
        file: filePath,
        valid: false,
        errors: (validate.errors ?? []).map(formatValidationError)
      };
    }

    const semanticErrors = findProviderSemanticErrors(data as ProviderRecord, {
      expectedProviderId,
      expectedCategory
    });

    if (semanticErrors.length > 0) {
      return {
        file: filePath,
        valid: false,
        errors: semanticErrors
      };
    }

    return { file: filePath, valid: true, errors: [] };
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
  const results = await Promise.all(
    jsonFiles.map((file) => {
      const relativeDir = path.dirname(path.relative(resolvedDir, file));
      const expectedCategory = relativeDir === '.' ? undefined : relativeDir.split(path.sep)[0];
      return validateProviderFile(file, { expectedCategory });
    })
  );

  const filesByProviderId = new Map<string, string[]>();
  for (const file of jsonFiles) {
    const providerId = path.basename(file, '.json');
    const group = filesByProviderId.get(providerId) ?? [];
    group.push(file);
    filesByProviderId.set(providerId, group);
  }

  for (const result of results) {
    const providerId = path.basename(result.file, '.json');
    const matchingFiles = filesByProviderId.get(providerId) ?? [];
    if (matchingFiles.length > 1) {
      result.valid = false;
      result.errors.push(`/provider_id "${providerId}" is duplicated across multiple files`);
    }
  }

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
