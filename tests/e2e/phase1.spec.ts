import { expect, test, type Page } from "@playwright/test";

// 2026-10-13(火) 10:00 JST に固定
const NOW = new Date("2026-10-13T10:00:00+09:00");

async function open(page: Page, query = "") {
  await page.clock.setFixedTime(NOW);
  await page.goto(`/${query}`);
  await expect(page.getByRole("button", { name: /基準日|10\/13\(火\)/ })).toBeVisible();
}

async function goToReview(page: Page) {
  await page
    .getByRole("textbox", { name: "メッセージ", exact: true })
    .fill("来週どこか飲みに行こう！ 19日か20日の19時〜どう？");
  await page.getByRole("button", { name: "候補を抽出する" }).click();
  await expect(page).toHaveURL(/step=2/);
}

async function addCandidate(page: Page, date: string, time: string) {
  await page.getByRole("button", { name: "＋ 候補を追加" }).click();
  const card = page.getByRole("listitem", { name: /^候補\d+$/ }).last();
  await card.getByLabel("日付").fill(date);
  await card.getByLabel("開始時刻").fill(time);
}

const resultCards = (page: Page) => page.locator("li[data-status]");

test("入力 → 確認 → 照合（ダミーカレンダー）で参加可否と代替案が表示される", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("button", { name: "候補を抽出する" })).toBeDisabled();
  await goToReview(page);

  // Phase 1 は自動抽出なし → 案内が出る
  await expect(page.getByText("日時を自動で見つけられませんでした")).toBeVisible();
  await expect(page.getByRole("button", { name: "空き状況を確認する" })).toBeDisabled();

  await addCandidate(page, "2026-10-19", "19:00");
  await addCandidate(page, "2026-10-20", "19:00");
  await expect(page.getByText("10/19(月)")).toBeVisible();

  await page.getByRole("button", { name: "空き状況を確認する" }).click();
  await expect(page).toHaveURL(/step=3/);
  await expect(page.getByText("デモ用のダミーカレンダー")).toBeVisible();

  const cards = resultCards(page);
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0)).toHaveAttribute("data-status", "available");
  await expect(cards.nth(0)).toContainText("19:00–20:30");
  await expect(cards.nth(1)).toHaveAttribute("data-status", "busy_with_alternatives");
  await expect(cards.nth(1).getByRole("list", { name: "代替案" }).getByRole("listitem")).toHaveText([
    "20:15〜",
    "20:30〜",
    "20:45〜",
  ]);
  await expect(page.getByRole("heading", { name: "1件の候補に参加できます" })).toBeVisible();

  // 所要時間を変えると即時に再判定される
  await page.getByRole("button", { name: "変更" }).click();
  await page.getByRole("radio", { name: "30分" }).first().click();
  await expect(cards.nth(1).getByRole("list", { name: "代替案" }).getByRole("listitem")).toHaveText([
    "20:15〜",
    "17:45〜",
    "20:30〜",
  ]);
});

test("ブラウザの戻る操作で候補確認に戻り、入力内容が残っている", async ({ page }) => {
  await open(page);
  await goToReview(page);
  await addCandidate(page, "2026-10-19", "19:00");
  await page.getByRole("button", { name: "空き状況を確認する" }).click();
  await expect(page).toHaveURL(/step=3/);

  await page.goBack();
  await expect(page).toHaveURL(/step=2/);
  await expect(page.getByText("10/19(月)")).toBeVisible();

  await page.goBack();
  await expect(page.getByRole("textbox", { name: "メッセージ", exact: true })).toHaveValue(/19日か20日/);
});

test("予定を取得できない場合、参加可能と表示しない", async ({ page }) => {
  await open(page, "?mock=error");
  await goToReview(page);
  await addCandidate(page, "2026-10-19", "19:00");
  await page.getByRole("button", { name: "空き状況を確認する" }).click();

  await expect(page.getByRole("heading", { name: "空き状況を確認できませんでした" })).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: "空き状況は表示していません" })).toBeVisible();
  await expect(page.locator('li[data-status="available"]')).toHaveCount(0);
  await expect(resultCards(page).first()).toHaveAttribute("data-status", "fetch_failed");
  await expect(page.getByRole("button", { name: "もう一度試す" })).toBeVisible();
});

test("終日予定の日は代替案なし、過去・日付またぎは判定対象外", async ({ page }) => {
  await open(page);
  await goToReview(page);
  await addCandidate(page, "2026-10-21", "19:00"); // 21 日 = 7 の倍数 → 終日予定
  await addCandidate(page, "2026-10-13", "09:00"); // 過去
  await addCandidate(page, "2026-10-19", "23:00"); // 23:00 + 90 分 → 日付またぎ
  await page.getByRole("button", { name: "空き状況を確認する" }).click();

  const cards = resultCards(page);
  await expect(cards.nth(0)).toHaveAttribute("data-status", "busy_no_alternatives");
  await expect(cards.nth(1)).toHaveAttribute("data-status", "out_of_scope");
  await expect(cards.nth(1)).toContainText("過去の日時です");
  await expect(cards.nth(2)).toHaveAttribute("data-status", "out_of_scope");
  await expect(cards.nth(2)).toContainText("日付をまたぐ");
});

test("入力は 2,000 文字まで、スクリプトを含む文字列は実行されない", async ({ page }) => {
  let dialogShown = false;
  page.on("dialog", (d) => {
    dialogShown = true;
    void d.dismiss();
  });
  await open(page);
  const box = page.getByRole("textbox", { name: "メッセージ", exact: true });
  await box.fill(`<img src=x onerror=alert(1)><script>alert(2)</script>${"あ".repeat(2100)}`);
  await expect(box).toHaveValue(/^<img src=x/);
  expect((await box.inputValue()).length).toBe(2000);
  await expect(page.getByRole("alert").filter({ hasText: "2,000 文字まで" })).toBeVisible();
  await page.getByRole("button", { name: "候補を抽出する" }).click();
  await expect(page).toHaveURL(/step=2/);
  expect(dialogShown).toBe(false);
});

test("候補を削除できる・要確認なしなら照合ボタンが有効", async ({ page }) => {
  await open(page);
  await goToReview(page);
  await addCandidate(page, "2026-10-19", "19:00");
  await addCandidate(page, "2026-10-20", "19:00");
  await page.getByRole("button", { name: "候補1を削除" }).click();
  await expect(page.getByRole("listitem", { name: /^候補\d+$/ })).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "1件の候補" })).toBeVisible();
  await expect(page.getByRole("button", { name: "空き状況を確認する" })).toBeEnabled();
});
