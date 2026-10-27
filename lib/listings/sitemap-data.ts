import { unstable_cache } from "next/cache";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { allowedMunicipalities } from "@/lib/mls/config";

// Sitemaps need every public URL, but not photos, descriptions or UI mapping.
export const getListingSitemapRows = unstable_cache(async () => {
  const rows: Array<{ listingUrlSlug: string; updatedAt: string }> = [];
  let query = getFirebaseAdminFirestore().collection("listings")
    .where("isVisible", "==", true).where("municipality", "in", allowedMunicipalities)
    .orderBy("price", "desc").select("slug", "updatedAt", "price").limit(500);
  while (true) {
    const page = await query.get();
    for (const doc of page.docs) {
      const data = doc.data();
      if (typeof data.slug === "string" && data.slug)
        rows.push({ listingUrlSlug: data.slug, updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : "" });
    }
    if (page.size < 500) break;
    query = query.startAfter(page.docs[page.docs.length - 1]);
  }
  return rows;
}, ["listing-sitemap-projection-v1"], { revalidate: 3600 });
