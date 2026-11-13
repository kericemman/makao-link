const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const nginxConfig = fs.readFileSync(
  path.join(__dirname, "../../../deploy/hostinger-nginx.conf"),
  "utf8"
);

test("blog image upload endpoints have scoped Nginx body limits", () => {
  const apiServer = nginxConfig.split("server_name updates.rendahomes.com;")[1];

  for (const endpoint of ["/api/blog/admin", "/api/blog/admin/images"]) {
    const escapedEndpoint = endpoint.replaceAll("/", "\\/");
    const location = new RegExp(
      `location = ${escapedEndpoint}\\s*\\{[^}]*client_max_body_size 12m;`,
      "s"
    );
    assert.match(apiServer, location);
  }
});
