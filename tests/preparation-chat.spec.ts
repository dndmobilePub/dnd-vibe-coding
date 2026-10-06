import { expect, test } from "@playwright/test";

test("guide stays visible during scrolling and manual setup, with chat avatars", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/analyses/new");
  await page.getByRole("textbox", { name: /분석 이름/ }).fill("가이드 확인");
  await page.getByRole("button", { name: "다음: 데이터 준비", exact: true }).click();
  const guide = page.getByRole("complementary", { name: "AI 준비 가이드" });
  await expect(guide).toBeVisible();
  const top = (await guide.boundingBox())!.y;
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  expect((await guide.boundingBox())!.y).toBe(top);
  await page.getByRole("textbox", { name: "데이터 가이드 질문" }).fill("연결 방법을 알려주세요");
  await page.getByRole("button", { name: "질문 보내기" }).click();
  await expect(guide.locator(".user-avatar")).toHaveText("홍");
  await expect(guide.locator(".robot-avatar")).toHaveCount(2);
  await page.getByRole("button", { name: "직접 설정", exact: true }).click();
  await expect(guide).toBeVisible();
  await expect(guide.locator(".chat-user")).toHaveText("연결 방법을 알려주세요");
});
