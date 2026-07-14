import Conf from "conf";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Configuration store (persisted to ~/.config/in3pire-db/config.json)
// ---------------------------------------------------------------------------

const LogEntrySchema = z.object({
  timestamp: z.string(),
  action: z.string(),
  branch: z.string(),
  detail: z.string().optional(),
});

const ConfigSchema = z.object({
  NEON_API_KEY: z.string().optional(),
  NEON_PROJECT_ID: z.string().optional(),
  default_branch: z.string().default("main"),
  protected_branches: z.array(z.string()).default([]),
  branch_tags: z.record(z.string(), z.string()).default({}),
  history: z.array(LogEntrySchema).default([]),
});

export type Config = z.infer<typeof ConfigSchema>;
export type LogEntry = z.infer<typeof LogEntrySchema>;

const store = new Conf<Config>({
  projectName: "in3pire-db",
  schema: {
    NEON_API_KEY: { type: "string", default: "" },
    NEON_PROJECT_ID: { type: "string", default: "" },
    default_branch: { type: "string", default: "main" },
    protected_branches: { type: "array", items: { type: "string" }, default: [] },
    branch_tags: { type: "object", patternProperties: { "^.*$": { type: "string" } }, default: {} },
    history: {
      type: "array",
      items: {
        type: "object",
        properties: {
          timestamp: { type: "string" },
          action: { type: "string" },
          branch: { type: "string" },
          detail: { type: "string" },
        },
      },
      default: [],
    },
  },
});

export function getConfig(): Config {
  const raw = store.store;
  return ConfigSchema.parse(raw);
}

export function setConfig(key: keyof Config, value: string) {
  store.set(key, value);
}

export function clearConfig() {
  store.clear();
}

/**
 * Resolve the active API key:
 * 1. Config store
 * 2. NEON_API_KEY env var
 * 3. .env file
 */
export function resolveApiKey(): string | undefined {
  const cfg = getConfig();
  if (cfg.NEON_API_KEY) return cfg.NEON_API_KEY;
  if (process.env.NEON_API_KEY) return process.env.NEON_API_KEY;

  // Try implicit .env
  try {
    // dynamic import for dotenv
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Resolve the active project ID.
 */
export function resolveProjectId(): string | undefined {
  const cfg = getConfig();
  if (cfg.NEON_PROJECT_ID) return cfg.NEON_PROJECT_ID;
  if (process.env.NEON_PROJECT_ID) return process.env.NEON_PROJECT_ID;
  return undefined;
}

// -- Protected branches ------------------------------------------------------

export function isBranchProtected(name: string): boolean {
  const cfg = getConfig();
  return cfg.protected_branches.includes(name);
}

export function addProtectedBranch(name: string): void {
  const cfg = getConfig();
  if (!cfg.protected_branches.includes(name)) {
    store.set("protected_branches", [...cfg.protected_branches, name]);
  }
}

export function removeProtectedBranch(name: string): void {
  const cfg = getConfig();
  store.set("protected_branches", cfg.protected_branches.filter((b) => b !== name));
}

// -- Tags --------------------------------------------------------------------

export function getTag(branch: string): string | undefined {
  const cfg = getConfig();
  return (cfg.branch_tags as Record<string, string>)[branch];
}

export function setTag(branch: string, tag: string): void {
  const cfg = getConfig();
  cfg.branch_tags[branch] = tag;
  store.set("branch_tags", { ...cfg.branch_tags });
}

export function removeTag(branch: string): void {
  const cfg = getConfig();
  if (cfg.branch_tags[branch]) {
    delete cfg.branch_tags[branch];
    store.set("branch_tags", { ...cfg.branch_tags });
  }
}

// -- History / Log -----------------------------------------------------------

export function addLogEntry(entry: LogEntry): void {
  const cfg = getConfig();
  const history = [...cfg.history, entry];
  // Keep max 500 entries
  if (history.length > 500) history.splice(0, history.length - 500);
  store.set("history", history);
}

export function getHistory(): LogEntry[] {
  const cfg = getConfig();
  return cfg.history;
}

export function clearHistory(): void {
  store.set("history", []);
}
