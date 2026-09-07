import test from "node:test";
import assert from "node:assert/strict";
import { MAX_COMPARE_QUOTES, toggleShortlist } from "../lib/shortlist.ts";

test("shortlist toggles ids on and off", () => {
  assert.deepEqual(toggleShortlist([], "a"), { ids: ["a"], limitReached: false });
  assert.deepEqual(toggleShortlist(["a"], "a"), { ids: [], limitReached: false });
});

test("shortlist enforces max four cards", () => {
  const ids = Array.from({ length: MAX_COMPARE_QUOTES }, (_, index) => String(index));
  const result = toggleShortlist(ids, "overflow");
  assert.equal(result.limitReached, true);
  assert.deepEqual(result.ids, ids);
});
