/**
 * Smithery Registry Adapter
 * Generates smithery.yaml configuration for Smithery.ai registry.
 * Smithery uses a YAML config file in the repo root for discovery.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import type {
  RegistryAdapter,
  McpServerMeta,
  DistributorConfig,
  RegistryResult,
  SmitheryConfig,
} from "../types.js";

function buildSmitheryConfig(meta: McpServerMeta): SmitheryConfig {
  const binName = meta.binName || meta.shortName + "-mcp";
  return {
    name: meta.shortName,
    description: meta.description,
    version: meta.version,
    repository: meta.repoUrl,
    license: meta.license,
    runtime: "node",
    command: {
      npx: meta.name,
    },
    categories: inferCategories(meta.keywords),
  };
}

function inferCategories(keywords: string[]): string[] {
  const categoryMap: Record<string, string> = {
    security: "Security",
    cybersecurity: "Security",
    "threat-intelligence": "Security",
    vulnerability: "Security",
    compliance: "Compliance",
    audit: "Compliance",
    governance: "Governance",
    ai: "AI & Machine Learning",
    "machine-learning": "AI & Machine Learning",
    database: "Data & Storage",
    postgres: "Data & Storage",
    sqlite: "Data & Storage",
    csv: "Data & Storage",
    json: "Data & Storage",
    git: "Developer Tools",
    github: "Developer Tools",
    gitlab: "Developer Tools",
    docker: "Developer Tools",
    vercel: "Developer Tools",
    filesystem: "Developer Tools",
    browser: "Web & Browser",
    playwright: "Web & Browser",
    puppeteer: "Web & Browser",
    fetch: "Web & Browser",
    slack: "Communication",
    notion: "Productivity",
    linear: "Productivity",
    "google-drive": "Productivity",
    cloud: "Cloud & Infrastructure",
    aws: "Cloud & Infrastructure",
    defence: "Defence & Military",
    military: "Defence & Military",
    space: "Aerospace & Space",
    "real-estate": "Real Estate",
    retail: "Retail & Commerce",
    telecom: "Telecommunications",
    travel: "Travel & Hospitality",
    sports: "Sports & Analytics",
    "smart-cities": "Smart Cities & IoT",
    "supply-chain": "Supply Chain & Logistics",
  };

  const categories = new Set<string>();
  for (const kw of keywords) {
    const lower = kw.toLowerCase();
    if (categoryMap[lower]) {
      categories.add(categoryMap[lower]);
    }
  }
  return categories.size > 0 ? [...categories] : ["Tools & Utilities"];
}

export const smitheryAdapter: RegistryAdapter = {
  name: "smithery",
  displayName: "Smithery.ai",
  hasApi: false,

  async distribute(
    meta: McpServerMeta,
    config: DistributorConfig
  ): Promise<RegistryResult> {
    const smitheryConfig = buildSmitheryConfig(meta);
    const yamlContent = yaml.dump(smitheryConfig, {
      lineWidth: 120,
      noRefs: true,
    });

    const outputPath = join(
      config.outputDir,
      meta.shortName,
      "smithery.yaml"
    );

    if (config.dryRun) {
      return {
        registry: "smithery",
        status: "skipped",
        message: `[dry-run] Would generate smithery.yaml for ${meta.name}`,
      };
    }

    try {
      const { mkdirSync } = await import("node:fs");
      mkdirSync(join(config.outputDir, meta.shortName), { recursive: true });
      writeFileSync(outputPath, yamlContent, "utf-8");

      return {
        registry: "smithery",
        status: "success",
        message: `Generated smithery.yaml — add to repo root and submit at smithery.ai`,
        artifact: outputPath,
      };
    } catch (err) {
      return {
        registry: "smithery",
        status: "failed",
        message: `Failed to write smithery.yaml: ${err}`,
      };
    }
  },
};
