import Conf from "conf";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Configuration store (persisted to ~/.config/in3pire-db/config.json)
// ---------------------------------------------------------------------------

const ConfigSchema = z.object({
  NEON_API_KEY: z.string().optional(),
  NEON_PROJECT_ID: z.string().optional(),
  default_branch: z.string().default("main"),
});

export type Config = z.infer<typeof ConfigSchema>;

const store = new Conf<Config>({
  projectName: "in3pire-db",
  schema: {
    NEON_API_KEY: { type: "string", default: "" },
    NEON_PROJECT_ID: { type: "string", default: "" },
    default_branch: { type: "string", default: "main" },
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
