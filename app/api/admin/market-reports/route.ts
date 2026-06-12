import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { PRIMARY_MARKET_PAGES, getMarketBySlug } from "@/lib/locations/markets";
import { CURRENT_MARKET_REPORT, isCurrentReportSlug } from "@/lib/market/reports";
import {
  getMarketReportContent,
  saveMarketReportContent,
  type MarketReportContentInput
} from "@/lib/market/report-content";

interface MarketReportUpdateBody extends MarketReportContentInput {
  citySlug?: unknown;
  reportSlug?: unknown;
}

export async function GET() {
  const authError = await authorizeAdminRequest();
  if (authError) return authError;

  try {
    const reports = await Promise.all(
      PRIMARY_MARKET_PAGES.map(async (market) => ({
        city: market.city,
        citySlug: market.slug,
        reportSlug: CURRENT_MARKET_REPORT.slug,
        reportLabel: CURRENT_MARKET_REPORT.label,
        content: await getMarketReportContent({
          city: market.city,
          citySlug: market.slug,
          reportSlug: CURRENT_MARKET_REPORT.slug,
          reportLabel: CURRENT_MARKET_REPORT.label
        })
      }))
    );

    return NextResponse.json({
      success: true,
      reportSlug: CURRENT_MARKET_REPORT.slug,
      reportLabel: CURRENT_MARKET_REPORT.label,
      reports
    });
  } catch (error) {
    console.error("[admin][market-reports] Failed loading reports", error);
    return NextResponse.json({ error: "Could not load market reports." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authError = await authorizeAdminRequest();
  if (authError) return authError;

  let body: MarketReportUpdateBody;
  try {
    body = (await request.json()) as MarketReportUpdateBody;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const citySlug = typeof body.citySlug === "string" ? body.citySlug : "";
  const reportSlug = typeof body.reportSlug === "string" ? body.reportSlug : "";
  const market = getMarketBySlug(citySlug);

  if (!market || !isCurrentReportSlug(reportSlug)) {
    return NextResponse.json({ error: "Invalid market report." }, { status: 400 });
  }

  try {
    const content = await saveMarketReportContent({
      city: market.city,
      citySlug: market.slug,
      reportSlug: CURRENT_MARKET_REPORT.slug,
      reportLabel: CURRENT_MARKET_REPORT.label,
      body
    });

    revalidatePath(`/market-reports/${market.slug}/${CURRENT_MARKET_REPORT.slug}`);
    revalidatePath(`/locations/${market.slug}`);
    revalidatePath("/sitemap.xml");

    return NextResponse.json({
      success: true,
      content
    });
  } catch (error) {
    console.error("[admin][market-reports] Failed saving report", error);
    return NextResponse.json({ error: "Could not save market report." }, { status: 500 });
  }
}
