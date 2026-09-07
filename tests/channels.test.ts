import test from "node:test";
import assert from "node:assert/strict";
import { channelContactMeta, channelLabel, QUOTE_CHANNELS } from "../lib/format.ts";

test("social quote channels include Instagram and Telegram", () => {
  assert.equal(channelLabel("instagram"), "دایرکت اینستاگرام");
  assert.equal(channelLabel("telegram"), "تلگرام");
  assert.equal(channelLabel("whatsapp"), "واتساپ");
});

test("every quote channel has contact metadata", () => {
  for (const channel of QUOTE_CHANNELS) {
    const meta = channelContactMeta(channel.value);
    assert.ok(meta.label.length > 0, `${channel.value} should have a contact label`);
    assert.ok(meta.placeholder.length > 0, `${channel.value} should have a contact placeholder`);
  }
});
