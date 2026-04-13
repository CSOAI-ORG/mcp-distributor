/**
 * Manual Registry Adapters
 * Generates submission content for registries that require manual
 * submission via web forms or GitHub PRs: Glama, MCP.so, PulseMCP, OpenTools.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type {
  RegistryAdapter,
  McpServerMeta,
  DistributorConfig,
  RegistryResult,
} from "../types.js";

function generateSubmissionMarkdown(
  meta: McpServerMeta,
  registryName: string,
  submissionUrl: string,
  extraNotes: string
): string {
  const author =
    typeof meta.raw.author === "string" ? meta.raw.author : "CSGA Global";

  return `# ${registryName} Submission — ${meta.name}

## Package Details
- **Name**: ${meta.name}
- **Version**: ${meta.version}
- **Description**: ${meta.description}
- **Author**: ${author}
- **License**: ${meta.license}
- **Repository**: ${meta.repoUrl}
- **npm**: https://www.npmjs.com/package/${meta.name}
- **Keywords**: ${meta.keywords.join(", ")}

## Installation
\`\`\`bash
npx -y ${meta.name}
\`\`\`

## Claude Desktop Configuration
\`\`\`json
{
  "mcpServers": {
    "${meta.shortName}": {
      "command": "npx",
      "args": ["-y", "${meta.name}"]
    }
  }
}
\`\`\`

## Submission URL
${submissionUrl}

${extraNotes}
`;
}

function createManualAdapter(
  registryId: "glama" | "mcp-so" | "pulsemcp" | "opentools",
  displayName: string,
  submissionUrl: string,
  extraNotes: string
): RegistryAdapter {
  return {
    name: registryId,
    displayName,
    hasApi: false,

    async distribute(
      meta: McpServerMeta,
      config: DistributorConfig
    ): Promise<RegistryResult> {
      const markdown = generateSubmissionMarkdown(
        meta,
        displayName,
        submissionUrl,
        extraNotes
      );
      const filename = `${registryId}-submission.md`;
      const outputPath = join(config.outputDir, meta.shortName, filename);

      if (config.dryRun) {
        return {
          registry: registryId,
          status: "skipped",
          message: `[dry-run] Would generate ${filename} for ${meta.name}`,
        };
      }

      try {
        mkdirSync(join(config.outputDir, meta.shortName), { recursive: true });
        writeFileSync(outputPath, markdown, "utf-8");

        return {
          registry: registryId,
          status: "manual",
          message: `Generated ${filename} — submit manually at ${submissionUrl}`,
          artifact: outputPath,
        };
      } catch (err) {
        return {
          registry: registryId,
          status: "failed",
          message: `Failed to write ${filename}: ${err}`,
        };
      }
    },
  };
}

export const glamaAdapter = createManualAdapter(
  "glama",
  "Glama.ai",
  "https://glama.ai/mcp/servers/submit",
  `## Notes
- Glama indexes MCP servers from GitHub repositories
- Ensure your repo has a clear README with installation instructions
- Glama may auto-discover servers published to npm with MCP keywords`
);

export const mcpSoAdapter = createManualAdapter(
  "mcp-so",
  "MCP.so",
  "https://mcp.so/submit",
  `## Notes
- MCP.so is a community directory of MCP servers
- Submit via the web form with your npm package URL
- Include a clear description and category for better discoverability`
);

export const pulseMcpAdapter = createManualAdapter(
  "pulsemcp",
  "PulseMCP",
  "https://www.pulsemcp.com/submit",
  `## Notes
- PulseMCP tracks the MCP ecosystem and trending servers
- Submit your server for inclusion in their directory
- Active maintenance and regular updates improve ranking`
);

export const openToolsAdapter = createManualAdapter(
  "opentools",
  "OpenTools",
  "https://opentools.ai/submit",
  `## Notes
- OpenTools is a directory of AI tools and MCP servers
- Submit via their web form or GitHub PR
- Include use cases and example prompts for better visibility`
);
