import { spawn } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";

const cargoBin = join(homedir(), ".cargo", "bin");
const pathKey = process.platform === "win32" ? "Path" : "PATH";
const env = { ...process.env };
const separator = process.platform === "win32" ? ";" : ":";
env[pathKey] = `${cargoBin}${separator}${env[pathKey] ?? ""}`;

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Uso: node scripts/tauri-with-rust.mjs <dev|build|...>");
  process.exit(1);
}

const tauriBin = join(process.cwd(), "node_modules", "@tauri-apps", "cli", "tauri.js");
const child = spawn(process.execPath, [tauriBin, ...args], {
  stdio: "inherit",
  env,
});

child.on("exit", (code) => process.exit(code ?? 0));
