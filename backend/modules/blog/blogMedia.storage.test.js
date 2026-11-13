const test = require("node:test");
const assert = require("node:assert/strict");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { hasValidImageSignature, uploadBlogImage } = require("./blogMedia.storage");

const publicEnv = {
  R2_S3_ENDPOINT: "https://r2.example.test",
  R2_PUBLIC_BUCKET: "public-media",
  R2_ACCESS_KEY_ID: "test-access-key",
  R2_SECRET_ACCESS_KEY: "test-secret-key",
  R2_PUBLIC_URL: "https://media.example.test"
};

test("inline article upload requires matching image type and file signature", () => {
  assert.equal(hasValidImageSignature({
    originalname: "article.webp",
    mimetype: "image/webp",
    buffer: Buffer.from("RIFF0000WEBP")
  }), true);
  assert.equal(hasValidImageSignature({
    originalname: "article.webp",
    mimetype: "image/webp",
    buffer: Buffer.from("not an image")
  }), false);
  assert.equal(hasValidImageSignature({
    originalname: "article.jpg",
    mimetype: "image/png",
    buffer: Buffer.from([0xff, 0xd8, 0xff])
  }), false);
});

test("inline article images write only to the configured public R2 bucket", async () => {
  const commands = [];
  const file = { originalname: "story.webp", mimetype: "image/webp", size: 12, buffer: Buffer.from("RIFF0000WEBP") };
  const result = await uploadBlogImage(file, {
    env: publicEnv,
    id: "fixed-random-id",
    clientFactory: () => ({ send: async (command) => { commands.push(command); } })
  });

  assert.equal(commands.length, 1);
  assert.ok(commands[0] instanceof PutObjectCommand);
  assert.equal(commands[0].input.Bucket, "public-media");
  assert.equal(commands[0].input.Key, "blog-content/fixed-random-id.webp");
  assert.equal(commands[0].input.ContentType, "image/webp");
  assert.equal(commands[0].input.CacheControl, "public, max-age=31536000, immutable");
  assert.equal(result.url, "https://media.example.test/blog-content/fixed-random-id.webp");
});

test("invalid image bytes are rejected before any R2 request", async () => {
  let sent = false;
  await assert.rejects(
    uploadBlogImage({ originalname: "payload.png", mimetype: "image/png", size: 10, buffer: Buffer.from("not png") }, {
      env: publicEnv,
      clientFactory: () => ({ send: async () => { sent = true; } })
    }),
    (error) => error.code === "INVALID_IMAGE_CONTENT" && error.statusCode === 400
  );
  assert.equal(sent, false);
});
