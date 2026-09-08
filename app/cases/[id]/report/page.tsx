import type { Metadata } from "next";
import { CaseReportPage } from "@/components/case-report-page";

export const metadata: Metadata = {
  title: "گزارش پرونده",
};

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CaseReportPage caseId={id} />;
}
