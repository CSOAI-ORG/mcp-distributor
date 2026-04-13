/**
 * MCP Distributor — Core Logic
 * Reads MCP package metadata and distributes to multiple registries.
 */

import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type {
  McpPackageJson,
  McpServerMeta,
  DistributorConfig,
  DistributionResult,
  RegistryName,
} from "./types.js";
import { getAdapters, ALL_REGISTRY_NAMES } from "./registries/index.js";

/**
 * Parse a package.json into McpServerMeta.
 */
export function parsePackageMeta(
  packageDir: string
): McpServerMeta | null {
  const pkgPath = join(packageDir, "package.json");
  if (!existsSync(pkgPath)) return null;

  let raw: McpPackageJson;
  try {
    raw = JSON.parse(readFileSync(pkgPath, "utf-8"));
  } catch {
    return null;
  }

  if (!raw.name || !raw.version || !raw.description) return null;

  const scopeMatch = raw.name.match(/^(@[^/]+)\//);
  const scope = scopeMatch ? scopeMatch[1] : "";
  const shortName = scope ? raw.name.slice(scope.length + 1) : raw.name;

  const binName = raw.bin
    ? Object.keys(raw.bin)[0] || shortName + "-mcp"
    : shortName + "-mcp";

  const repoUrl =
    typeof raw.repository === "object" && raw.repository?.url
      ? raw.repository.url.replace(/^git\+/, "").replace(/\.git$/, "")
      : "";

  return {
    name: raw.name,
    shortName,
    scope,
    version: raw.version,
    description: raw.description,
    binName,
    repoUrl,
    repoDirectory: typeof raw.repository === "object" ? raw.repository.directory : undefined,
    keywords: raw.keywords || [],
    license: raw.license || "MIT",
    packageDir: resolve(packageDir),
    raw,
  };
}

/**
 * Discover all MCP packages in a directory.
 */
export function discoverPackages(baseDir: string): McpServerMeta[] {
  const packages: McpServerMeta[] = [];
  const entries = readdirSync(baseDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const pkgDir = join(baseDir, entry.name);
    const meta = parsePackageMeta(pkgDir);
    if (meta && meta.name.startsWith("@csgaglobal/")) {
      packages.push(meta);
    }
  }

  return packages.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Distribute a single package to specified registries.
 */
export async function distributePackage(
  meta: McpServerMeta,
  config: DistributorConfig
): Promise<DistributionResult> {
  const adapters = getAdapters(config.registries);
  const results = [];

  for (const adapter of adapters) {
    const result = await adapter.distribute(meta, config);
    results.push(result);
  }

  return {
    package: meta.name,
    results,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Distribute all packages in a directory.
 */
export async function distributeAll(
  baseDir: string,
  config: DistributorConfig,
  onProgress?: (pkg: string, index: number, total: number) => void
): Promise<DistributionResult[]> {
  const packages = discoverPackages(baseDir);
  const results: DistributionResult[] = [];

  for (let i = 0; i < packages.length; i++) {
    const meta = packages[i];
    onProgress?.(meta.name, i, packages.length);
    const result = await distributePackage(meta, config);
    results.push(result);

    // Rate limiting between npm publishes
    if (config.registries.includes("npm") && !config.dryRun && i < packages.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  return results;
}

/**
 * Write distribution results to a JSON report.
 */
export function writeReport(
  results: DistributionResult[],
  outputPath: string
): void {
  const summary = {
    timestamp: new Date().toISOString(),
    totalPackages: results.length,
    registrySummary: summarizeByRegistry(results),
    packages: results,
  };
  writeFileSync(outputPath, JSON.stringify(summary, null, 2) + "\n", "utf-8");
}

function summarizeByRegistry(
  results: DistributionResult[]
): Record<string, { success: number; failed: number; skipped: number; manual: number }> {
  const summary: Record<string, { success: number; failed: number; skipped: number; manual: number }> = {};

  for (const pkg of results) {
    for (const r of pkg.results) {
      if (!summary[r.registry]) {
        summary[r.registry] = { success: 0, failed: 0, skipped: 0, manual: 0 };
      }
      summary[r.registry][r.status]++;
    }
  }

  return summary;
}

export { ALL_REGISTRY_NAMES };
export type { McpServerMeta, DistributorConfig, DistributionResult };
