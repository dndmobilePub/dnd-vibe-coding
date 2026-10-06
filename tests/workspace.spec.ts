import { expect, test } from "@playwright/test";

test("home, search, favorites and local persistence", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /안녕하세요/ })).toBeVisible();
  await page
    .getByRole("button", { name: "월별 원자재 수급 현황 즐겨찾기 추가" })
    .click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "즐겨찾기" })
    .click();
  await expect(
    page.getByRole("heading", { name: "월별 원자재 수급 현황" }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "즐겨찾기" })
    .click();
  await expect(
    page.getByRole("heading", { name: "월별 원자재 수급 현황" }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "분석 검색" })
    .fill("존재하지 않는 분석");
  await expect(page.locator(".analysis-card")).toHaveCount(0);
  await page.getByRole("button", { name: "필터 초기화" }).click();
  await expect(page.locator(".analysis-card")).toHaveCount(3);
});

test("analysis guards, data validation, chart choice and publication", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "새 분석 만들기" }).click();
  await page.getByRole("button", { name: "다음: 데이터 준비" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toHaveText(
    "분석 이름을 입력해주세요.",
  );
  await page.getByRole("textbox", { name: /분석 이름/ }).fill("E2E 생산 분석");
  await page.getByRole("button", { name: "다음: 데이터 준비" }).click();
  await page.getByRole("button", { name: "추천 적용", exact: true }).click();
  await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(2);
  const stock = page.getByRole("checkbox", { name: "재고_현황 선택" });
  await stock.focus();
  await page.keyboard.press("Space");
  await expect(stock).toBeChecked();
  await page.keyboard.press("Space");
  await expect(stock).not.toBeChecked();
  await page
    .locator(".source-option")
    .filter({ hasText: "APS_생산계획" })
    .getByText("APS_생산계획", { exact: true })
    .click();
  await expect(
    page.getByRole("checkbox", { name: "APS_생산계획 선택" }),
  ).not.toBeChecked();
  await page
    .locator(".source-option")
    .filter({ hasText: "APS_생산계획" })
    .getByText("APS_생산계획", { exact: true })
    .click();
  await expect(
    page.getByRole("checkbox", { name: "APS_생산계획 선택" }),
  ).toBeChecked();
  await page.getByRole("button", { name: "다음: 차트 · 시각화" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "데이터 검증",
  );
  await page.getByRole("button", { name: "데이터 검증", exact: true }).click();
  await page.getByRole("button", { name: "다음: 차트 · 시각화" }).click();
  await page.getByRole("button", { name: "월별 추이", exact: true }).click();
  await page.getByRole("button", { name: "다음: 인사이트" }).click();
  await expect(page.getByText("인사이트 예시", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "다음: 게시 · 공유" }).click();
  await page.getByRole("button", { name: "분석 게시하기" }).click();
  await expect(
    page.getByRole("heading", { name: "E2E 생산 분석", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /나의 분석/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "E2E 생산 분석", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /E2E 생산 분석 원자재/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".detail-content .chart-1")).toBeVisible();
});

test("CSV parsing, invalid file guard and preview", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "새 분석 만들기" }).click();
  await page.getByRole("textbox", { name: /분석 이름/ }).fill("CSV 분석");
  await page.getByRole("button", { name: "다음: 데이터 준비" }).click();
  await page.getByRole("button", { name: "CSV 업로드", exact: true }).click();
  const input = page.locator("input[type=file]");
  await input.setInputFiles({
    name: "invalid.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("name,value\nonlyone"),
  });
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "열 개수가 일치하는",
  );
  await input.setInputFiles({
    name: "production.csv",
    mimeType: "text/csv",
    buffer: Buffer.from('\uFEFF제품,수량\r\n"동, 합금",120\r\n전기동,240'),
  });
  await expect(page.locator(".uploaded-file")).toContainText("production.csv");
  await expect(page.getByRole("cell", { name: "동, 합금" })).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "제품", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "데이터 검증", exact: true }).click();
  await expect(page.getByText(/CSV 열 구조 정상/)).toBeVisible();
  await page.getByRole("button", { name: "다음: 차트 · 시각화" }).click();
  await expect(
    page.getByText("미리보기는 업로드 데이터와 별개인 고정 샘플입니다."),
  ).toBeVisible();
});

test("dataset filtering and actual CSV download", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "데이터 라이브러리" })
    .click();
  await page.getByRole("textbox", { name: "데이터 검색" }).fill("MES");
  await expect(page.locator(".dataset-card")).toHaveCount(1);
  await page.locator(".dataset-card").click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "샘플 CSV 다운로드" }).click();
  expect((await download).suggestedFilename()).toBe("MnM_샘플_생산실적.csv");
});

test("mobile layout, menu, keyboard dialog and no horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "메뉴 열기" }).click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "데이터 라이브러리" })
    .click();
  await expect(
    page.getByRole("heading", { name: "데이터 라이브러리", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "새 분석 만들기" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "새 분석 만들기" }),
  ).toBeFocused();
  expect(errors).toEqual([]);
});
