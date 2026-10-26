import { readCursor, writeCursor } from "@/lib/mls/sync/execution";
const ID = "mlsCleanupCursor";
export function getDefaultCleanupStartPage() { return 1; }

export async function getCleanupStartPage(): Promise<number> {
  const data = await readCursor(ID);
  return Number.isInteger(data.nextPage) && data.nextPage > 0 ? data.nextPage : 1;
}

export async function setCleanupStartPage(value: number) {
  await writeCursor(ID, { nextPage: value });
}

export async function getCleanupNextCursor(): Promise<string | null> {
  const data = await readCursor(ID);
  return typeof data.nextCursor === "string" && data.nextCursor ? data.nextCursor : null;
}

export async function setCleanupNextCursor(value: string | null) {
  await writeCursor(ID, { nextCursor: value });
}

export async function getCleanupSweepStartedAt(): Promise<string | null> {
  const data = await readCursor(ID);
  return typeof data.sweepStartedAt === "string" && data.sweepStartedAt ? data.sweepStartedAt : null;
}

export async function setCleanupSweepStartedAt(value: string | null) {
  await writeCursor(ID, { sweepStartedAt: value });
}

export async function saveCleanupCursor(data: { nextPage: number; nextCursor: string | null; sweepStartedAt: string | null }) {
  await writeCursor(ID, data);
}
