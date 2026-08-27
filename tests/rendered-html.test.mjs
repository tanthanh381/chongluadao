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
  assert.match(html, /Khiên Số \| Trò chơi cộng đồng nhận diện lừa đảo/);
  assert.match(html, /DỰ ÁN CỘNG ĐỒNG/);
  assert.match(html, /THƯ VIỆN TÌNH HUỐNG/);
  assert.match(html, /Cuộc gọi ‘điều tra khẩn cấp’/);
  assert.match(html, /Mô phỏng/);
  assert.match(html, /Bạn đang chơi ẩn danh/);
  assert.match(html, /Không gửi kết quả lên máy chủ/);
  assert.doesNotMatch(html, /Đăng nhập|Đăng ký|Dashboard/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("ships product metadata and social artwork", async () => {
  const [layout, page, packageJson] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /og\.png/);
  assert.match(layout, /Trò chơi cộng đồng nhận diện lừa đảo/);
  assert.match(layout, /lang="vi"/);
  assert.match(page, /localStorage/);
  assert.match(page, /KHIÊN SỐ/);
  assert.match(page, /event\.key === "Escape"/);
  assert.match(page, /aria-pressed/);
  assert.match(page, /role="status"/);
  assert.match(page, /readStoredProgress/);
  assert.match(page, /LOCAL_PROGRESS_KEY/);
  assert.match(page, /Bạn đang chơi ẩn danh/);
  assert.match(page, /QUYỀN RIÊNG TƯ/);
  assert.match(page, /GIỚI THIỆU DỰ ÁN/);
  assert.match(page, /Tài sản vừa bị tổn thất/);
  assert.match(page, /Đã hiểu hậu quả/);
  assert.doesNotMatch(page, /supabase|signUp|signInWithPassword|test_attempts|user_progress|get_ciso_dashboard|HDBank|IT Security|CISO/i);
  assert.doesNotMatch(packageJson, /supabase|react-loading-skeleton/);
  await access(new URL("../public/og.png", import.meta.url));
  await access(new URL("../public/favicon.svg", import.meta.url));
  await assert.rejects(access(new URL("../app/_sites-preview", root)));
});
