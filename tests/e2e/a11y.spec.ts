import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const NOW = new Date("2026-10-13T10:00:00+09:00");

// 画面切り替えのフェード中（半透明）にコントラストを測ってしまわないよう、動きを減らす設定で検査する
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

async function audit(page: Page, label: string) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const serious = results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${label}: ${v.id} (${v.impact}) ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  expect(serious).toEqual([]);
}

test("全画面でアクセシビリティの重大な問題がない（WCAG 2.2 AA）", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.clock.setFixedTime(NOW);
  await page.goto("/?mock=mixed");
  await expect(page.getByRole("button", { name: /10\/13\(火\)/ })).toBeVisible();
  await page.getByRole("textbox", { name: "メッセージ", exact: true }).fill("10/20(水)か21日の7時からどう？");
  await audit(page, "① 入力");

  await page.getByRole("button", { name: "候補を抽出する" }).click();
  await expect(page.getByText("要確認").first()).toBeVisible();
  await audit(page, "② 確認（要確認あり）");

  for (const card of await page.getByRole("listitem", { name: /^候補\d+$/ }).all()) {
    await card.getByRole("button", { name: "表示中の日時で確定する" }).click();
  }
  await page.getByRole("button", { name: "空き状況を確認する" }).click();
  await expect(page).toHaveURL(/step=3/);
  await page.getByRole("button", { name: "変更" }).click();
  await audit(page, "③ 結果");

  await page.getByRole("button", { name: "返信文を編集" }).click();
  await audit(page, "④ 返信文");

  await page.getByRole("button", { name: "コピーする" }).click();
  await expect(page.getByRole("status").filter({ hasText: "コピーしました" })).toBeVisible();
  await audit(page, "④ コピー後");

  for (const path of ["/settings", "/privacy", "/terms"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await audit(page, path);
  }
});

test("連携シートのアクセシビリティ", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /変更$/ })).toBeVisible();
  await page.getByRole("button", { name: "日時を手動で入力する" }).click();
  await page.getByRole("button", { name: "＋ 候補を追加" }).click();
  await page.getByRole("button", { name: "空き状況を確認する" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await audit(page, "連携シート");
});
