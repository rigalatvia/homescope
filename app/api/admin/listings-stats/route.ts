import { NextResponse } from "next/server";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { getServerConfigValue } from "@/lib/server/secret-manager";

const LISTINGS_COLLECTION = "listings";

export async function GET(request: Request) {
  const adminToken = await getServerConfigValue("MLS_SYNC_ADMIN_TOKEN");
  const requestToken = request.headers.get("x-admin-sync-token");

  if (!adminToken) {
    return NextResponse.json({ error: "MLS sync admin token is not configured." }, { status: 503 });
  }

  if (requestToken !== adminToken) {
    return NextResponse.json({ error: "Unauthorized admin request." }, { status: 401 });
  }

  try {
    const firestore = getFirebaseAdminFirestore();
    const [totalAgg, visibleAgg] = await Promise.all([
      firestore.collection(LISTINGS_COLLECTION).count().get(),
      firestore.collection(LISTINGS_COLLECTION).where("isVisible", "==", true).count().get()
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalRows: totalAgg.data().count,
        visibleRows: visibleAgg.data().count,
        hiddenRows: Math.max(0, totalAgg.data().count - visibleAgg.data().count),
        checkedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("[admin][listings-stats] Failed loading listing stats", error);
    return NextResponse.json({ error: "Could not load listings stats." }, { status: 500 });
  }
}
