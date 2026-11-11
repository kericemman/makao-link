const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("assisted listing upload has a route-scoped Nginx body limit", () => {
  const config = fs.readFileSync(path.resolve(__dirname, "../../../deploy/hostinger-nginx.conf"), "utf8");
  const apiServer = config.split("server_name updates.rendahomes.com;")[1]?.split("\n}")[0] || "";
  const uploadLocation = apiServer.match(/location = \/api\/admin\/assisted-listing-drafts\s*\{([\s\S]*?)\n    \}/)?.[1] || "";

  assert.match(uploadLocation, /client_max_body_size 40m;/);
  assert.match(uploadLocation, /proxy_pass http:\/\/127\.0\.0\.1:5000;/);
});

test("landlord listing create and edit have scoped Nginx body limits", () => {
  const config = fs.readFileSync(path.resolve(__dirname, "../../../deploy/hostinger-nginx.conf"), "utf8");
  const apiServer = config.split("server_name updates.rendahomes.com;")[1]?.split("\n}")[0] || "";
  const createLocation = apiServer.match(/location = \/api\/listings\s*\{([\s\S]*?)\n    \}/)?.[1] || "";
  const editLocation = apiServer.match(/location ~ \^\/api\/listings\/\[\^\/\]\+\$\s*\{([\s\S]*?)\n    \}/)?.[1] || "";

  for (const location of [createLocation, editLocation]) {
    assert.match(location, /client_max_body_size 40m;/);
    assert.match(location, /proxy_pass http:\/\/127\.0\.0\.1:5000;/);
  }
});
