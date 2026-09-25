import { getDb } from "@/lib/db/client";
import { defaultFutureTargetDate } from "@/lib/dates";
import type { AppSettings } from "@/lib/db/types";

export async function getSettings(): Promise<AppSettings> {
  const db = await getDb();
  const rows = await db.select<AppSettings[]>("SELECT * FROM AppSettings WHERE id = 1");
  if (!rows[0]) {
    await db.execute(
      "INSERT INTO AppSettings (id, futureTargetDate) VALUES (1, ?)",
      [defaultFutureTargetDate()],
    );
    return {
      id: 1,
      theme: "dark",
      checkInEnabled: true,
      futureTargetDate: defaultFutureTargetDate(),
      selectedEditalId: null,
    };
  }
  return {
    ...rows[0],
    checkInEnabled: Boolean(rows[0].checkInEnabled),
    selectedEditalId: rows[0].selectedEditalId ?? null,
  };
}

export async function updateSettings(data: Partial<AppSettings>): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.theme !== undefined) { fields.push("theme = ?"); values.push(data.theme); }
  if (data.checkInEnabled !== undefined) { fields.push("checkInEnabled = ?"); values.push(data.checkInEnabled ? 1 : 0); }
  if (data.futureTargetDate !== undefined) { fields.push("futureTargetDate = ?"); values.push(data.futureTargetDate); }
  if (data.selectedEditalId !== undefined) { fields.push("selectedEditalId = ?"); values.push(data.selectedEditalId); }

  if (fields.length > 0) {
    await db.execute(`UPDATE AppSettings SET ${fields.join(", ")} WHERE id = 1`, values);
  }
}
