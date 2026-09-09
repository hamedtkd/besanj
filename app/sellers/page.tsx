import type { Metadata } from "next";
import { SellerDirectoryPage } from "@/components/seller-directory-page";

export const metadata: Metadata = {
  title: "فروشنده‌ها",
};

export default function SellersPage() {
  return <SellerDirectoryPage />;
}
