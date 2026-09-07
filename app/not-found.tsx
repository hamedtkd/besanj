import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

export default function NotFound() {
  return (
    <EmptyState
      title="این صفحه پیدا نشد"
      description="آدرس را بررسی کن یا به صفحه پرونده‌ها برگرد."
      action={
        <Button nativeButton={false} render={<Link href="/" />}>
          بازگشت به پرونده‌ها
        </Button>
      }
    />
  );
}
