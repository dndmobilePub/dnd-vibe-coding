export type Column = {
  key: string;
  label: string;
  type: "text" | "number" | "date";
};
export type Row = Record<string, string>;
export type Source = {
  id: string;
  title: string;
  desc: string;
  columns: Column[];
  rows: Row[];
};
export type FilterRule = {
  id: string;
  column: string;
  op: "contains" | "equals" | "gte" | "lte";
  value: string;
};
export type PreparationState = {
  stage: number;
  maxStage: number;
  mode: "ai" | "manual";
  sourceTab: "mart" | "upload" | "recent";
  selected: string[];
  uploaded: Source | null;
  main: string;
  related: string;
  joinType: "LEFT JOIN" | "INNER JOIN";
  keys: { left: string; right: string }[];
  selectedColumns: string[];
  filters: FilterRule[];
  sortColumn: string;
  sortDirection: "asc" | "desc";
  dropMissing: boolean;
  deduplicate: boolean;
  fillValue: string;
  calculation: boolean;
  numerator: string;
  denominator: string;
  aggregateBy: string;
  reviewed: boolean;
  saved: boolean;
  datasetName: string;
  datasetId: string | null;
};
export type SavedDataset = {
  id: string;
  name: string;
  columns: Column[];
  rows: Row[];
  date: string;
  sources: string[];
};

