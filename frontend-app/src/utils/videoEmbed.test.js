import test from "node:test";
import assert from "node:assert/strict";
import { getVideoEmbedUrl, isSafeVideoEmbedUrl } from "./videoEmbed.js";

test("normalizes YouTube and Vimeo links into approved embed URLs", () => {
  assert.equal(getVideoEmbedUrl("https://youtu.be/abcdefghijk"), "https://www.youtube-nocookie.com/embed/abcdefghijk");
  assert.equal(getVideoEmbedUrl("https://youtube.com/watch?v=abcdefghijk"), "https://www.youtube-nocookie.com/embed/abcdefghijk");
  assert.equal(getVideoEmbedUrl("https://vimeo.com/12345678"), "https://player.vimeo.com/video/12345678");
});

test("rejects non-provider links and unsafe embed sources", () => {
  assert.equal(getVideoEmbedUrl("https://example.com/video"), null);
  assert.equal(getVideoEmbedUrl("http://youtube.com/watch?v=abcdefghijk"), null);
  assert.equal(isSafeVideoEmbedUrl("https://www.youtube-nocookie.com/embed/abcdefghijk"), true);
  assert.equal(isSafeVideoEmbedUrl("https://youtube.com.evil.test/embed/abcdefghijk"), false);
  assert.equal(isSafeVideoEmbedUrl("javascript:alert(1)"), false);
});
