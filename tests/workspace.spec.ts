import { expect, test } from "@playwright/test";

test("home, search, favorites and local persistence", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /안녕하세요/ })).toBeVisible();
  await page
    .getByRole("button", { name: "월별 원자재 수급 현황 즐겨찾기 추가" })
    .click();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "즐겨찾기" })
    .click();
  await expect(
    page.getByRole("heading", { name: "월별 원자재 수급 현황" }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "즐겨찾기" })
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

test("six-stage data preparation, joins, cleanup, validation and publication", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "새 분석 만들기" }).click();
  await page
    .getByRole("button", { name: "다음: 데이터 준비", exact: true })
    .click();
  await expect(page.locator(".analysis-editor").getByRole("alert")).toHaveText(
    "분석 이름을 입력해주세요.",
  );
  await page.getByRole("textbox", { name: /분석 이름/ }).fill("E2E 생산 분석");
  await page
    .getByRole("button", { name: "다음: 데이터 준비", exact: true })
    .click();
  await expect(page.locator(".preparation-stages li")).toHaveCount(6);
  await page.getByRole("button", { name: "추천 적용", exact: true }).click();
  await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(2);
  const stock = page.getByRole("checkbox", { name: "재고_현황 선택" });
  await stock.focus();
  await page.keyboard.press("Space");
  await expect(stock).toBeChecked();
  await page.keyboard.press("Space");
  await expect(stock).not.toBeChecked();
  const master = page.getByRole("checkbox", { name: "제품_마스터 선택" });
  await page
    .locator(".source-option")
    .getByText("제품_마스터", { exact: true })
    .click();
  await expect(master).not.toBeChecked();
  await page
    .locator(".source-option")
    .getByText("제품_마스터", { exact: true })
    .click();
  await expect(master).toBeChecked();
  // Reapply the recommended connection after changing the source selection.
  await page.getByRole("button", { name: "추천 적용", exact: true }).click();
  await page
    .getByRole("button", { name: "다음: 차트 · 시각화", exact: true })
    .click();
  await expect(page.locator(".analysis-editor").getByRole("alert")).toContainText(
    "6단계",
  );
  await page
    .getByRole("button", { name: "다음: 데이터 조회", exact: true })
    .click();
  await expect(
    page.getByRole("checkbox", { name: "생산수량 컬럼 선택" }),
  ).toBeChecked();
  await page
    .getByRole("button", { name: "다음: 데이터 연결", exact: true })
    .click();
  await expect(page.locator(".table-pagination")).toContainText("총 7행");
  await page
    .getByLabel("조인 유형", { exact: true })
    .selectOption("INNER JOIN");
  await expect(page.locator(".table-pagination")).toContainText("총 6행");
  await page.getByLabel("조인 유형", { exact: true }).selectOption("LEFT JOIN");
  await page
    .getByRole("button", { name: "다음: 데이터 전처리", exact: true })
    .click();
  await page.getByRole("checkbox", { name: "결측값 포함 행 제외" }).check();
  await page.getByRole("checkbox", { name: "중복 행 제거" }).check();
  await page.getByRole("checkbox", { name: "달성률 계산열 추가" }).check();
  await expect(
    page.getByRole("columnheader", { name: /달성률/ }),
  ).toBeVisible();
  await expect(page.locator(".table-pagination")).toContainText("총 5행");
  await page
    .getByRole("button", { name: "다음: 결과 보기", exact: true })
    .click();
  await expect(
    page.locator(".quality-grid > div").filter({ hasText: "결측 셀" }),
  ).toHaveText("결측 셀0");
  await expect(
    page.locator(".quality-grid > div").filter({ hasText: "중복 행" }),
  ).toHaveText("중복 행0");
  await page
    .getByRole("button", { name: "다음: 데이터셋 저장", exact: true })
    .click();
  await expect(page.locator(".preparation").getByRole("alert")).toContainText(
    "검증",
  );
  await page.getByRole("button", { name: "데이터 검증", exact: true }).click();
  await page
    .getByRole("button", { name: "다음: 데이터셋 저장", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "데이터셋 이름" })
    .fill("E2E 준비 데이터");
  await page
    .locator(".save-dataset-actions")
    .getByRole("button", { name: "데이터셋 저장", exact: true })
    .click();
  await expect(
    page.getByText("데이터셋 저장 완료", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "다음: 차트 · 시각화", exact: true })
    .click();
  await page.getByRole("button", { name: "월별 추이", exact: true }).click();
  await page
    .getByRole("button", { name: "다음: 인사이트", exact: true })
    .click();
  await page
    .getByRole("button", { name: "다음: 게시 · 공유", exact: true })
    .click();
  await page
    .getByRole("button", { name: "분석 게시하기", exact: true })
    .click();
  await expect(page).toHaveURL(/\/analyses$/);
  await expect(
    page.getByRole("heading", { name: "E2E 생산 분석", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "E2E 생산 분석", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "데이터 라이브러리" })
    .click();
  await page
    .getByRole("heading", { name: "E2E 준비 데이터", exact: true })
    .click();
  await expect(page.locator(".data-preview .table-pagination")).toContainText(
    "총 5행",
  );
  await expect(
    page.getByRole("columnheader", { name: /달성률/ }),
  ).toBeVisible();
});

