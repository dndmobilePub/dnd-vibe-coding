import { expect, test } from "@playwright/test";
import {
  createPreparationState,
  evaluatePreparation,
  parseCSV,
  type PreparationState,
} from "../lib/data-preparation";

test("actual joins, multi-key matching, cleanup, calculated rates and grouping", () => {
  const state: PreparationState = {
    ...createPreparationState(),
    selected: ["production", "master"],
    related: "master",
  };
  const left = evaluatePreparation(state);
  expect(left.rows).toHaveLength(7);
  expect(left.rows[0].master_category).toBe("구리");
  expect(left.rows[6].master_category).toBe("");
  const inner = evaluatePreparation({ ...state, joinType: "INNER JOIN" });
  expect(inner.rows).toHaveLength(6);
  const mismatch = evaluatePreparation({
    ...state,
    joinType: "INNER JOIN",
    keys: [
      { left: "product_code", right: "product_code" },
      { left: "product_name", right: "category" },
    ],
  });
  expect(mismatch.rows).toHaveLength(0);
  const cleaned = evaluatePreparation({
    ...state,
    dropMissing: true,
    deduplicate: true,
    calculation: true,
  });
  expect(cleaned.rows).toHaveLength(5);
  expect(cleaned.missing).toBe(0);
  expect(cleaned.duplicates).toBe(0);
  expect(cleaned.rows[0].calculated_rate).toBe("97.66");
  const grouped = evaluatePreparation({
    ...state,
    dropMissing: true,
    deduplicate: true,
    aggregateBy: "product_name",
  });
  expect(grouped.rows).toHaveLength(3);
  expect(grouped.rows.find((r) => r.product_name === "전기동")?.quantity).toBe(
    "2468",
  );
});

test("CSV header, escaped quotes, multiline values and numeric inference", async () => {
  const source = await parseCSV(
    new File(
      [
        '\uFEFF제품,설명,수량\r\n"동, 합금","첫 줄\n둘째 \"\"줄\"\"",120\r\n전기동,정상,240',
      ],
      "sample.csv",
    ),
  );
  expect(source.rows).toHaveLength(2);
  expect(source.rows[0].csv_0).toBe("동, 합금");
  expect(source.rows[0].csv_1).toBe('첫 줄\n둘째 "줄"');
  expect(source.columns[2].type).toBe("number");
  await expect(
    parseCSV(new File(["제품,수량\n전기동"], "bad.csv")),
  ).rejects.toThrow("열 개수가 일치하는");
});

test("empty filters and invalid calculation settings cannot appear valid", () => {
  const base = createPreparationState();
  expect(
    evaluatePreparation({
      ...base,
      filters: [{ id: "1", column: "quantity", op: "gte", value: "99999" }],
    }).rows,
  ).toHaveLength(0);
  expect(
    evaluatePreparation({ ...base, calculation: true, numerator: "missing" })
      .joinError,
  ).toContain("숫자 컬럼");
  const result = evaluatePreparation({
    ...base,
    related: "master",
    selected: ["production", "master"],
    fillValue: "not a number",
  });
  expect(result.invalidNumbers).toBe(0); // Only text cells were missing in this fixture.
  const uploaded = {
    id: "uploaded",
    title: "numbers",
    desc: "",
    columns: [
      { key: "group", label: "분류", type: "text" as const },
      { key: "value", label: "수량", type: "number" as const },
    ],
    rows: [{ group: "A", value: "" }],
  };
  const invalid = evaluatePreparation({
    ...base,
    uploaded,
    main: "uploaded",
    selected: ["uploaded"],
    selectedColumns: ["group", "value"],
    fillValue: "bad",
    aggregateBy: "group",
  });
  expect(invalid.invalidNumbers).toBe(1);
});
