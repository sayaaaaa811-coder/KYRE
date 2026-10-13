import { expect, test, type Page } from "@playwright/test";

// 2026-10-13(火) 10:00 JST に固定。ダミーカレンダー: 偶数日 18:30〜20:00 が予定あり
const NOW = new Date("2026-10-13T10:00:00+09:00");

test.beforeEach(async ({ context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
});

async function toResult(page: Page, text: string, query = "?mock=mixed") {
  await page.clock.setFixedTime(NOW);
  await page.goto(`/${query}`);
  await expect(page.getByRole("button", { name: /10\/13\(火\)/ })).toBeVisible();
  await page.getByRole("textbox", { name: "メッセージ", exact: true }).fill(text);
  await page.getByRole("button", { name: "候補を抽出する" }).click();
  await page.getByRole("button", { name: "空き状況を確認する" }).click();
  await expect(page).toHaveURL(/step=3/);
}

const preview = (page: Page) => page.getByTestId("reply-preview");
const clipboard = (page: Page) => page.evaluate(() => navigator.clipboard.readText());

test("照合結果の画面で返信文を確認し、そのままコピーできる（最短 4 タップ）", async ({ page }) => {
  await toResult(page, "来週どこか飲みに行こう！ 10/19(月)か20(火)の19時〜どう？");
  await expect(preview(page)).toHaveText(
    "誘ってくれてありがとう！\n10/19(月)の19時〜なら行けるよ！\n20(火)は予定があって難しそう…\n楽しみにしてる！",
  );

  await page.getByRole("button", { name: "返信文をコピー" }).click();
  await expect(page.getByRole("status").filter({ hasText: "コピーしました" })).toBeVisible();
  expect(await clipboard(page)).toBe(
    "誘ってくれてありがとう！\n10/19(月)の19時〜なら行けるよ！\n20(火)は予定があって難しそう…\n楽しみにしてる！",
  );
});

test("代替案をタップすると返信文に追加され、もう一度タップで外れる", async ({ page }) => {
  await toResult(page, "10/19(月)か20(火)の19時〜どう？");
  const chip = page.getByRole("button", { name: "20:15〜" });
  await expect(chip).toHaveAttribute("aria-pressed", "false");
  await chip.click();
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  await expect(preview(page)).toContainText("20(火)は19時だと難しいけど、20:15〜なら大丈夫！");
  await chip.click();
  await expect(preview(page)).toContainText("20(火)は予定があって難しそう…");
});

test("参加できる候補がなければ、最も近い代替案を選んだ状態で提案する", async ({ page }) => {
  await toResult(page, "10/20(火)の19時〜どう？");
  await expect(page.getByRole("button", { name: "20:15〜" })).toHaveAttribute("aria-pressed", "true");
  await expect(preview(page)).toHaveText(
    "誘ってくれてありがとう！\n10/20(火)は19時だと難しいけど、20:15〜なら大丈夫！\nどうかな？",
  );
});

test("丁寧な文体に切り替えられる", async ({ page }) => {
  await toResult(page, "10/19(月) 19:00からでいかがでしょうか");
  await page.getByRole("radio", { name: "丁寧" }).click();
  await expect(preview(page)).toHaveText(
    "ご連絡ありがとうございます。\n10/19(月) 19:00〜でしたら参加可能です。\nよろしくお願いいたします。",
  );
});

test("返信文を編集してコピーでき、自動作成の文に戻せる", async ({ page }) => {
  await toResult(page, "10/19(月)の19時〜どう？");
  await page.getByRole("button", { name: "返信文を編集" }).click();
  await expect(page).toHaveURL(/step=4/);
  const box = page.getByRole("textbox", { name: "返信文" });
  await expect(box).toHaveValue("誘ってくれてありがとう！\n10/19(月)の19時〜なら行けるよ！\n楽しみにしてる！");

  await box.fill("ありがとう！19日の19時に行くね");
  await page.getByRole("button", { name: "コピーする" }).click();
  expect(await clipboard(page)).toBe("ありがとう！19日の19時に行くね");

  await page.getByRole("button", { name: "自動作成の文に戻す" }).click();
  await expect(box).toHaveValue(/^誘ってくれてありがとう！/);

  // 戻って編集画面に再度来ても、プレビューと同じ文になっている
  await page.goBack();
  await expect(preview(page)).toBeVisible();
});

test("予定を取得できなかった場合は返信文を作らない", async ({ page }) => {
  await toResult(page, "10/19(月)の19時〜どう？", "?mock=error");
  await expect(preview(page)).toBeHidden();
  await expect(page.getByRole("button", { name: "返信文をコピー" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "返信文を編集" })).toBeDisabled();
});

test("最初からやり直すと入力が空に戻る", async ({ page }) => {
  await toResult(page, "10/19(月)の19時〜どう？");
  await page.getByRole("button", { name: "返信文を編集" }).click();
  await page.getByRole("button", { name: "最初からやり直す" }).click();
  await expect(page).toHaveURL(/step=1/);
  await expect(page.getByRole("textbox", { name: "メッセージ", exact: true })).toHaveValue("");
});
