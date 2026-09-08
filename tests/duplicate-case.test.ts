import assert from "node:assert/strict";
import test from "node:test";
import {
  cloneRequirementsForNewCase,
  makeRepeatedCaseTitle,
} from "../lib/duplicate-case.ts";

test("repeated purchase gets a clear fresh title", () => {
  assert.equal(makeRepeatedCaseTitle("مانیتور"), "مانیتور - خرید جدید");
  assert.equal(makeRepeatedCaseTitle("   "), "خرید جدید");
});

test("duplicated requirements keep labels but receive fresh ids", () => {
  let index = 0;
  const cloned = cloneRequirementsForNewCase(
    [
      {
        id: "old-1",
        label: "گارانتی رسمی",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "old-2",
        label: "تحویل سریع",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    () => `new-${++index}`,
    "2026-09-08T10:00:00.000Z"
  );

  assert.deepEqual(
    cloned?.map((item) => [item.id, item.label, item.createdAt]),
    [
      ["new-1", "گارانتی رسمی", "2026-09-08T10:00:00.000Z"],
      ["new-2", "تحویل سریع", "2026-09-08T10:00:00.000Z"],
    ]
  );
});
