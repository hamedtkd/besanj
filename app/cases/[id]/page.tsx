import type { Metadata } from "next";
import { CaseScreen } from "@/components/case-screen";

export const metadata: Metadata = {
  title: "پرونده",
};

export default async function CasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CaseScreen caseId={id} />;
}
