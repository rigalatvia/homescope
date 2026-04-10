export function generateListingSlug(input: {
  streetNumber?: string | null;
  streetName?: string | null;
  municipality?: string | null;
  mlsNumber?: string | null;
}): string {
  const base = [input.streetNumber, input.streetName, input.municipality, input.mlsNumber]
    .filter(Boolean)
    .join(" ");

  return slugify(base || "listing");
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
