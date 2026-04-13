/**
 * MCP Distributor — Type Definitions
 * Interfaces for MCP package metadata and registry configurations.
 */

export interface McpPackageJson {
  name: string;
  version: string;
  description: string;
  main?: string;
  types?: string;
  bin?: Record<string, string>;
  files?: string[];
  license?: string;
  type?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  author?: string | { name: string; email?: string; url?: string };
  repository?: {
    type: string;
    url: string;
    directory?: string;
  };
  keywords?: string[];
  engines?: Record<string, string>;
  homepage?: string;
}

export interface McpServerMeta {
  /** Package name e.g. @csgaglobal/ai-governance */
  name: string;
  /** Short name without scope e.g. ai-governance */
  shortName: string;
  /** npm scope e.g. @csgaglobal */
  scope: string;
  version: string;
  description: string;
  /** Binary entry point name */
  binName: string;
  /** GitHub repository URL */
  repoUrl: string;
  /** Subdirectory within monorepo */
  repoDirectory?: string;
  keywords: string[];
  license: string;
  /** Absolute path to package directory */
  packageDir: string;
  /** Raw package.json */
  raw: McpPackageJson;
}

export interface RegistryResult {
  registry: string;
  status: "success" | "skipped" | "failed" | "manual";
  message: string;
  /** URL or file path of artifact produced */
  artifact?: string;
}

export interface DistributionResult {
  package: string;
  results: RegistryResult[];
  timestamp: string;
}

export interface DistributorConfig {
  /** npm auth token */
  npmToken?: string;
  /** GitHub personal access token (for API submissions) */
  githubToken?: string;
  /** Smithery API key (if available) */
  smitheryApiKey?: string;
  /** Output directory for generated artifacts */
  outputDir: string;
  /** Run in dry-run mode (no actual publishes) */
  dryRun: boolean;
  /** Registries to target */
  registries: RegistryName[];
}

export type RegistryName =
  | "npm"
  | "smithery"
  | "glama"
  | "mcp-so"
  | "pulsemcp"
  | "mcp-get"
  | "opentools";

export interface RegistryAdapter {
  name: RegistryName;
  displayName: string;
  /** Whether this registry has an automated API */
  hasApi: boolean;
  /** Distribute a package to this registry */
  distribute(
    meta: McpServerMeta,
    config: DistributorConfig
  ): Promise<RegistryResult>;
}

/** Smithery configuration file structure */
export interface SmitheryConfig {
  name: string;
  description: string;
  version: string;
  repository: string;
  homepage?: string;
  license: string;
  runtime: "node";
  command: {
    npx: string;
    args?: string[];
  };
  categories?: string[];
}

/** MCP manifest for mcp-get and similar registries */
export interface McpManifest {
  name: string;
  description: string;
  version: string;
  vendor: string;
  sourceUrl: string;
  homepage?: string;
  license: string;
  runtime: "node";
  installation: {
    command: string;
    args: string[];
  };
  categories?: string[];
  keywords?: string[];
}
