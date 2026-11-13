const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const seoRoutes = require("./seo.routes");

const repoRoot = path.resolve(__dirname, "../../..");
const read = (file) => fs.readFileSync(path.join(repoRoot, file), "utf8");
const serverBlockFor = (config, host) => config.split(/(?=^server \{)/m).find((block) => block.includes(`server_name ${host};`)) || "";

test("dynamic sitemap includes current short-stay and bedsitter category routes", () => {
  const paths = seoRoutes.staticPages.map((page) => page.path);
  assert.ok(paths.includes("/categories/short-stays"));
  assert.ok(paths.includes("/categories/bedsitters"));
});

test("main-site Nginx serves the backend-generated dynamic sitemap", () => {
  const config = read("deploy/hostinger-nginx.conf");
  const mainHost = serverBlockFor(config, "rendahomes.com www.rendahomes.com");
  assert.match(mainHost, /location = \/sitemap\.xml\s*\{[^}]*proxy_pass http:\/\/127\.0\.0\.1:5000\/sitemap\.xml;/s);
  assert.doesNotMatch(mainHost, /location = \/sitemap\.xml\s*\{[^}]*try_files/s);
});

test("public listing and article paths reach server-rendered social metadata", () => {
  const config = read("deploy/hostinger-nginx.conf");
  const mainHost = serverBlockFor(config, "rendahomes.com www.rendahomes.com");
  assert.match(mainHost, /location ~ \^\/\(listings\|blog\)\/\[\^\/\]\+\$\s*\{[^}]*proxy_pass http:\/\/127\.0\.0\.1:5000;/s);
});

test("landlord, user, and admin portals expose noindex to crawlers", () => {
  const config = read("deploy/hostinger-nginx.conf");
  for (const [host, htmlPath, robotsPath] of [
    ["landlord.rendahomes.com", "frontend-landlord/index.html", "frontend-landlord/public/robots.txt"],
    ["user.rendahomes.com", "frontend-user/index.html", "frontend-user/public/robots.txt"],
    ["app.rendahomes.com", "frontend-app/index.html", "frontend-app/public/robots.txt"]
  ]) {
    const server = serverBlockFor(config, host);
    assert.match(server, /X-Robots-Tag "noindex, nofollow, noarchive" always/);
    assert.match(read(htmlPath), /<meta name="robots" content="noindex, nofollow, noarchive"\s*\/>/);
    assert.match(read(robotsPath), /User-agent: \*\s+Allow: \/\s*$/);
  }
});
