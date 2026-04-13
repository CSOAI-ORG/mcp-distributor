/**
 * mcp-get Registry Adapter
 * Generates mcp.json manifest for the mcp-get package manager.
 * mcp-get discovers servers via a JSON manifest in the repo.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type {
  RegistryAdapter,
  McpServerMeta,
  DistributorConfig,
  RegistryResult,
  McpManifest,
} from "../types.js";

function buildMcpManifest(meta: McpServerMeta): McpManifest {
  return {
    name: meta.name,
    description: meta.description,
    version: meta.version,
    vendor: typeof meta.raw.author === "string" ? meta.raw.author : "CSGA Global",
    sourceUrl: meta.repoUrl,
    license: meta.license,
    runtime: "node",
    installation: {
      command: "npx",
      args: ["-y", meta.name],
    },
    keywords: meta.keywords,
  };
}

export const mcpGetAdapter: RegistryAdapter = {
  name: "mcp-get",
  displayName: "mcp-get",
  hasApi: false,

  async distribute(
    meta: McpServerMeta,
    config: DistributorConfig
  ): Promise<RegistryResult> {
    const manifest = buildMcpManifest(meta);
    const jsonContent = JSON.stringify(manifest, null, 2);
    const outputPath = join(config.outputDir, meta.shortName, "mcp.json");

    if (config.dryRun) {
      return {
        registry: "mcp-get",
        status: "skipped",
        message: `[dry-run] Would generate mcp.json for ${meta.name}`,
      };
    }

    try {
      mkdirSync(join(config.outputDir, meta.shortName), { recursive: true });
      writeFileSync(outputPath, jsonContent + "\n", "utf-8");

      return {
        registry: "mcp-get",
        status: "success",
        message: `Generated mcp.json — submit PR to mcp-get/packages repo`,
        artifact: outputPath,
      };
    } catch (err) {
      return {
        registry: "mcp-get",
        status: "failed",
        message: `Failed to write mcp.json: ${err}`,
      };
    }
  },
};
