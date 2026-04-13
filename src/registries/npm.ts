/**
 * npm Registry Adapter
 * Publishes MCP packages to the npm registry.
 */

import { execSync } from "node:child_process";
import type {
  RegistryAdapter,
  McpServerMeta,
  DistributorConfig,
  RegistryResult,
} from "../types.js";

export const npmAdapter: RegistryAdapter = {
  name: "npm",
  displayName: "npm Registry",
  hasApi: true,

  async distribute(
    meta: McpServerMeta,
    config: DistributorConfig
  ): Promise<RegistryResult> {
    if (!config.npmToken) {
      return {
        registry: "npm",
        status: "skipped",
        message: "No npm token configured. Set NPM_TOKEN env var.",
      };
    }

    if (config.dryRun) {
      return {
        registry: "npm",
        status: "skipped",
        message: `[dry-run] Would publish ${meta.name}@${meta.version} to npm`,
      };
    }

    try {
      // Check if version already exists
      try {
        const existing = execSync(
          `npm view ${meta.name}@${meta.version} version 2>/dev/null`,
          { encoding: "utf-8", timeout: 15000 }
        ).trim();
        if (existing === meta.version) {
          return {
            registry: "npm",
            status: "skipped",
            message: `${meta.name}@${meta.version} already published`,
          };
        }
      } catch {
        // Package/version doesn't exist yet — good, proceed
      }

      execSync("npm publish --access public", {
        cwd: meta.packageDir,
        timeout: 60000,
        stdio: "pipe",
        env: {
          ...process.env,
          npm_config_registry: "https://registry.npmjs.org/",
        },
      });

      return {
        registry: "npm",
        status: "success",
        message: `Published ${meta.name}@${meta.version}`,
        artifact: `https://www.npmjs.com/package/${meta.name}`,
      };
    } catch (err: unknown) {
      const stderr =
        err instanceof Error && "stderr" in err
          ? String((err as { stderr: unknown }).stderr)
          : String(err);

      if (
        stderr.includes("already been published") ||
        stderr.includes("cannot publish over")
      ) {
        return {
          registry: "npm",
          status: "skipped",
          message: `${meta.name}@${meta.version} already published`,
        };
      }

      if (stderr.includes("429") || stderr.includes("Too Many")) {
        return {
          registry: "npm",
          status: "failed",
          message: `Rate limited. Retry later.`,
        };
      }

      return {
        registry: "npm",
        status: "failed",
        message: stderr.slice(0, 300),
      };
    }
  },
};
