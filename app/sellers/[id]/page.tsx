import type { Metadata } from "next";
import { SellerProfilePage } from "@/components/seller-profile-page";

export const metadata: Metadata = {
  title: "پروفایل فروشنده",
};

export default async function SellerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SellerProfilePage sellerId={id} />;
}
