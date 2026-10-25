// Verified against this DDF connection's Office resource on 2026-10-23.
// These are listing-office keys, never buyer/co-listing office identities.
const METROPOLIS_OFFICES: Record<string, string> = {
  "282777": "1321336",
  "298485": "1470118"
};
export function verifiedDdfOffice(key: unknown, sourceSystem: string): string | null {
  return sourceSystem === "toronto-board-ddf" && typeof key === "string" &&
    Object.hasOwn(METROPOLIS_OFFICES, key) ? "RE/MAX METROPOLIS REALTY" : null;
}
