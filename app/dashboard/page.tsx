import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Save homes and keep track of your HomeScope GTA showing requests.",
  robots: {
    index: false,
    follow: false
  }
};

export default function DashboardPage() {
  return <DashboardShell />;
}
