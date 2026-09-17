"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const DashboardPreviewCarousel = dynamic(
  () => import("@/components/home/dashboard-preview-carousel").then((module) => module.DashboardPreviewCarousel),
  { ssr: false }
);

const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";

export function DesktopDashboardPreview() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const updateViewport = () => setIsDesktop(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);

    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  if (!isDesktop) {
    return <div className="hidden min-h-[450px] lg:block" aria-hidden="true" />;
  }

  return <DashboardPreviewCarousel />;
}