test("CSV parsing, query filters, numeric sorting and actual result save", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "새 분석 만들기" }).click();
  await page.getByRole("textbox", { name: /분석 이름/ }).fill("CSV 분석");
  await page
    .getByRole("button", { name: "다음: 데이터 준비", exact: true })
    .click();
  await page.getByRole("button", { name: "CSV 업로드", exact: true }).click();
  const input = page.locator("input[type=file]");
  await input.setInputFiles({
    name: "invalid.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("name,value\nonlyone"),
  });
  await expect(page.locator(".preparation").getByRole("alert")).toContainText(
    "열 개수가 일치하는",
  );
  await input.setInputFiles({
    name: "production.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      '\uFEFF제품,수량\r\n"동, 합금",120\r\n전기동,240\r\n금,320',
    ),
  });
  await expect(page.locator(".uploaded-file")).toContainText("production.csv");
  await expect(page.getByRole("cell", { name: "동, 합금" })).toBeVisible();
  await page
    .getByRole("button", { name: "다음: 데이터 조회", exact: true })
    .click();
  await page.getByRole("button", { name: "필터 추가", exact: true }).click();
  await page
    .getByLabel("필터 컬럼", { exact: true })
    .selectOption({ label: "수량" });
  await page.getByLabel("필터 연산자", { exact: true }).selectOption("gte");
  await page.getByLabel("필터 값", { exact: true }).fill("200");
  await page
    .getByLabel("정렬 컬럼", { exact: true })
    .selectOption({ label: "수량" });
  await page.getByLabel("정렬 순서", { exact: true }).selectOption("desc");
  await expect(page.locator(".table-pagination")).toContainText("총 2행");
  await expect(page.locator("tbody tr").first()).toContainText("320");
  await page
    .getByRole("button", { name: "다음: 데이터 연결", exact: true })
    .click();
  await page
    .getByRole("button", { name: "다음: 데이터 전처리", exact: true })
    .click();
  await page
    .getByRole("button", { name: "다음: 결과 보기", exact: true })
    .click();
  await page.getByRole("button", { name: "데이터 검증", exact: true }).click();
  await page
    .getByRole("button", { name: "다음: 데이터셋 저장", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "데이터셋 이름" })
    .fill("CSV 필터 결과");
  await page
    .locator(".save-dataset-actions")
    .getByRole("button", { name: "데이터셋 저장", exact: true })
    .click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "결과 CSV 다운로드", exact: true })
    .click();
  const { readFile } = await import("node:fs/promises");
  const file = await download;
  const content = await readFile((await file.path())!, "utf8");
  expect(content).toContain('"금"');
  expect(content).toContain("320");
  expect(content).not.toContain("120");
  await page.getByRole("button", { name: "분석 목록으로" }).click();
  await page.getByRole("button", { name: "새 분석 만들기" }).click();
  await page.getByRole("textbox", { name: /분석 이름/ }).fill("재사용 분석");
  await page
    .getByRole("button", { name: "다음: 데이터 준비", exact: true })
    .click();
  await page
    .getByRole("button", { name: "최근 사용 데이터", exact: true })
    .click();
  await page
    .locator(".recent-source-card")
    .filter({ hasText: "CSV 필터 결과" })
    .click();
  await expect(
    page.locator(".preparation-preview .table-pagination"),
  ).toContainText("총 2행");
});

test("dataset filtering and actual CSV download", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "데이터 라이브러리" })
    .click();
  await page.getByRole("textbox", { name: "데이터 검색" }).fill("MES");
  await expect(page.locator(".dataset-card")).toHaveCount(1);
  await page.locator(".dataset-card").click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "샘플 CSV 다운로드" }).click();
  expect((await download).suggestedFilename()).toBe("MES_일별생산실적.csv");
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
    .getByRole("link", { name: "데이터 라이브러리" })
    .click();
  await expect(
    page.getByRole("heading", { name: "데이터 라이브러리", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "새 분석 만들기" }).click();
  await expect(page).toHaveURL(/\/analyses\/new/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("textbox", { name: /분석 이름/ })
    .fill("모바일 준비 확인");
  await page
    .getByRole("button", { name: "다음: 데이터 준비", exact: true })
    .click();
  await expect(page.locator(".preparation-stages li")).toHaveCount(6);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "다음: 데이터 조회", exact: true })
    .click();
  await page
    .getByRole("button", { name: "다음: 데이터 연결", exact: true })
    .click();
  await page
    .getByRole("button", { name: "다음: 데이터 전처리", exact: true })
    .click();
  await page.getByRole("checkbox", { name: "중복 행 제거" }).check();
  await page
    .getByRole("button", { name: "다음: 결과 보기", exact: true })
    .click();
  await page.getByRole("button", { name: "데이터 검증", exact: true }).click();
  await expect(page.locator(".validation-success")).toContainText("검증 완료");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".analysis-editor")).toBeVisible();
  await page.getByRole("button", { name: "분석 목록으로" }).click();
  await expect(page).toHaveURL(/\/analyses$/);
  expect(errors).toEqual([]);
});

test("independent URLs, reload, active navigation and browser history", async ({
  page,
}) => {
  const routes = [
    ["/analyses", "나의 분석"],
    ["/data-library", "데이터 라이브러리"],
    ["/reports", "공유 리포트"],
    ["/favorites", "즐겨찾기"],
    ["/settings", "워크스페이스 설정"],
  ];
  for (const [path, title] of routes) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await expect(
      page.locator('.nav-item[aria-current="page"]'),
    ).toHaveAttribute("href", path);
  }
  await page.goto("/analyses");
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "데이터 라이브러리" })
    .click();
  await expect(page).toHaveURL(/\/data-library$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/analyses$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/data-library$/);
});

