import fs from 'node:fs/promises';
import path from 'node:path';
import { Ajv as JsonValidator, type ErrorObject } from 'ajv';
import { fullFormats } from 'ajv-formats/dist/formats.js';
import { isSupportedCurrencyCode, providerSchema } from './schema.js';
import type { ProviderOverride, ProviderPlan, ProviderRecord } from './types.js';

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

export function findProviderSchemaErrors(data: unknown): string[] {
  return validate(data) ? [] : (validate.errors ?? []).map(formatValidationError);
}

export interface ProviderValidationResult {
  file: string;
  valid: boolean;
  errors: string[];
}

export interface ProviderSemanticOptions {
  expectedProviderId?: string;
  expectedCategory?: string;
  /** Latest allowed `source.verified_at` (YYYY-MM-DD). Defaults to tomorrow in UTC. */
  maxVerifiedAt?: string;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

function latestAllowedVerificationDate(): string {
  // One day of slack so a reviewer ahead of UTC can record their local date.
  return toIsoDate(new Date(Date.now() + ONE_DAY_MS));
}

// YYYY-MM-DD strings sort chronologically, so string comparison is date comparison.
const isAfterDate = (candidate: string, limit: string): boolean => candidate > limit;

const NOT_PART_OF_LARGER_NUMBER_BEFORE = '(?<![\\d.])';
const NOT_PART_OF_LARGER_NUMBER_AFTER = '(?!\\d|\\.\\d)';

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// e.g. 8.9 may appear as "8.90" or "8.9"; 139 as "139.00" or "139".
const priceSpellings = (amount: number): string[] => [...new Set([amount.toFixed(2), String(amount)])];

const containsStandalonePrice = (text: string, spelling: string): boolean =>
  new RegExp(`${NOT_PART_OF_LARGER_NUMBER_BEFORE}${escapeRegExp(spelling)}${NOT_PART_OF_LARGER_NUMBER_AFTER}`).test(text);

export function evidenceMentionsAmount(evidence: string, amount: number): boolean {
  return priceSpellings(amount).some((spelling) => containsStandalonePrice(evidence, spelling));
}

// Evidence is optional on manual plans; when present it must quote the recorded price.
function evidenceOmitsPrice(plan: ProviderPlan): boolean {
  const { evidence } = plan.source;
  if (!evidence) {
    return false;
  }
  return !evidenceMentionsAmount(evidence, plan.price.amount);
}

function findPlanSourceErrors(
  plans: ProviderPlan[] | undefined,
  location: string,
  maxVerifiedAt: string
): string[] {
  const errors: string[] = [];

  for (const [index, plan] of (plans ?? []).entries()) {
    const planLocation = `${location}/${index}`;
    const verifiedInFuture = isAfterDate(plan.source.verified_at, maxVerifiedAt);

    if (verifiedInFuture) {
      errors.push(`${planLocation}/source/verified_at "${plan.source.verified_at}" must not be in the future`);
    }

    if (evidenceOmitsPrice(plan)) {
      errors.push(`${planLocation}/source/evidence must contain the recorded price ${plan.price.amount}`);
    }
  }

  return errors;
}

function findUpgradePathErrors(
  scope: ProviderOverride | undefined,
  knownPlanIds: Set<string>,
  location: string
): string[] {
  const errors: string[] = [];

  for (const [index, upgradePath] of (scope?.recommendations?.upgrade_paths ?? []).entries()) {
    const targetsUnknownPlan = !knownPlanIds.has(upgradePath.target_plan_id);

    if (targetsUnknownPlan) {
      errors.push(
        `${location}/recommendations/upgrade_paths/${index}/target_plan_id "${upgradePath.target_plan_id}" does not match any plan_id`
      );
    }
  }

  return errors;
}

const isListedRegion = (provider: ProviderRecord, region: string): boolean =>
  provider.regions.some((listedRegion) => listedRegion === region);

const collectPlanIds = (...planLists: Array<ProviderPlan[] | undefined>): Set<string> =>
  new Set(planLists.flatMap((plans) => plans ?? []).map((plan) => plan.plan_id));

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

// The default block and each regional override follow the same plan and recommendation rules.
function findScopeErrors(
  scope: ProviderOverride | undefined,
  location: string,
  visiblePlanIds: Set<string>,
  maxVerifiedAt: string
): string[] {
  return [
    ...findDuplicatePlanIdErrors(scope?.plans, `${location}/plans`),
    ...findPlanSourceErrors(scope?.plans, `${location}/plans`, maxVerifiedAt),
    ...findUpgradePathErrors(scope, visiblePlanIds, location)
  ];
}

export function findProviderSemanticErrors(
  provider: ProviderRecord,
  options: ProviderSemanticOptions = {}
): string[] {
  const errors: string[] = [];
  const maxVerifiedAt = options.maxVerifiedAt ?? latestAllowedVerificationDate();

  if (!isListedRegion(provider, provider.default_region)) {
    errors.push(`/default_region "${provider.default_region}" must be included in /regions`);
  }

  errors.push(...findScopeErrors(provider.default, '/default', collectPlanIds(provider.default.plans), maxVerifiedAt));

  for (const [region, override] of Object.entries(provider.regional_overrides)) {
    const location = `/regional_overrides/${region}`;

    if (!isListedRegion(provider, region)) {
      errors.push(`${location} region "${region}" must be included in /regions`);
    }

    const planIdsVisibleInRegion = collectPlanIds(provider.default.plans, override?.plans);
    errors.push(...findScopeErrors(override, location, planIdsVisibleInRegion, maxVerifiedAt));
  }

  const providerIdMismatchesFilename =
    Boolean(options.expectedProviderId) && provider.provider_id !== options.expectedProviderId;
  const categoryMismatchesDirectory =
    Boolean(options.expectedCategory) && provider.category !== options.expectedCategory;

  if (providerIdMismatchesFilename) {
    errors.push(`/provider_id "${provider.provider_id}" must match filename "${options.expectedProviderId}.json"`);
  }

  if (categoryMismatchesDirectory) {
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
  const expectedCategory = options.expectedCategory ?? parentDir;

  try {
    const raw = await fs.readFile(fullPath, 'utf8');
    const data = JSON.parse(raw);
    const schemaErrors = findProviderSchemaErrors(data);

    if (schemaErrors.length > 0) {
      return { file: filePath, valid: false, errors: schemaErrors };
    }

    const semanticErrors = findProviderSemanticErrors(data as ProviderRecord, {
      ...options,
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
    jsonFiles.map(async (file) => {
      const relativeDir = path.dirname(path.relative(resolvedDir, file));
      const dirSegments = relativeDir === '.' ? [] : relativeDir.split(path.sep);
      const isDirectlyUnderCategoryDir = dirSegments.length === 1;

      if (!isDirectlyUnderCategoryDir) {
        return {
          file,
          valid: false,
          errors: [
            `Provider file must be located directly under a category directory (<category>/<provider_id>.json), found "${path.relative(resolvedDir, file)}"`
          ]
        };
      }

      const [expectedCategory] = dirSegments;
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
    const isDuplicatedProviderId = matchingFiles.length > 1;

    if (isDuplicatedProviderId) {
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
