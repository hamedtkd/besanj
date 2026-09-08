import test from "node:test";
import assert from "node:assert/strict";
import { buildProviderSuggestions } from "../lib/provider-history.ts";
import type { Provider } from "../lib/types.ts";

const providers: Provider[] = [
  {
    id: "current-1",
    caseId: "case-a",
    name: "فروشگاه آریا",
    phone: "09121234567",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-08T00:00:00.000Z",
  },
  {
    id: "history-duplicate",
    caseId: "case-b",
    name: " فروشگاه آریا ",
    phone: "۰۹۱۲۱۲۳۴۵۶۷",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-09-07T00:00:00.000Z",
  },
  {
    id: "history-2",
    caseId: "case-c",
    name: "شرکت بهار",
    phone: "09120000000",
    rating: 5,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-09-06T00:00:00.000Z",
  },
];

test("provider suggestions keep current case first and deduplicate history", () => {
  const suggestions = buildProviderSuggestions("case-a", providers);
  assert.equal(suggestions.length, 2);
  assert.equal(suggestions[0]?.scope, "current");
  assert.equal(suggestions[0]?.provider.id, "current-1");
  assert.equal(suggestions[1]?.scope, "history");
  assert.equal(suggestions[1]?.provider.id, "history-2");
});
