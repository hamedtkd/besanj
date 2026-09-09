"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Bookmark,
  BookmarkCheck,
  LayoutTemplate,
  Package,
  Search,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { HelpHint } from "@/components/help-hint";
import { useToast } from "@/components/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  asTemplateOption,
  BUILTIN_CASE_TEMPLATES,
  searchCaseTemplates,
  sortCustomTemplates,
  type CaseTemplateOption,
} from "@/lib/case-templates";
import { categoryLabelForKey } from "@/lib/categories";
import { db, deleteCaseTemplate, updateCaseTemplate } from "@/lib/db";
import { toPersianDigits } from "@/lib/persian-number";

export function TemplatePickerSheet({
  open,
  onOpenChange,
  onChoose,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChoose: (template: CaseTemplateOption) => void;
}) {
  const { toast } = useToast();
  const [query, setQuery] = React.useState("");
  const [tab, setTab] = React.useState("builtIn");
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);
  const customTemplates = useLiveQuery(() => db.caseTemplates.toArray(), [], []);

  function resetTransientState() {
    setQuery("");
    setPendingDeleteId(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetTransientState();
    onOpenChange(nextOpen);
  }

  function chooseTemplate(template: CaseTemplateOption) {
    resetTransientState();
    onChoose(template);
  }

  const customOptions = sortCustomTemplates(customTemplates).map(asTemplateOption);
  const builtIn = searchCaseTemplates(BUILTIN_CASE_TEMPLATES, query);
  const custom = searchCaseTemplates(customOptions, query);

  async function toggleFavorite(template: CaseTemplateOption) {
    if (template.source !== "custom") return;
    await updateCaseTemplate(template.id, { favorite: !template.favorite });
  }

  async function removeTemplate(template: CaseTemplateOption) {
    if (template.source !== "custom") return;
    if (pendingDeleteId !== template.id) {
      setPendingDeleteId(template.id);
      toast("برای حذف این قالب، دکمه حذف را یک بار دیگر بزن.");
      return;
    }
    await deleteCaseTemplate(template.id);
    setPendingDeleteId(null);
    toast("قالب شخصی حذف شد.");
  }

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={handleOpenChange}
      title="قالب‌های پرونده"
      description="قالب فقط دسته، برچسب، شرط‌ها و توضیح پایه را آماده می‌کند؛ فروشنده و قیمت هیچ‌وقت داخل قالب ذخیره نمی‌شوند."
      className="sm:max-w-3xl"
    >
      <div className="grid gap-4 p-4 pb-6 sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            className="pe-9"
            placeholder="جست‌وجوی قالب، دسته یا شرط..."
          />
        </div>

        <Tabs value={tab} onValueChange={(value) => setTab(String(value))} variant="default">
          <TabsList className="w-full">
            <TabsTrigger value="builtIn" className="flex-1">
              آماده
              <span className="type-data opacity-60">{toPersianDigits(BUILTIN_CASE_TEMPLATES.length)}</span>
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex-1">
              شخصی
              <span className="type-data opacity-60">{toPersianDigits(customOptions.length)}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="builtIn" className="mt-4">
            <TemplateGrid rows={builtIn} onChoose={chooseTemplate} />
          </TabsContent>

          <TabsContent value="custom" className="mt-4">
            {custom.length ? (
              <TemplateGrid
                rows={custom}
                onChoose={chooseTemplate}
                onFavorite={toggleFavorite}
                onDelete={removeTemplate}
                pendingDeleteId={pendingDeleteId}
              />
            ) : customOptions.length ? (
              <EmptyTemplates text="قالب شخصی با این جست‌وجو پیدا نشد." />
            ) : (
              <EmptyTemplates text="هنوز قالب شخصی نداری. داخل هر پرونده روی «ذخیره قالب» بزن تا همان ساختار را برای خرید بعدی نگه داری." />
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-center">
          <HelpHint label="راهنمای قالب‌ها" side="top">
            قالب‌ها فقط شروع کار را سریع می‌کنند. بعد از انتخاب قالب، همه فیلدها قابل ویرایش‌اند و می‌توانی حتی فقط با همان عنوان پرونده را بسازی.
          </HelpHint>
        </div>
      </div>
    </ResponsiveSheet>
  );
}

function TemplateGrid({
  rows,
  onChoose,
  onFavorite,
  onDelete,
  pendingDeleteId,
}: {
  rows: CaseTemplateOption[];
  onChoose: (template: CaseTemplateOption) => void;
  onFavorite?: (template: CaseTemplateOption) => void;
  onDelete?: (template: CaseTemplateOption) => void;
  pendingDeleteId?: string | null;
}) {
  if (!rows.length) return <EmptyTemplates text="قالبی با این جست‌وجو پیدا نشد." />;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map((template) => (
        <Card key={template.id} className="flex min-h-48 flex-col gap-3 border-border/90 bg-card/75 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-start gap-2.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                {template.kind === "product" ? <Package className="size-5" /> : <Stethoscope className="size-5" />}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h3 className="type-card-title truncate">{template.name}</h3>
                  {template.favorite ? <BookmarkCheck className="size-4 text-primary" /> : null}
                </div>
                <p className="type-caption mt-1 text-muted-foreground">
                  {template.descriptionShort ?? template.description ?? "شروع سریع با ساختار آماده"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline">
              {categoryLabelForKey(template.categoryKey, template.categoryLabel)}
            </Badge>
            {template.requirementLabels?.length ? (
              <Badge variant="secondary">
                {toPersianDigits(template.requirementLabels.length)} شرط پیشنهادی
              </Badge>
            ) : null}
            {template.source === "custom" && template.useCount ? (
              <Badge variant="outline">{toPersianDigits(template.useCount)} بار استفاده</Badge>
            ) : null}
          </div>

          <div className="mt-auto flex items-center gap-2 pt-1">
            <Button type="button" className="flex-1" onClick={() => onChoose(template)}>
              <LayoutTemplate />استفاده از قالب
            </Button>
            {onFavorite ? (
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label={template.favorite ? "برداشتن از علاقه‌مندی" : "افزودن به علاقه‌مندی"}
                onClick={() => onFavorite(template)}
              >
                <Bookmark />
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={pendingDeleteId === template.id ? "تأیید حذف قالب شخصی" : "حذف قالب شخصی"}
                title={pendingDeleteId === template.id ? "برای حذف دوباره بزن" : "حذف قالب شخصی"}
                className={pendingDeleteId === template.id ? "text-destructive" : undefined}
                onClick={() => onDelete(template)}
              >
                <Trash2 />
              </Button>
            ) : null}
          </div>
        </Card>
      ))}
    </div>
  );
}

function EmptyTemplates({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/25 px-4 py-8 text-center">
      <LayoutTemplate className="mx-auto size-7 text-muted-foreground" />
      <p className="type-caption mx-auto mt-2 max-w-md text-muted-foreground">{text}</p>
    </div>
  );
}
