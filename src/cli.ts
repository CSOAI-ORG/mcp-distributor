#!/usr/bin/env node
/**
 * MCP Distributor CLI
 * Publish MCP servers to 7+ registries simultaneously.
 *
 * Usage:
 *   mcp-distribute [package-dir]           Distribute a single package
 *   mcp-distribute --all [base-dir]        Distribute all packages in directory
 *   mcp-distribute --list [base-dir]       List discovered packages
 *   mcp-distribute --dry-run [package-dir] Preview without publishing
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { resolve, join } from "node:path";
import { mkdirSync, existsSync } from "node:fs";
import {
  parsePackageMeta,
  discoverPackages,
  distributePackage,
  distributeAll,
  writeReport,
  ALL_REGISTRY_NAMES,
} from "./index.js";
import type { DistributorConfig, RegistryName, DistributionResult } from "./types.js";

const program = new Command();

program
  .name("mcp-distribute")
  .description(
    "Publish MCP servers to 7+ registries: npm, Smithery, Glama, MCP.so, PulseMCP, mcp-get, OpenTools"
  )
  .version("1.0.0")
  .argument("[directory]", "Package directory (or base directory with --all)")
  .option("--all", "Distribute all packages in directory")
  .option("--list", "List discovered packages without distributing")
  .option("--dry-run", "Preview actions without publishing")
  .option(
    "--registries <names>",
    "Comma-separated registries to target",
    "npm,smithery,glama,mcp-so,pulsemcp,mcp-get,opentools"
  )
  .option("--output <dir>", "Output directory for generated artifacts", "./dist-output")
  .option("--npm-token <token>", "npm auth token (or set NPM_TOKEN env)")
  .option("--report <path>", "Write JSON report to file")
  .action(async (directory: string | undefined, options: Record<string, unknown>) => {
    const dir = resolve(directory || ".");
    const registries = (options.registries as string)
      .split(",")
      .map((r) => r.trim()) as RegistryName[];
    const outputDir = resolve(options.output as string);
    const dryRun = !!options.dryRun;
    const npmToken = (options.npmToken as string) || process.env.NPM_TOKEN || "";

    // Header
    console.log();
    console.log(chalk.bold.blue("  MCP Distributor"));
    console.log(chalk.gray("  Publish MCP servers to multiple registries\n"));

    // List mode
    if (options.list) {
      const packages = discoverPackages(dir);
      console.log(chalk.bold(`  Found ${packages.length} packages:\n`));
      for (const pkg of packages) {
        console.log(`  ${chalk.cyan(pkg.name)} ${chalk.gray(`v${pkg.version}`)}`);
        console.log(`    ${pkg.description}`);
      }
      console.log();
      return;
    }

    // Ensure output directory
    mkdirSync(outputDir, { recursive: true });

    const config: DistributorConfig = {
      npmToken,
      outputDir,
      dryRun,
      registries,
    };

    if (dryRun) {
      console.log(chalk.yellow("  ⚡ Dry run mode — no actual publishes\n"));
    }

    console.log(
      chalk.gray(
        `  Registries: ${registries.map((r) => chalk.white(r)).join(", ")}\n`
      )
    );

    let results: DistributionResult[];

    if (options.all) {
      // Batch mode
      const packages = discoverPackages(dir);
      console.log(chalk.bold(`  Distributing ${packages.length} packages...\n`));

      results = await distributeAll(dir, config, (pkg, index, total) => {
        const progress = `[${index + 1}/${total}]`;
        console.log(`  ${chalk.gray(progress)} ${chalk.cyan(pkg)}`);
      });
    } else {
      // Single package
      const meta = parsePackageMeta(dir);
      if (!meta) {
        console.error(
          chalk.red("  Error: No valid package.json found at ") + dir
        );
        process.exit(1);
      }

      const spinner = ora(`Distributing ${meta.name}`).start();
      const result = await distributePackage(meta, config);
      spinner.stop();
      results = [result];
    }

    // Print results
    console.log();
    console.log(chalk.bold("  Results:\n"));

    for (const pkg of results) {
      console.log(`  ${chalk.bold.cyan(pkg.package)}`);
      for (const r of pkg.results) {
        const icon =
          r.status === "success"
            ? chalk.green("✓")
            : r.status === "manual"
              ? chalk.yellow("→")
              : r.status === "skipped"
                ? chalk.gray("○")
                : chalk.red("✗");
        console.log(`    ${icon} ${chalk.white(r.registry)}: ${r.message}`);
        if (r.artifact) {
          console.log(`      ${chalk.gray(r.artifact)}`);
        }
      }
      console.log();
    }

    // Summary
    const allResults = results.flatMap((r) => r.results);
    const counts = {
      success: allResults.filter((r) => r.status === "success").length,
      manual: allResults.filter((r) => r.status === "manual").length,
      skipped: allResults.filter((r) => r.status === "skipped").length,
      failed: allResults.filter((r) => r.status === "failed").length,
    };

    console.log(chalk.bold("  Summary:"));
    console.log(`    ${chalk.green("✓ Success:")} ${counts.success}`);
    console.log(`    ${chalk.yellow("→ Manual:")}  ${counts.manual}`);
    console.log(`    ${chalk.gray("○ Skipped:")} ${counts.skipped}`);
    console.log(`    ${chalk.red("✗ Failed:")}  ${counts.failed}`);
    console.log();

    // Write report
    const reportPath = (options.report as string) || join(outputDir, "distribution-report.json");
    writeReport(results, reportPath);
    console.log(chalk.gray(`  Report: ${reportPath}\n`));
  });

program.parse();
