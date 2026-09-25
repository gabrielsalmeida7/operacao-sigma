import { open, save } from "@tauri-apps/plugin-dialog";
import { copyFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";
import { resetDbConnection } from "@/lib/db/client";

async function dbTargetPath(): Promise<string> {
  const dataDir = await appDataDir();
  return join(dataDir, "sigma.db");
}

export async function exportDatabaseBackup(): Promise<string | null> {
  const path = await save({
    filters: [{ name: "SQLite", extensions: ["db"] }],
    defaultPath: `sigma-backup-${new Date().toISOString().slice(0, 10)}.db`,
  });

  if (!path) return null;

  try {
    const sourcePath = await dbTargetPath();
    await copyFile(sourcePath, path);
  } catch {
    await copyFile("sigma.db", path, {
      fromPathBaseDir: BaseDirectory.AppData,
    });
  }

  return path;
}

export async function importDatabaseBackup(): Promise<string | null> {
  const selected = await open({
    title: "Importar backup do Sigma",
    filters: [{ name: "SQLite", extensions: ["db"] }],
    multiple: false,
  });

  if (!selected || Array.isArray(selected)) return null;

  const targetPath = await dbTargetPath();
  const backupPath = await join(await appDataDir(), "sigma.db.bak");

  await resetDbConnection();

  try {
    try {
      await copyFile(targetPath, backupPath);
    } catch {
      // banco local ainda não existe
    }
    await copyFile(selected, targetPath);
  } catch (error) {
    try {
      await copyFile(backupPath, targetPath);
    } catch {
      // restauração do .bak falhou — nada a fazer
    }
    throw error;
  }

  return selected;
}
