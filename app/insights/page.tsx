import type { Metadata } from "next";
import { InsightsPage } from "@/components/insights-page";

export const metadata: Metadata = {
  title: "بینش‌های خرید",
};

export default function InsightsRoute() {
  return <InsightsPage />;
}
