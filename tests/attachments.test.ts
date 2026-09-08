import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_ATTACHMENT_BYTES,
  validateAttachmentSelection,
} from "../lib/attachments.ts";

test("attachment selection accepts small files", () => {
  assert.equal(
    validateAttachmentSelection([{ name: "quote.pdf", size: 120_000, type: "application/pdf" }]),
    null
  );
});

test("attachment selection rejects a file over eight megabytes", () => {
  const result = validateAttachmentSelection([
    { name: "huge.pdf", size: MAX_ATTACHMENT_BYTES + 1, type: "application/pdf" },
  ]);
  assert.equal(Boolean(result), true);
});
