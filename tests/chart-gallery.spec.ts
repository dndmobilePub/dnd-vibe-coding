import { expect, test } from "@playwright/test";
import { createPreparationState } from "../lib/data-preparation";

test("eight sample types, recommendations, selection and saved restoration", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(preparation => {
    localStorage.setItem("mnm-analyses", JSON.stringify([{ id: 888, title: "유형 선택 검증", category: "생산 관리", date: "2026.10.06", status: "임시저장", starred: false, chart: 0, step: 2, kind: "추이 모니터링", preparation }]));
  }, { ...createPreparationState(), saved: true });
  await page.goto("/analyses/new?session=888");
  const gallery = page.getByRole("region", { name: "차트 유형 선택" });
  await expect(gallery.getByRole("checkbox")).toHaveCount(8);
  await expect(gallery.locator(".recommended-badge")).toHaveCount(3);
  await gallery.getByRole("button", { name: "전체 선택", exact: true }).click();
  await expect(gallery.locator(".sample-chart-card")).toHaveCount(8);
  await gallery.getByRole("button", { name: "선택 해제", exact: true }).click();
  await expect(gallery.locator(".sample-chart-card")).toHaveCount(0);
  await page.getByRole("button", { name: "다음: 인사이트", exact: true }).click();
  await expect(page.locator(".analysis-editor").getByRole("alert")).toContainText("차트 유형");
  await gallery.getByRole("button", { name: "권장만 선택", exact: true }).click();
  await expect(gallery.getByRole("checkbox", { checked: true })).toHaveCount(3);
  await gallery.getByRole("button", { name: "3열", exact: true }).click();
  await expect(gallery.locator(".sample-chart-grid")).toHaveCSS("grid-template-columns", /\S+ \S+ \S+/);
  await page.locator(".analysis-editor").getByRole("button", { name: "임시저장", exact: true }).click();
  await page.goto("/analyses/new?session=888");
  await expect(page.getByRole("region", { name: "차트 유형 선택" }).getByRole("checkbox", { checked: true })).toHaveCount(3);
});
