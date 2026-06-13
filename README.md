# @meok-ai-labs/mcp-distributor

Publish MCP servers to 7+ registries simultaneously: **npm**, **Smithery**, **Glama**, **MCP.so**, **PulseMCP**, **mcp-get**, **OpenTools**.

## Install

```bash
npm install -g @meok-ai-labs/mcp-distributor
```

## Usage

```bash
# Distribute a single package
mcp-distribute ./packages/my-mcp-server

# Distribute all packages in a monorepo
mcp-distribute --all ./packages

# List discovered packages
mcp-distribute --list ./packages

# Dry run (preview without publishing)
mcp-distribute --dry-run ./packages/my-mcp-server

# Target specific registries
mcp-distribute --registries npm,smithery ./packages/my-mcp-server
```

## Registries

| Registry | Method | Output |
|----------|--------|--------|
| **npm** | Automated publish | Published to npmjs.com |
| **Smithery** | Config generation | `smithery.yaml` for repo |
| **Glama** | Submission template | Markdown for manual submit |
| **MCP.so** | Submission template | Markdown for manual submit |
| **PulseMCP** | Submission template | Markdown for manual submit |
| **mcp-get** | Manifest generation | `mcp.json` for PR submission |
| **OpenTools** | Submission template | Markdown for manual submit |

## Options

| Flag | Description |
|------|-------------|
| `--all` | Process all packages in directory |
| `--list` | List packages without distributing |
| `--dry-run` | Preview without publishing |
| `--registries <names>` | Comma-separated registry list |
| `--output <dir>` | Artifact output directory (default: `./dist-output`) |
| `--npm-token <token>` | npm auth token (or `NPM_TOKEN` env) |
| `--report <path>` | JSON report output path |

## Environment Variables

- `NPM_TOKEN` — npm authentication token for automated publishing

## License

MIT
