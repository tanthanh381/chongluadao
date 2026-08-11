import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html", host: "localhost" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server renders the Khiên Số experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /Khiên Số \| HDBank - Phòng Bảo mật/);
  assert.match(html, /HDBANK · PHÒNG BẢO MẬT/);
  assert.match(html, /THƯ VIỆN TÌNH HUỐNG/);
  assert.match(html, /Cuộc gọi ‘điều tra khẩn cấp’/);
  assert.match(html, /Mô phỏng/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("ships product metadata and social artwork", async () => {
  const [layout, page, packageJson] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /og\.png/);
  assert.match(layout, /HDBank - Phòng Bảo mật/);
  assert.match(layout, /lang="vi"/);
  assert.match(page, /localStorage/);
  assert.match(page, /KHIÊN SỐ/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await access(new URL("../public/og.png", import.meta.url));
  await access(new URL("../public/hdbank-logo.png", import.meta.url));
  await assert.rejects(access(new URL("../app\/_sites-preview", root)));
});
