import { readCursor, writeCursor } from "@/lib/mls/sync/execution";
const ID = "mlsFullSyncCursor";
export function getDefaultFullSyncStartPage() { return 1; }

export async function getFullSyncStartPage(): Promise<number> {
  const data = await readCursor(ID);
  return Number.isInteger(data.nextPage) && data.nextPage > 0 ? data.nextPage : 1;
}

export async function setFullSyncStartPage(value: number) {
  await writeCursor(ID, { nextPage: value });
}

export async function getFullSyncNextCursor(): Promise<string | null> {
  const data = await readCursor(ID);
  return typeof data.nextCursor === "string" && data.nextCursor ? data.nextCursor : null;
}

export async function setFullSyncNextCursor(value: string | null) {
  await writeCursor(ID, { nextCursor: value });
}

export async function getFullSyncSweepStartedAt(): Promise<string | null> {
  const data = await readCursor(ID);
  return typeof data.sweepStartedAt === "string" && data.sweepStartedAt ? data.sweepStartedAt : null;
}

export async function setFullSyncSweepStartedAt(value: string | null) {
  await writeCursor(ID, { sweepStartedAt: value });
}

export async function saveFullSyncCursor(data: { nextPage: number; nextCursor: string | null; sweepStartedAt: string | null }) {
  await writeCursor(ID, data);
}
