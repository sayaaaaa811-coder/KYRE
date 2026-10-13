import { expect, test, type Page } from "@playwright/test";

// 2026-10-13(火) 10:00 JST に固定
const NOW = new Date("2026-10-13T10:00:00+09:00");

async function extract(page: Page, text: string) {
  await page.clock.setFixedTime(NOW);
  await page.goto("/");
  await expect(page.getByRole("button", { name: /10\/13\(火\)/ })).toBeVisible();
  await page.getByRole("textbox", { name: "メッセージ", exact: true }).fill(text);
  await page.getByRole("button", { name: "候補を抽出する" }).click();
  await expect(page).toHaveURL(/step=2/);
}

const cards = (page: Page) => page.getByRole("listitem", { name: /^候補\d+$/ });

test("LINE の文章から候補を抽出し、そのまま照合できる", async ({ page }) => {
  await extract(page, "来週どこか飲みに行こう！\n10/19(月)か20(火)の19時〜どう？");
  await expect(page.getByRole("heading", { name: "2件の候補" })).toBeVisible();
  await expect(cards(page).nth(0)).toContainText("10/19(月)");
  await expect(cards(page).nth(1)).toContainText("10/20(火)");
  await expect(cards(page).nth(1)).toContainText("19:00〜");

  await page.getByRole("button", { name: "空き状況を確認する" }).click();
  const results = page.locator("li[data-status]");
  await expect(results.nth(0)).toHaveAttribute("data-status", "available");
  await expect(results.nth(1)).toHaveAttribute("data-status", "busy_with_alternatives");
});

test("午前・午後が曖昧な時刻は選択するまで照合できない", async ({ page }) => {
  await extract(page, "20日の7時に集合で！");
  const card = cards(page).first();
  await expect(card).toContainText("要確認");
  await expect(card).toContainText("午前・午後どちらですか？");
  await expect(page.getByRole("button", { name: "空き状況を確認する" })).toBeDisabled();
  await expect(page.getByText("要確認の候補が 1 件あります")).toBeVisible();

  await card.getByRole("button", { name: "午前 07:00" }).click();
  await expect(card).toContainText("07:00〜");
  await expect(card).not.toContainText("要確認");
  await expect(page.getByRole("button", { name: "空き状況を確認する" })).toBeEnabled();
});

test("曜日の矛盾は選択肢から選べる", async ({ page }) => {
  await extract(page, "10/20(水) 19時でどう？");
  const card = cards(page).first();
  await expect(card).toContainText("10/20(火)は火曜日です");
  await card.getByRole("button", { name: "10/21(水)" }).click();
  await expect(card).toContainText("10/21(水)");
  await expect(page.getByRole("button", { name: "空き状況を確認する" })).toBeEnabled();
});

test("時刻範囲から所要時間を設定する", async ({ page }) => {
  await extract(page, "10/20 19:00-21:00 でお願いします");
  await expect(page.getByText("所要時間を120分にしました")).toBeVisible();
  await expect(page.getByRole("radio", { name: "120分" })).toHaveAttribute("aria-checked", "true");
});

test("時間帯だけの候補は仮の時刻を確定してから照合する", async ({ page }) => {
  await extract(page, "明日の夜あいてる？");
  const card = cards(page).first();
  await expect(card).toContainText("10/14(水)");
  await expect(card).toContainText("19:00開始と仮定しました");
  await card.getByRole("button", { name: "表示中の日時で確定する" }).click();
  await expect(page.getByRole("button", { name: "空き状況を確認する" })).toBeEnabled();
});

test("基準日を変えると「明日」の解釈が変わる", async ({ page }) => {
  await page.clock.setFixedTime(NOW);
  await page.goto("/");
  await page.getByRole("button", { name: /10\/13\(火\) 変更/ }).click();
  await page.getByLabel("基準日").fill("2026-10-10");
  await page.getByRole("textbox", { name: "メッセージ", exact: true }).click();
  await expect(page.getByRole("button", { name: /10\/10\(土\)/ })).toBeVisible();
  await page.getByRole("textbox", { name: "メッセージ", exact: true }).fill("明日の19時どう？");
  await page.getByRole("button", { name: "候補を抽出する" }).click();
  await expect(cards(page).first()).toContainText("10/11(日)");
});
