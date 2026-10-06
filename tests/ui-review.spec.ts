import { expect, test } from "@playwright/test";

test("search recovery and required analysis name focus", async ({ page }) => {
  await page.goto("/data-library");
  await page.getByRole("textbox", { name: "데이터 검색" }).fill("존재하지 않는 데이터");
  await expect(page.getByRole("heading", { name: "검색 결과가 없어요" })).toBeVisible();
  await page.getByRole("button", { name: "검색 초기화" }).click();
  await expect(page.locator(".dataset-card")).toHaveCount(4);
  await page.getByRole("textbox", { name: "데이터 검색" }).fill("  MES  ");
  await expect(page.locator(".dataset-card")).toHaveCount(1);
  await page.getByRole("button", { name: "새 분석 만들기" }).click();
  await page.getByRole("button", { name: "다음: 데이터 준비", exact: true }).click();
  await expect(page.getByRole("textbox", { name: /분석 이름/ })).toBeFocused();
  await expect(page.locator(".analysis-editor").getByRole("alert")).toHaveText("분석 이름을 입력해주세요.");
});

test("workspace fits phone, tablet, desktop and landscape", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [width, height] of [[375, 812], [768, 1024], [1440, 1000], [812, 375]]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(page.getByRole("button", { name: "새 분석 만들기" })).toBeEnabled();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `docs/screenshots/ui-review-home-${width}.png`, fullPage: true });
  }
});
