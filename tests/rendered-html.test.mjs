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
  assert.match(html, /Khiên Số \| HDBank - IT Security/);
  assert.match(html, /HDBANK · IT SECURITY/);
  assert.match(html, /THƯ VIỆN TÌNH HUỐNG/);
  assert.match(html, /Cuộc gọi ‘điều tra khẩn cấp’/);
  assert.match(html, /Mô phỏng/);
  assert.match(html, /Đăng nhập/);
  assert.match(html, /Đăng ký/);
  assert.match(html, /Đang tham gia với tư cách khách/);
  assert.match(html, />Dashboard</);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("ships product metadata and social artwork", async () => {
  const [layout, page, admin, data, schema, packageJson] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/data.ts", import.meta.url), "utf8"),
    readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /og\.png/);
  assert.match(layout, /HDBank - IT Security/);
  assert.match(layout, /lang="vi"/);
  assert.match(page, /localStorage/);
  assert.match(page, /KHIÊN SỐ/);
  assert.match(page, /event\.key === "Escape"/);
  assert.match(page, /aria-pressed/);
  assert.match(page, /role="status"/);
  assert.match(page, /readStoredProgress/);
  assert.match(page, /supabase\.auth\.signUp/);
  assert.match(page, /supabase\.auth\.signInWithPassword/);
  assert.match(page, /supabase\.auth\.signOut\(\{ scope: "local" \}\)/);
  assert.match(page, /continueAsGuest/);
  assert.match(page, /Tiếp tục với tư cách khách/);
  assert.match(page, /test_attempts/);
  assert.match(page, /user_progress/);
  assert.match(page, /get_ciso_dashboard/);
  assert.match(page, /Đăng xuất/);
  assert.match(page, /Tài sản vừa bị tổn thất/);
  assert.match(page, /Đã hiểu hậu quả/);
  assert.match(page, /khien-so-progress:\$\{username/);
  assert.match(page, /resetAuthForm/);
  assert.match(page, /loadRemoteAccount/);
  assert.match(page, /exportCisoReport/);
  assert.match(data, /Dashboard nhận thức an toàn/);
  assert.match(page, /site_content/);
  assert.match(page, /#\/admin/);
  assert.match(page, /AdminPage/);
  assert.match(admin, /Lưu bản nháp/);
  assert.match(admin, /Xuất bản/);
  assert.match(admin, /main-draft/);
  assert.match(admin, /get_ciso_dashboard/);
  assert.match(data, /normalizeSiteContent/);
  assert.match(schema, /alter table public\.site_content enable row level security/);
  assert.match(schema, /site_content_public_read/);
  assert.match(schema, /private\.user_is_app_admin/);
  assert.doesNotMatch(page, /PBKDF2|khien-so-accounts|khien-so-session/);
  assert.doesNotMatch(page, /HỖ TRỢ KHẨN CẤP|Liên hệ HDBank 1900 6060/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await access(new URL("../public/og.png", import.meta.url));
  await access(new URL("../public/hdbank-logo.png", import.meta.url));
  await access(new URL("../public/favicon.png", import.meta.url));
  await assert.rejects(access(new URL("../app/_sites-preview", root)));
});
