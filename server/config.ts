import { resolve } from "node:path";

const DEFAULT_PORT = 3000;

function requiredPositiveInteger(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid positive integer value: ${value}`);
  }

  return parsed;
}

export interface ServerConfig {
  dataDirectory: string;
  port: number;
  staticDirectory: string;
}

export function loadServerConfig(): ServerConfig {
  return {
    dataDirectory: resolve(process.env.SIGMA_DATA_DIR ?? "./data"),
    port: requiredPositiveInteger(process.env.PORT, DEFAULT_PORT),
    staticDirectory: resolve(process.env.SIGMA_STATIC_DIR ?? "./dist"),
  };
}
