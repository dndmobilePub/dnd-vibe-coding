import { expect, test } from "@playwright/test";

import { createPreparationState } from "../lib/data-preparation";

test("draft restores setup and updates the original session", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "새 분석 만들기" }).click();
  await page.getByRole("textbox", { name: /분석 이름/ }).fill("복원 검증");
  await page.getByRole("textbox", { name: "분석 목적" }).fill("원래 목적");
  await page.locator(".analysis-editor").getByRole("button", { name: "임시저장", exact: true }).click();
  await page.reload();
  await page.getByRole("button").filter({ has: page.getByRole("heading", { name: "복원 검증" }) }).click();
  await page.getByRole("button", { name: "이어서 분석하기" }).click();
  await expect(page).toHaveURL(/\/analyses\/new\?session=/);
  await page.reload();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "분석 목적" })).toHaveValue("원래 목적");
  await page.getByRole("textbox", { name: /분석 이름/ }).fill("복원 수정");
  await page.locator(".analysis-editor").getByRole("button", { name: "임시저장", exact: true }).click();
  await expect(page.getByRole("heading", { name: "복원 수정" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "복원 검증" })).toHaveCount(0);
});

test("chart uses prepared rows and restores axis and aggregation", async ({ page }) => {
  const preparation = { ...createPreparationState(), saved: true, reviewed: true, datasetName: "준비 결과" };
  await page.addInitScript((preparation) => {
    localStorage.setItem("mnm-analyses", JSON.stringify([{ id: 100, title: "집계 검증", category: "생산 관리", date: "2026.10.06", status: "임시저장", starred: false, chart: 0, step: 2, preparation, x: "product_code", y: "quantity", aggregation: "sum" }]));
  }, preparation);
  await page.goto("/analyses");
  await page.getByRole("button").filter({ has: page.getByRole("heading", { name: "집계 검증" }) }).click();
  const chart = page.getByRole("dialog").getByRole("img", { name: "준비 데이터 집계 차트" });
  expect(await chart.locator("rect").count()).toBeGreaterThan(0);
  await expect(chart.locator("g")).toHaveCount(await chart.locator("rect").count());
  await page.getByRole("button", { name: "이어서 분석하기" }).click();
  await expect(page.getByLabel("X축", { exact: true })).toHaveValue("product_code");
  await expect(page.getByLabel("Y축", { exact: true })).toHaveValue("quantity");
  await page.getByLabel("집계 방식").selectOption("avg");
  await expect(page.locator(".analysis-editor .result-chart")).toContainText("평균");
});