const c = (
  key: string,
  label: string,
  type: Column["type"] = "text",
): Column => ({ key, label, type });
const productionColumns = [
  c("date", "생산일자", "date"),
  c("product_code", "제품코드"),
  c("product_name", "제품명"),
  c("process", "공정"),
  c("planned", "계획수량", "number"),
  c("quantity", "생산수량", "number"),
];
const productionRows = [
  ["2026-09-15", "CU-001", "전기동", "A 공정", "1280", "1250"],
  ["2026-09-15", "CU-002", "동선", "B 공정", "960", "948"],
  ["2026-09-15", "PM-001", "금", "C 공정", "320", "316"],
  ["2026-09-14", "CU-001", "전기동", "A 공정", "1240", "1218"],
  ["2026-09-14", "CU-002", "동선", "B 공정", "980", "964"],
  ["2026-09-14", "CU-002", "동선", "B 공정", "980", "964"],
  ["2026-09-13", "CU-003", "동합금", "", "600", "580"],
].map((values) =>
  Object.fromEntries(productionColumns.map((col, i) => [col.key, values[i]])),
);
export const preparationSources: Source[] = [
  {
    id: "production",
    title: "MES_일별생산실적",
    desc: "제품·공정별 실적 · 결측/중복 포함 샘플",
    columns: productionColumns,
    rows: productionRows,
  },
  {
    id: "plan",
    title: "APS_생산계획",
    desc: "제품별 월간 생산 목표",
    columns: [
      c("product_code", "제품코드"),
      c("target", "월간목표", "number"),
      c("month", "계획월"),
    ],
    rows: [
      { product_code: "CU-001", target: "32000", month: "2026-09" },
      { product_code: "CU-002", target: "24000", month: "2026-09" },
      { product_code: "PM-001", target: "8000", month: "2026-09" },
    ],
  },
  {
    id: "master",
    title: "제품_마스터",
    desc: "제품 분류 및 규격 기준정보",
    columns: [
      c("product_code", "제품코드"),
      c("category", "제품분류"),
      c("spec", "규격"),
    ],
    rows: [
      { product_code: "CU-001", category: "구리", spec: "99.99%" },
      { product_code: "CU-002", category: "구리", spec: "8mm" },
      { product_code: "PM-001", category: "귀금속", spec: "99.99%" },
    ],
  },
  {
    id: "stock",
    title: "재고_현황",
    desc: "제품별 재고·창고 현황",
    columns: [
      c("product_code", "제품코드"),
      c("stock", "재고수량", "number"),
      c("warehouse", "창고"),
    ],
    rows: [
      { product_code: "CU-001", stock: "820", warehouse: "1창고" },
      { product_code: "CU-002", stock: "450", warehouse: "2창고" },
      { product_code: "CU-003", stock: "125", warehouse: "1창고" },
    ],
  },
];
export function createPreparationState(): PreparationState {
  return {
    stage: 0,
    maxStage: 0,
    mode: "ai",
    sourceTab: "mart",
    selected: ["production"],
    uploaded: null,
    main: "production",
    related: "",
    joinType: "LEFT JOIN",
    keys: [{ left: "product_code", right: "product_code" }],
    selectedColumns: productionColumns.map((c) => c.key),
    filters: [],
    sortColumn: "date",
    sortDirection: "desc",
    dropMissing: false,
    deduplicate: false,
    fillValue: "",
    calculation: false,
    numerator: "quantity",
    denominator: "planned",
    aggregateBy: "",
    reviewed: false,
    saved: false,
    datasetName: "",
    datasetId: null,
  };
}
export function sourcesFor(state: PreparationState): Source[] {
  return [...preparationSources, ...(state.uploaded ? [state.uploaded] : [])];
}
export function numberValue(value: string): number {
  return Number(value.replaceAll(",", "").trim());
}
export function inferColumns(headers: string[], rows: string[][]): Column[] {
  return headers.map((label, i) => {
    const values = rows.map((r) => r[i]).filter((v) => v.trim());
    const type =
      values.length && values.every((v) => Number.isFinite(numberValue(v)))
        ? "number"
        : values.length && values.every((v) => /^\d{4}-\d{2}-\d{2}$/.test(v))
          ? "date"
          : "text";
    return c(`csv_${i}`, label, type);
  });
}
export async function parseCSV(file: File): Promise<Source> {
  if (!file.name.toLowerCase().endsWith(".csv"))
    throw new Error("CSV 파일을 선택해주세요.");
  if (file.size > 5 * 1024 * 1024)
    throw new Error("5MB 이하의 CSV 파일을 사용해주세요.");
  const text = (await file.text()).replace(/^\uFEFF/, "");
  const records: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((v) => v.trim())) records.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  row.push(field);
  if (row.some((v) => v.trim())) records.push(row);
  if (
    quoted ||
    records.length < 2 ||
    !records[0].every((v) => v.trim()) ||
    records.some((r) => r.length !== records[0].length)
  )
    throw new Error(
      "헤더와 데이터가 있고 열 개수가 일치하는 CSV를 사용해주세요.",
    );
  if (records.length > 10001)
    throw new Error("브라우저 처리용 CSV는 최대 10,000행까지 지원합니다.");
  const columns = inferColumns(records[0], records.slice(1));
  return {
    id: "uploaded",
    title: file.name,
    desc: "이 브라우저에서 읽은 CSV",
    columns,
    rows: records
      .slice(1)
      .map((r) => Object.fromEntries(columns.map((c, i) => [c.key, r[i]]))),
  };
}
export function evaluatePreparation(state: PreparationState) {
  const all = sourcesFor(state),
    main = all.find(
      (s) => s.id === state.main && state.selected.includes(s.id),
    );
  const related = all.find(
    (s) =>
      s.id === state.related &&
      state.selected.includes(s.id) &&
      s.id !== main?.id,
  );
  if (!main)
    return {
      columns: [] as Column[],
      rows: [] as Row[],
      missing: 0,
      duplicates: 0,
      invalidNumbers: 0,
      joinError: "주 데이터를 선택해주세요.",
      inputRows: 0,
    };
  let rows = main.rows
    .filter((r) =>
      state.filters.every((f) => {
        if (!f.value.trim()) return true;
        const v = r[f.column] || "";
        if (f.op === "contains")
          return v.toLowerCase().includes(f.value.toLowerCase());
        if (f.op === "equals") return v === f.value;
        if (
          !v.trim() ||
          !Number.isFinite(numberValue(v)) ||
          !Number.isFinite(numberValue(f.value))
        )
          return false;
        return f.op === "gte"
          ? numberValue(v) >= numberValue(f.value)
          : numberValue(v) <= numberValue(f.value);
      }),
    )
    .map((r) => ({ ...r }));
  const inputRows = rows.length;
  let columns = main.columns.filter((c) =>
      state.selectedColumns.includes(c.key),
    ),
    joinError = "";
  if (related) {
    if (
      !state.keys.length ||
      state.keys.some(
        (k) =>
          !main.columns.some((c) => c.key === k.left) ||
          !related.columns.some((c) => c.key === k.right),
      )
    )
      joinError = "양쪽 데이터에 존재하는 연결 키를 선택해주세요.";
    else {
      const rightColumns = related.columns
        .filter((c) => !state.keys.some((k) => k.right === c.key))
        .map((c) => ({
          ...c,
          key: `${related.id}_${c.key}`,
          label: `${c.label} (${related.title})`,
        }));
      const index = new Map<string, Row[]>();
      for (const r of related.rows) {
        if (state.keys.some((k) => !r[k.right]?.trim())) continue;
        const key = JSON.stringify(state.keys.map((k) => r[k.right]));
        index.set(key, [...(index.get(key) || []), r]);
      }
      rows = rows.flatMap((left) => {
        const key = JSON.stringify(state.keys.map((k) => left[k.left]));
        const matches = state.keys.some((k) => !left[k.left]?.trim())
          ? []
          : index.get(key) || [];
        return (
          matches.length
            ? matches
            : state.joinType === "LEFT JOIN"
              ? [null]
              : []
        ).map((right) => ({
          ...left,
          ...Object.fromEntries(
            rightColumns.map((c) => [
              c.key,
              right?.[c.key.slice(related.id.length + 1)] || "",
            ]),
          ),
        }));
      });
      columns = [...columns, ...rightColumns];
    }
  }
  rows = rows.map((r) =>
    Object.fromEntries(columns.map((c) => [c.key, r[c.key] || ""])),
  );
  if (state.dropMissing)
    rows = rows.filter((r) => columns.every((c) => r[c.key].trim()));
  if (state.fillValue.trim())
    rows = rows.map((r) =>
      Object.fromEntries(
        columns.map((c) => [
          c.key,
          r[c.key].trim() ? r[c.key] : state.fillValue.trim(),
        ]),
      ),
    );
  if (state.deduplicate) {
    const seen = new Set<string>();
    rows = rows.filter((r) => {
      const key = JSON.stringify(columns.map((c) => r[c.key]));
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  if (
    state.calculation &&
    columns.some((c) => c.key === state.numerator && c.type === "number") &&
    columns.some((c) => c.key === state.denominator && c.type === "number")
  ) {
    rows = rows.map((r) => ({
      ...r,
      calculated_rate:
        r[state.numerator].trim() &&
        r[state.denominator].trim() &&
        numberValue(r[state.denominator]) !== 0
          ? String(
              Math.round(
                (numberValue(r[state.numerator]) /
                  numberValue(r[state.denominator])) *
                  10000,
              ) / 100,
            )
          : "",
    }));
    columns = [...columns, c("calculated_rate", "달성률 (%)", "number")];
  }
  const beforeAggregateInvalid = rows.reduce(
    (n, r) =>
      n +
      columns.filter(
        (c) =>
          c.type === "number" &&
          r[c.key].trim() &&
          !Number.isFinite(numberValue(r[c.key])),
      ).length,
    0,
  );
  if (state.calculation && !columns.some((c) => c.key === "calculated_rate"))
    joinError = "계산열의 분자와 분모로 숫자 컬럼을 선택해주세요.";
  if (state.aggregateBy && columns.some((c) => c.key === state.aggregateBy)) {
    const groupCol = columns.find((c) => c.key === state.aggregateBy)!;
    const numericCols = columns.filter(
      (c) =>
        c.type === "number" &&
        c.key !== state.aggregateBy &&
        c.key !== "calculated_rate",
    );
    const groups = new Map<string, Row[]>();
    for (const r of rows) {
      const key = r[state.aggregateBy];
      groups.set(key, [...(groups.get(key) || []), r]);
    }
    rows = [...groups].map(([key, group]) =>
      Object.fromEntries([
        [state.aggregateBy, key],
        ["row_count", String(group.length)],
        ...numericCols.map((c) => [
          c.key,
          String(
            group.reduce(
              (sum, r) =>
                sum +
                (r[c.key].trim() && Number.isFinite(numberValue(r[c.key]))
                  ? numberValue(r[c.key])
                  : 0),
              0,
            ),
          ),
        ]),
      ]),
    );
    columns = [
      groupCol,
      c("row_count", "집계 행 수", "number"),
      ...numericCols,
    ];
  }
  if (state.sortColumn && columns.some((c) => c.key === state.sortColumn)) {
    const col = columns.find((c) => c.key === state.sortColumn)!;
    rows.sort((a, b) => {
      const diff =
        col.type === "number"
          ? numberValue(a[col.key]) - numberValue(b[col.key])
          : a[col.key].localeCompare(b[col.key], "ko");
      return state.sortDirection === "asc" ? diff : -diff;
    });
  }
  const missing = rows.reduce(
      (n, r) => n + columns.filter((c) => !r[c.key].trim()).length,
      0,
    ),
    invalidNumbers = Math.max(
      beforeAggregateInvalid,
      rows.reduce(
        (n, r) =>
          n +
          columns.filter(
            (c) =>
              c.type === "number" &&
              r[c.key].trim() &&
              !Number.isFinite(numberValue(r[c.key])),
          ).length,
        0,
      ),
    );
  const duplicates =
    rows.length -
    new Set(rows.map((r) => JSON.stringify(columns.map((c) => r[c.key])))).size;
  return {
    columns,
    rows,
    missing,
    duplicates,
    invalidNumbers,
    joinError,
    inputRows,
  };
}
export function downloadDataset(
  dataset: Pick<SavedDataset, "name" | "columns" | "rows">,
) {
  const quote = (v: string) => '"' + v.replaceAll('"', '""') + '"';
  const text =
    "\uFEFF" +
    [
      dataset.columns.map((c) => quote(c.label)).join(","),
      ...dataset.rows.map((r) =>
        dataset.columns.map((c) => quote(r[c.key] || "")).join(","),
      ),
    ].join("\r\n");
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = dataset.name.replace(/[^\p{L}\p{N}_-]/gu, "_") + ".csv";
  a.click();
  URL.revokeObjectURL(url);
}
