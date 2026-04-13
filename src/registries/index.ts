/**
 * Registry Adapter Index
 * Exports all registry adapters and provides lookup by name.
 */

import type { RegistryAdapter, RegistryName } from "../types.js";
import { npmAdapter } from "./npm.js";
import { smitheryAdapter } from "./smithery.js";
import { mcpGetAdapter } from "./mcp-get.js";
import {
  glamaAdapter,
  mcpSoAdapter,
  pulseMcpAdapter,
  openToolsAdapter,
} from "./manual.js";

export const allAdapters: RegistryAdapter[] = [
  npmAdapter,
  smitheryAdapter,
  glamaAdapter,
  mcpSoAdapter,
  pulseMcpAdapter,
  mcpGetAdapter,
  openToolsAdapter,
];

const adapterMap = new Map<RegistryName, RegistryAdapter>(
  allAdapters.map((a) => [a.name, a])
);

export function getAdapter(name: RegistryName): RegistryAdapter | undefined {
  return adapterMap.get(name);
}

export function getAdapters(names: RegistryName[]): RegistryAdapter[] {
  return names
    .map((n) => adapterMap.get(n))
    .filter((a): a is RegistryAdapter => a !== undefined);
}

export const ALL_REGISTRY_NAMES: RegistryName[] = allAdapters.map((a) => a.name);
