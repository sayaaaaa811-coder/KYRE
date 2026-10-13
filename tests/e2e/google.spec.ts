import { expect, test, type Page } from "@playwright/test";

/**
 * Google 連携の E2E（偽 Google サーバー tests/e2e/fake-google.mjs を使用）。
 * サーバー側は実際の現在時刻で入力を検証するため、日付は「今日」から相対的に決める。
 * 偽 Google は JST の偶数日 18:30〜20:00 を予定ありとして返す。
 */
function jstDate(offsetDays: number) {
  const d = new Date(Date.now() + 9 * 3600_000 + offsetDays * 24 * 3600_000);
  return { month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

const A = jstDate(7);
const B = jstDate(8);
const MESSAGE = `${A.month}/${A.day}か${B.month}/${B.day}の19時からどう？`;
const statusFor = (day: number) => (day % 2 === 0 ? "busy_with_alternatives" : "available");

async function toReview(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /変更$/ })).toBeVisible();
  await page.getByRole("textbox", { name: "メッセージ", exact: true }).fill(MESSAGE);
  await page.getByRole("button", { name: "候補を抽出する" }).click();
  await expect(page.getByRole("heading", { name: "2件の候補" })).toBeVisible();
}

async function connect(page: Page, choice: string) {
  await page.getByRole("button", { name: "空き状況を確認する" }).click();
  const sheet = page.getByRole("dialog", { name: "Googleカレンダーと連携" });
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText("予定の件名・場所・参加者は取得しません");
  await sheet.getByRole("button", { name: "Googleで連携する" }).click();
  await expect(page.getByRole("heading", { name: "Fake Google 同意画面" })).toBeVisible();
  await page.getByRole("link", { name: choice, exact: true }).click();
}

test("未連携 → Google 連携 → 戻ると候補が復元され、自動で照合される", async ({ page }) => {
  const apiBodies: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/")) apiBodies.push(`${r.url()} ${r.postData() ?? ""}`);
  });

  await toReview(page);
  await connect(page, "許可する");

  await expect(page).toHaveURL(/step=3/);
  await expect(page.getByText("Googleカレンダー（メイン）の予定と照合しています")).toBeVisible();
  const cards = page.locator("li[data-status]");
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0)).toHaveAttribute("data-status", statusFor(A.day));
  await expect(cards.nth(1)).toHaveAttribute("data-status", statusFor(B.day));

  // メッセージ本文はサーバーに送られていない
  expect(apiBodies.join("\n")).not.toContain("どう？");
  // OAuth 往復用の一時データは削除されている
  expect(await page.evaluate(() => sessionStorage.getItem("kyre:pending"))).toBeNull();
  // URL にトークンや認可コードが残っていない
  expect(page.url()).not.toMatch(/code=|token|restore|state=/);

  // セッション Cookie は JavaScript から読めない（HttpOnly）
  const cookies = await page.context().cookies();
  const session = cookies.find((c) => c.name === "kyre_session");
  expect(session?.httpOnly).toBe(true);
  expect(session?.sameSite).toBe("Lax");
  expect(await page.evaluate(() => document.cookie)).not.toContain("kyre_session");

  // 2 回目以降は連携済みなのでシートは出ない
  await page.getByRole("button", { name: "候補を修正" }).click();
  await page.getByRole("button", { name: "空き状況を確認する" }).click();
  await expect(page).toHaveURL(/step=3/);
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("連携をキャンセルすると、候補を保ったまま案内を表示する", async ({ page }) => {
  await toReview(page);
  await connect(page, "キャンセル");
  await expect(page.getByText("Google連携がキャンセルされました")).toBeVisible();
  await expect(page.getByRole("heading", { name: "2件の候補" })).toBeVisible();
  expect(page.url()).not.toContain("auth_error");
});

test("カレンダーの権限を外して許可すると、権限の案内を表示し連携しない", async ({ page }) => {
  await toReview(page);
  await connect(page, "カレンダーのチェックを外して許可");
  await expect(page.getByText("カレンダーの空き状況へのアクセスが許可されませんでした")).toBeVisible();
  const cookies = await page.context().cookies();
  expect(cookies.find((c) => c.name === "kyre_session")).toBeUndefined();
});

test("state が改ざんされた戻りは拒否する", async ({ page }) => {
  await toReview(page);
  await connect(page, "state を改ざん");
  await expect(page.getByText("連携の確認に失敗しました")).toBeVisible();
  const cookies = await page.context().cookies();
  expect(cookies.find((c) => c.name === "kyre_session")).toBeUndefined();
});

test("予定の取得に失敗したら、参加可能と表示しない", async ({ page }) => {
  await toReview(page);
  await connect(page, "許可する（予定取得が失敗するアカウント）");
  await expect(page.getByRole("heading", { name: "空き状況を確認できませんでした" })).toBeVisible();
  await expect(page.locator('li[data-status="available"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "もう一度試す" })).toBeVisible();
});

test("設定画面から連携を解除すると、次回は再連携を求める", async ({ page }) => {
  await toReview(page);
  await connect(page, "許可する");
  await expect(page).toHaveURL(/step=3/);

  await page.getByRole("link", { name: "設定" }).click();
  await expect(page.getByRole("status").filter({ hasText: "連携しています" })).toBeVisible();
  await page.getByRole("button", { name: "連携を解除する" }).click();
  await expect(page.getByText("連携を解除しました")).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "連携していません" })).toBeVisible();
  const cookies = await page.context().cookies();
  expect(cookies.find((c) => c.name === "kyre_session")).toBeUndefined();

  await toReview(page);
  await page.getByRole("button", { name: "空き状況を確認する" }).click();
  await expect(page.getByRole("dialog", { name: "Googleカレンダーと連携" })).toBeVisible();
});

test("デモを選ぶとダミーカレンダーで照合する", async ({ page }) => {
  await toReview(page);
  await page.getByRole("button", { name: "空き状況を確認する" }).click();
  await page.getByRole("button", { name: "デモ用のカレンダーで試す" }).click();
  await expect(page.getByText("デモ用のダミーカレンダーで照合しています")).toBeVisible();
});

test("セキュリティヘッダー: nonce 付き CSP が付与され、違反が発生しない", async ({ page }) => {
  const violations: string[] = [];
  page.on("console", (m) => {
    if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text());
  });
  const res = await page.goto("/");
  const headers = res!.headers();
  expect(headers["content-security-policy"]).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-powered-by"]).toBeUndefined();

  // 操作して画面が正常に動く（スクリプトがブロックされていない）
  await page.getByRole("textbox", { name: "メッセージ", exact: true }).fill(MESSAGE);
  await page.getByRole("button", { name: "候補を抽出する" }).click();
  await expect(page.getByRole("heading", { name: "2件の候補" })).toBeVisible();
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "設定" })).toBeVisible();
  expect(violations).toEqual([]);

  const api = await page.request.get("/api/session");
  expect(api.headers()["cache-control"]).toBe("no-store");
});
