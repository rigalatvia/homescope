import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";

const root = process.cwd();
const page = readFileSync(join(root, "app/guides/rental-application-ontario/page.tsx"), "utf8");
const experience = readFileSync(join(root, "components/guides/rental-application-experience.tsx"), "utf8");

describe("Form 410 rental conversion page", () => {
  it("preserves the ranking URL identity and direct PDF contract", () => {
    assert.match(page, /Ontario Rental Application Form 410 PDF \| HomeScope GTA/);
    assert.match(page, /const path = "\/guides\/rental-application-ontario"/);
    assert.match(experience, /\/forms\/410-rental-application-ontario\.pdf/);
    assert.match(experience, /<a href=\{PDF_URL\} download/);
  });

  it("keeps all rental discovery flows in lease mode", () => {
    assert.match(page, /transactionType: "lease"/);
    assert.match(page, /transactionType=lease/);
    assert.match(experience, /transactionType: "lease" as const/);
  });

  it("uses existing saved-search and contact endpoints", () => {
    assert.match(experience, /useSavedSearches/);
    assert.match(experience, /saveSearch\(/);
    assert.match(experience, /fetch\("\/api\/contact"/);
  });
});
