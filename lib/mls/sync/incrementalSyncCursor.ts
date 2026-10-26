import { readCursor, writeCursor } from "@/lib/mls/sync/execution";
const ID = "mlsIncrementalCursor";
export function getDefaultIncrementalStartPage() { return 1; }

export async function getIncrementalStartPage(): Promise<number> {
  const data = await readCursor(ID);
  return Number.isInteger(data.nextPage) && data.nextPage > 0 ? data.nextPage : 1;
}

export async function setIncrementalStartPage(value: number) {
  await writeCursor(ID, { nextPage: value });
}

export async function getIncrementalNextCursor(): Promise<string | null> {
  const data = await readCursor(ID);
  return typeof data.nextCursor === "string" && data.nextCursor ? data.nextCursor : null;
}

export async function setIncrementalNextCursor(value: string | null) {
  await writeCursor(ID, { nextCursor: value });
}

export async function getIncrementalSweepStartedAt(): Promise<string | null> {
  const data = await readCursor(ID);
  return typeof data.sweepStartedAt === "string" && data.sweepStartedAt ? data.sweepStartedAt : null;
}

export async function setIncrementalSweepStartedAt(value: string | null) {
  await writeCursor(ID, { sweepStartedAt: value });
}

export async function saveIncrementalCursor(data: { nextPage: number; nextCursor: string | null; sweepStartedAt: string | null; sinceIso?: string; sweepSinceIso?: string | null }) {
  await writeCursor(ID, data);
}

export async function getIncrementalSyncSince(defaultLookbackMs = 24 * 60 * 60 * 1000): Promise<Date> {
 const data = await readCursor(ID);
 const value = data.sweepSinceIso ?? data.sinceIso ?? data.initialSinceIso;
 if (typeof value === "string" && Number.isFinite(Date.parse(value))) return new Date(value);
 // Persist the initial boundary before fetching: a failed first run must not slide the window forward.
 const initial = new Date(Date.now() - defaultLookbackMs);
 await writeCursor(ID, { initialSinceIso: initial.toISOString() });
 return initial;
}

export async function setIncrementalSyncSince(sinceIso: string) {
 if (!Number.isFinite(Date.parse(sinceIso))) throw new Error("Invalid MLS checkpoint");
 await writeCursor(ID, { sinceIso });
}
