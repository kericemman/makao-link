import test from "node:test";
import assert from "node:assert/strict";
import { getVideoEmbedUrl } from "./videoEmbed.js";

test("normalizes supported YouTube URL formats to privacy-enhanced embeds", () => {
  const expected = "https://www.youtube-nocookie.com/embed/abcdefghijk";
  assert.equal(getVideoEmbedUrl("https://youtu.be/abcdefghijk?t=20"), expected);
  assert.equal(getVideoEmbedUrl("https://www.youtube.com/watch?v=abcdefghijk"), expected);
  assert.equal(getVideoEmbedUrl("https://youtube.com/shorts/abcdefghijk"), expected);
  assert.equal(getVideoEmbedUrl("https://www.youtube-nocookie.com/embed/abcdefghijk"), expected);
});

test("normalizes supported Vimeo URL formats", () => {
  const expected = "https://player.vimeo.com/video/12345678";
  assert.equal(getVideoEmbedUrl("https://vimeo.com/12345678"), expected);
  assert.equal(getVideoEmbedUrl("https://player.vimeo.com/video/12345678"), expected);
});

test("rejects unsupported, malformed, non-HTTPS, and invalid provider URLs", () => {
  for (const value of [
    "",
    "not a URL",
    "http://youtube.com/watch?v=abcdefghijk",
    "https://youtube.com.evil.test/watch?v=abcdefghijk",
    "https://youtube.com/watch?v=bad",
    "https://vimeo.com/not-a-video",
    "https://example.com/video"
  ]) {
    assert.equal(getVideoEmbedUrl(value), null, value);
  }
});
