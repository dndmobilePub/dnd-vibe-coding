"use client";
import { Button } from "./ui/button";
import { Select } from "./select";
import type { ToastVariant } from "./toast";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Database,
  Download,
  FileSpreadsheet,
  Filter,
  Layers,
  Plus,
  Search,
  ShieldCheck,
  Sigma,
  Trash2,
  Upload,
  Workflow,
  X,
} from "lucide-react";
import { Checkbox } from "./checkbox";
import {
  downloadDataset,
  evaluatePreparation,
  parseCSV,
  preparationSources,
  sourcesFor,
  type Column,
  type Row,
  type PreparationState,
  type SavedDataset,
} from "@/lib/data-preparation";

const stages = [
  "데이터 불러오기",
  "데이터 조회",
  "데이터 연결",
  "데이터 전처리",
  "결과 보기",
  "데이터셋 저장",
];
const descriptions = [
  "데이터 마트 또는 CSV에서 분석할 데이터를 선택하세요.",
  "필요한 컬럼과 데이터 범위를 정하고 정렬 기준을 설정하세요.",
  "주 데이터와 연결할 데이터, 조인 키를 직접 설정하세요.",
  "결측값·중복을 처리하고 계산열과 집계 규칙을 적용하세요.",
  "설정이 적용된 결과와 데이터 품질을 확인하세요.",
  "준비된 데이터셋을 저장하고 다음 분석 단계로 이어가세요.",
];

export function DatasetTable({
  columns,
  rows,
  pageSize = 5,
}: {
  columns: Column[];
  rows: Row[];
  pageSize?: number;
}) {
  const [page, setPage] = useState(0);
  const last = Math.max(0, Math.ceil(rows.length / pageSize) - 1);
  const current = Math.min(page, last);
  return (
    <>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>
                  <span className="column-type">
                    {c.type === "number" ? "#" : c.type === "date" ? "▦" : "Aa"}
                  </span>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows
              .slice(current * pageSize, (current + 1) * pageSize)
              .map((r, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c.key}>
                      {r[c.key] || <span className="null-value">결측</span>}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <div className="table-empty">현재 설정에 맞는 데이터가 없습니다.</div>
      )}
      <div className="table-pagination">
        <span>
          총 {rows.length.toLocaleString()}행 · {columns.length}열
        </span>
        <div>
          <button
            aria-label="이전 데이터 페이지"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            이전
          </button>
          <span>
            {current + 1} / {last + 1}
          </span>
          <button
            aria-label="다음 데이터 페이지"
            disabled={current === last}
            onClick={() => setPage(current + 1)}
          >
            다음
          </button>
        </div>
      </div>
    </>
  );
}

export function DataPreparation({
  state,
  onChange,
  onSave,
  onNotify,
}: {
  state: PreparationState;
  onChange: (next: PreparationState) => void;
  onSave: (dataset: SavedDataset) => void;
  onNotify: (message: string, variant?: ToastVariant) => void;
}) {
  const [search, setSearch] = useState("");
  const setError = (message: string) => { if (message) onNotify(message, "error"); };
  const [recent, setRecent] = useState<SavedDataset[]>([]);
  const [busy, setBusy] = useState(false);
  const requestId = useRef(0);
  const rootRef = useRef<HTMLElement>(null);
  useEffect(
    () => () => {
      requestId.current++;
    },
    [],
  );
  useEffect(() => {
    rootRef.current
      ?.querySelector<HTMLElement>(".preparation-layout")
      ?.scrollTo({ top: 0 });
    rootRef.current
      ?.querySelector<HTMLElement>(".preparation-heading h3")
      ?.focus({ preventScroll: true });
  }, [state.stage]);
  const all = sourcesFor(state);
  const main = all.find((s) => s.id === state.main);
  const related = all.find((s) => s.id === state.related);
  const result = useMemo(() => evaluatePreparation(state), [state]);
  const numeric = result.columns.filter((c) => c.type === "number");
  const update = (patch: Partial<PreparationState>, dataChange = true) => {
    onChange({
      ...state,
      ...patch,
      ...(dataChange ? { saved: false, reviewed: false } : {}),
    });
    setError("");
  };
  const switchMain = (id: string, selected = state.selected) => {
    const source = all.find((s) => s.id === id);
    if (!source) return;
    update({
      main: id,
      selected,
      selectedColumns: source.columns.map((c) => c.key),
      filters: [],
      sortColumn: source.columns[0]?.key || "",
      related: state.related === id ? "" : state.related,
      aggregateBy: "",
      calculation: false,
    });
  };
  const toggle = (id: string) => {
    const selected = state.selected.includes(id)
      ? state.selected.filter((s) => s !== id)
      : [...state.selected, id];
    if (!selected.includes(state.main) && selected.length)
      switchMain(selected[0], selected);
    else
      update({
        selected,
        related: selected.includes(state.related) ? state.related : "",
      });
  };
  const recommend = () => {
    update({
      selected: ["production", "master"],
      main: "production",
      related: "master",
      selectedColumns: preparationSources[0].columns.map((c) => c.key),
      keys: [{ left: "product_code", right: "product_code" }],
      joinType: "LEFT JOIN",
      sourceTab: "mart",
      filters: [],
      sortColumn: "date",
      calculation: false,
      aggregateBy: "",
    });
  };
  const setTab = (sourceTab: PreparationState["sourceTab"]) => {
    update({ sourceTab }, false);
    if (sourceTab === "recent") {
      try {
        const stored = JSON.parse(
          localStorage.getItem("mnm-prepared-datasets") || "[]",
        );
        setRecent(
          Array.isArray(stored)
            ? stored.filter(
                (d) =>
                  typeof d.name === "string" &&
                  Array.isArray(d.columns) &&
                  Array.isArray(d.rows),
              )
            : [],
        );
      } catch {
        setRecent([]);
      }
    }
  };
  const readFile = async (file?: File) => {
    if (!file) return;
    const id = ++requestId.current;
    setBusy(true);
    setError("");
    try {
      const uploaded = await parseCSV(file);
      if (id !== requestId.current) return;
      onChange({
        ...state,
        uploaded,
        selected: [
          ...state.selected.filter((s) => s !== "uploaded"),
          "uploaded",
        ],
        main: "uploaded",
        related: "",
        selectedColumns: uploaded.columns.map((c) => c.key),
        filters: [],
        sortColumn: uploaded.columns[0]?.key || "",
        calculation: false,
        aggregateBy: "",
        reviewed: false,
        saved: false,
      });
    } catch (e) {
      if (id === requestId.current)
        setError(e instanceof Error ? e.message : "파일을 읽을 수 없습니다.");
    } finally {
      if (id === requestId.current) setBusy(false);
    }
  };
  const goNext = () => {
    if (!state.selected.length || !state.selected.includes(state.main)) {
      setError("데이터를 하나 이상 선택해주세요.");
      return;
    }
    if (!state.selectedColumns.length) {
      setError("조회할 컬럼을 하나 이상 선택해주세요.");
      return;
    }
    if (state.stage === 2 && result.joinError) {
      setError(result.joinError);
      return;
    }
    if (state.stage === 4 && !state.reviewed) {
      setError("");
      onNotify("데이터 품질 검증을 실행해주세요.");
      return;
    }
    update(
      {
        stage: Math.min(state.stage + 1, 5),
        maxStage: Math.max(state.maxStage, state.stage + 1),
      },
      false,
    );
  };
  const validate = () => {
    if (
      result.joinError ||
      !result.rows.length ||
      !result.columns.length ||
      result.invalidNumbers
    ) {
      setError("");
      onNotify(
        result.joinError ||
          "결과가 비어 있거나 숫자 형식 오류가 있습니다. 조회·전처리 설정을 수정해주세요.",
      );
      return;
    }
    update({ reviewed: true }, false);
    onNotify(
      `검증 완료 · ${result.missing || result.duplicates ? `결측 셀 ${result.missing}개, 중복 행 ${result.duplicates}개를 확인해주세요. 전처리하거나 원본 상태로 저장할 수 있습니다.` : "데이터 품질 정상"}`,
      "success",
    );
  };
  const save = () => {
    if (
      !state.reviewed ||
      result.joinError ||
      !result.rows.length ||
      !result.columns.length
    ) {
      setError("");
      onNotify("결과 보기에서 데이터 품질을 검증해주세요.");
      return;
    }
    if (!state.datasetName.trim()) {
      setError("데이터셋 이름을 입력해주세요.");
      return;
    }
    const dataset: SavedDataset = {
      id: state.datasetId || `prepared-${Date.now()}`,
      name: state.datasetName.trim(),
      columns: result.columns,
      rows: result.rows,
      date: new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(
        new Date(),
      ),
      sources: [main?.title || "", ...(related ? [related.title] : [])],
    };
    try {
      const previous = JSON.parse(
        localStorage.getItem("mnm-prepared-datasets") || "[]",
      );
      if (!Array.isArray(previous)) throw new Error();
      localStorage.setItem(
        "mnm-prepared-datasets",
        JSON.stringify([
          dataset,
          ...previous.filter((d) => d.id !== dataset.id),
        ]),
      );
      onChange({ ...state, saved: true, datasetId: dataset.id });
      onSave(dataset);
      onNotify("데이터셋을 저장했습니다. 다음 버튼으로 차트 단계로 이동하세요.", "success");
      setError("");
    } catch {
      setError(
        "브라우저 저장 공간이 부족하거나 사용할 수 없습니다. 데이터를 줄이거나 CSV로 내려받아 보관해주세요.",
      );
    }
  };
  const tools = [
    { icon: Database, label: "데이터 소스", stage: 0 },
    { icon: Layers, label: "컬럼 · 필터 · 정렬", stage: 1 },
    { icon: Workflow, label: "조인 · 연결 키", stage: 2 },
    { icon: Sigma, label: "결측 · 중복 · 집계", stage: 3 },
    { icon: ShieldCheck, label: "결과 · 품질 확인", stage: 4 },
    { icon: FileSpreadsheet, label: "데이터셋 저장", stage: 5 },
  ];
  return (
    <section
      ref={rootRef}
      className="preparation"
      aria-label="데이터 준비 작업"
    >
      <div className="preparation-progress">
        <div>
          <strong className="sr-only">데이터 준비</strong>
          <span>{state.saved ? 6 : state.stage} / 6 완료</span>
          <span className="preparation-progress-track" role="progressbar" aria-label="데이터 준비 완료 진행률" aria-valuemin={0} aria-valuemax={6} aria-valuenow={state.saved ? 6 : state.stage}>
            <i
              style={{
                transform: `scaleX(${(state.saved ? 6 : state.stage) / 6})`,
              }}
            />
          </span>
        </div>
      <div className="preparation-header-actions">
        <span>
          {state.selected.length}개 소스 선택
        </span>
        <div>
          {state.stage > 0 && (
            <Button
              variant="secondary"
              onClick={() => update({ stage: state.stage - 1 }, false)}
            >
              이전 준비 단계
            </Button>
          )}
          {state.stage === 4 && (
            <Button variant="secondary" onClick={validate}>
              데이터 검증
              <ShieldCheck size={16} />
            </Button>
          )}
          {state.stage < 5 && (
            <Button variant="primary" disabled={busy} onClick={goNext}>
              다음: {stages[state.stage + 1]}
              <ArrowRight size={15} />
            </Button>
          )}
        </div>
      </div>
      </div>
      <ol className="preparation-stages">
        {stages.map((s, i) => (
          <li key={s}>
            <button
              disabled={i > state.maxStage}
              onClick={() => update({ stage: i }, false)}
              className={
                state.stage === i
                  ? "current"
                  : state.maxStage > i
                    ? "completed"
                    : ""
              }
              aria-current={state.stage === i ? "step" : undefined}
            >
              <span>
                {state.maxStage > i || state.saved ? (
                  <Check size={12} />
                ) : (
                  i + 1
                )}
              </span>
              {s}
            </button>
            {i < 5 && <ChevronRight size={13} />}
          </li>
        ))}
      </ol>
      <div className="preparation-heading sr-only">
        <h3 tabIndex={-1}>{stages[state.stage]}</h3>
        <p>{descriptions[state.stage]}</p>
      </div>
      <div className="preparation-layout">
        <aside className="preparation-tools">
          <div className="nav-label">데이터 도구</div>
          {tools.map(({ icon: Icon, label, stage }) => (
            <button
              key={label}
              disabled={stage > state.maxStage}
              className={state.stage === stage ? "active" : ""}
              onClick={() => update({ stage }, false)}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
          <div className="preparation-source-summary">
            <span>선택한 데이터</span>
            {state.selected.map((id) => (
              <div key={id}>
                <Database size={13} />
                {all.find((s) => s.id === id)?.title}
              </div>
            ))}
          </div>
        </aside>
        <div className="preparation-content" key={state.stage}>
          {state.stage === 0 && (
            <>
              <div className="filter-tabs">
                {[
                  { id: "mart" as const, label: "데이터 마트" },
                  { id: "upload" as const, label: "CSV 업로드" },
                  { id: "recent" as const, label: "최근 사용 데이터" },
                ].map((t) => (
                  <button
                    key={t.id}
                    className={state.sourceTab === t.id ? "selected" : ""}
                    onClick={() => setTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {state.sourceTab === "mart" ? (
                <>
                  <label className="search-input preparation-search">
                    <Search size={17} />
                    <input
                      aria-label="준비 데이터 검색"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="데이터셋 이름 또는 업무로 검색"
                    />
                  </label>
                  <div className="source-list">
                    {preparationSources
                      .filter((d) => `${d.title} ${d.desc}`.includes(search))
                      .map((d) => (
                        <label
                          key={d.id}
                          className={`source-option ${state.selected.includes(d.id) ? "checked" : ""}`}
                        >
                          <Checkbox
                            aria-label={`${d.title} 선택`}
                            checked={state.selected.includes(d.id)}
                            onCheckedChange={() => toggle(d.id)}
                          />
                          <span className="stat-icon blue">
                            <Database size={18} />
                          </span>
                          <span>
                            <strong>{d.title}</strong>
                            <small>{d.desc}</small>
                            <small>
                              실제 샘플 {d.rows.length}행 · {d.columns.length}열
                            </small>
                          </span>
                        </label>
                      ))}
                  </div>
                  {!preparationSources.some((d) =>
                    `${d.title} ${d.desc}`.includes(search),
                  ) && <div className="table-empty">검색 결과가 없습니다.</div>}
                </>
              ) : state.sourceTab === "upload" ? (
                <div
                  className="upload-panel"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    void readFile(e.dataTransfer.files[0]);
                  }}
                >
                  <Upload size={30} />
                  <h4>CSV를 놓거나 파일을 선택하세요</h4>
                  <p>
                    UTF-8 · 최대 5MB / 10,000행
                    <br />
                    파일은 서버로 전송되지 않습니다.
                  </p>
                  <label className="button secondary upload-label">
                    {busy ? "파일 읽는 중…" : "파일 선택"}
                    <input
                      disabled={busy}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={(e) => {
                        void readFile(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {state.uploaded && (
                    <div className="uploaded-file">
                      <FileSpreadsheet size={17} />
                      <span>{state.uploaded.title}</span>
                      <small>
                        {state.uploaded.rows.length}행 ·{" "}
                        {state.uploaded.columns.length}열
                      </small>
                    </div>
                  )}
                </div>
              ) : (
                <div className="recent-source-list">
                  {recent.length ? (
                    recent.map((d) => (
                      <button
                        key={d.id}
                        className="recent-source-card"
                        onClick={() => {
                          const uploaded = {
                            id: "uploaded",
                            title: d.name,
                            desc: "최근 저장한 데이터셋",
                            columns: d.columns,
                            rows: d.rows,
                          };
                          update({
                            uploaded,
                            selected: ["uploaded"],
                            main: "uploaded",
                            related: "",
                            selectedColumns: d.columns.map((c) => c.key),
                            filters: [],
                            sortColumn: d.columns[0]?.key || "",
                            calculation: false,
                            aggregateBy: "",
                          });
                        }}
                      >
                        <Database size={20} />
                        <span>
                          <strong>{d.name}</strong>
                          <small>
                            {d.rows.length}행 · {d.date}
                          </small>
                        </span>
                        <Plus size={16} />
                      </button>
                    ))
                  ) : (
                    <div className="table-empty">
                      저장한 데이터셋이 아직 없습니다.
                    </div>
                  )}
                </div>
              )}
              <div className="selected-source-chips">
                {state.selected.map((id) => (
                  <button key={id} onClick={() => toggle(id)}>
                    {all.find((s) => s.id === id)?.title}
                    <X size={13} />
                    <span className="sr-only">선택 해제</span>
                  </button>
                ))}
              </div>
              {main && state.selected.includes(main.id) && (
                <div className="preparation-preview">
                  <h4>{main.title} 미리보기</h4>
                  <DatasetTable columns={main.columns} rows={main.rows} />
                </div>
              )}
            </>
          )}
          {state.stage === 1 && (
            <>
              <label className="field">
                주 데이터
                <Select
                  aria-label="조회할 주 데이터"
                  value={state.main}
                  onChange={(e) => switchMain(e.target.value)}
                >
                  {all
                    .filter((s) => state.selected.includes(s.id))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                </Select>
              </label>
              <section className="column-selection">
                <div className="section-heading">
                  <h4>
                    조회할 컬럼{" "}
                    <span className="count-pill">
                      {state.selectedColumns.length}
                    </span>
                  </h4>
                  <button
                    className="text-button"
                    onClick={() =>
                      update({
                        selectedColumns: main?.columns.map((c) => c.key) || [],
                      })
                    }
                  >
                    모두 선택
                  </button>
                </div>
                <div className="column-options">
                  {main?.columns.map((c) => (
                    <label key={c.key}>
                      <Checkbox
                        aria-label={`${c.label} 컬럼 선택`}
                        checked={state.selectedColumns.includes(c.key)}
                        onCheckedChange={() =>
                          update({
                            selectedColumns: state.selectedColumns.includes(
                              c.key,
                            )
                              ? state.selectedColumns.filter((k) => k !== c.key)
                              : [...state.selectedColumns, c.key],
                          })
                        }
                      />
                      {c.label}
                      <span>
                        {c.type === "number"
                          ? "숫자"
                          : c.type === "date"
                            ? "날짜"
                            : "텍스트"}
                      </span>
                    </label>
                  ))}
                </div>
              </section>
              <section className="filter-editor">
                <div className="section-heading">
                  <h4>
                    <Filter size={15} />
                    조회 조건
                  </h4>
                  <button
                    className="text-button"
                    onClick={() =>
                      update({
                        filters: [
                          ...state.filters,
                          {
                            id: crypto.randomUUID(),
                            column: main?.columns[0]?.key || "",
                            op: "contains",
                            value: "",
                          },
                        ],
                      })
                    }
                  >
                    <Plus size={14} />
                    필터 추가
                  </button>
                </div>
                {state.filters.map((f) => (
                  <div className="filter-rule" key={f.id}>
                    <Select
                      aria-label="필터 컬럼"
                      value={f.column}
                      onChange={(e) =>
                        update({
                          filters: state.filters.map((r) =>
                            r.id === f.id
                              ? { ...r, column: e.target.value }
                              : r,
                          ),
                        })
                      }
                    >
                      {main?.columns.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.label}
                        </option>
                      ))}
                    </Select>
                    <Select
                      aria-label="필터 연산자"
                      value={f.op}
                      onChange={(e) =>
                        update({
                          filters: state.filters.map((r) =>
                            r.id === f.id
                              ? { ...r, op: e.target.value as typeof f.op }
                              : r,
                          ),
                        })
                      }
                    >
                      <option value="contains">포함</option>
                      <option value="equals">같음</option>
                      <option value="gte">이상 (숫자)</option>
                      <option value="lte">이하 (숫자)</option>
                    </Select>
                    <input
                      aria-label="필터 값"
                      placeholder="값 입력"
                      value={f.value}
                      onChange={(e) =>
                        update({
                          filters: state.filters.map((r) =>
                            r.id === f.id ? { ...r, value: e.target.value } : r,
                          ),
                        })
                      }
                    />
                    <button
                      className="icon-button"
                      aria-label="필터 삭제"
                      onClick={() =>
                        update({
                          filters: state.filters.filter((r) => r.id !== f.id),
                        })
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {!state.filters.length && (
                  <p className="preparation-hint">
                    조건 없이 모든 행을 조회합니다. 여러 필터는 AND로
                    적용됩니다.
                  </p>
                )}
              </section>
              <div className="form-grid">
                <label className="field">
                  정렬 컬럼
                  <Select
                    aria-label="정렬 컬럼"
                    value={state.sortColumn}
                    onChange={(e) => update({ sortColumn: e.target.value })}
                  >
                    <option value="">정렬 없음</option>
                    {main?.columns.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="field">
                  정렬 순서
                  <Select
                    aria-label="정렬 순서"
                    value={state.sortDirection}
                    onChange={(e) =>
                      update({
                        sortDirection: e.target.value as "asc" | "desc",
                      })
                    }
                  >
                    <option value="asc">오름차순</option>
                    <option value="desc">내림차순</option>
                  </Select>
                </label>
              </div>
              <DatasetTable columns={result.columns} rows={result.rows} />
            </>
          )}
          {state.stage === 2 && (
            <>
              <div className="join-canvas">
                <div>
                  <Database size={22} />
                  <strong>{main?.title}</strong>
                  <small>주 데이터</small>
                </div>
                <ArrowRight size={20} />
                <div className="join-node">
                  <Workflow size={22} />
                  <strong>{state.joinType}</strong>
                  <small>
                    {state.keys
                      .map(
                        (k) =>
                          `${main?.columns.find((c) => c.key === k.left)?.label || "?"} = ${related?.columns.find((c) => c.key === k.right)?.label || "?"}`,
                      )
                      .join(" · ")}
                  </small>
                </div>
                <ArrowRight size={20} />
                <div>
                  <Database size={22} />
                  <strong>{related?.title || "연결 없음"}</strong>
                  <small>
                    {related ? "연결 데이터" : "단일 데이터로 진행 가능"}
                  </small>
                </div>
              </div>
              <div className="form-grid">
                <label className="field">
                  주 데이터
                  <Select
                    aria-label="연결 주 데이터"
                    value={state.main}
                    onChange={(e) => switchMain(e.target.value)}
                  >
                    {all
                      .filter((s) => state.selected.includes(s.id))
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                  </Select>
                </label>
                <label className="field">
                  연결할 데이터
                  <Select
                    aria-label="연결할 데이터"
                    value={state.related}
                    onChange={(e) => {
                      const source = all.find((s) => s.id === e.target.value);
                      const matching = main?.columns.find((c) =>
                        source?.columns.some((r) => r.key === c.key),
                      );
                      update({
                        related: e.target.value,
                        keys: [
                          {
                            left: matching?.key || main?.columns[0]?.key || "",
                            right:
                              matching?.key || source?.columns[0]?.key || "",
                          },
                        ],
                      });
                    }}
                  >
                    <option value="">연결하지 않음</option>
                    {all
                      .filter(
                        (s) =>
                          state.selected.includes(s.id) && s.id !== state.main,
                      )
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                  </Select>
                </label>
              </div>
              {related && (
                <>
                  <label className="field">
                    조인 유형
                    <Select
                      aria-label="조인 유형"
                      value={state.joinType}
                      onChange={(e) =>
                        update({
                          joinType: e.target
                            .value as PreparationState["joinType"],
                        })
                      }
                    >
                      <option>LEFT JOIN</option>
                      <option>INNER JOIN</option>
                    </Select>
                    <small>
                      LEFT는 주 데이터의 모든 행을 유지하고, INNER는 키가
                      일치하는 행만 남깁니다.
                    </small>
                  </label>
                  <div className="section-heading">
                    <h4>연결 키</h4>
                    <button
                      className="text-button"
                      onClick={() =>
                        update({
                          keys: [
                            ...state.keys,
                            {
                              left: main?.columns[0]?.key || "",
                              right: related.columns[0]?.key || "",
                            },
                          ],
                        })
                      }
                    >
                      <Plus size={14} />키 추가
                    </button>
                  </div>
                  {state.keys.map((k, i) => (
                    <div className="join-key-row" key={i}>
                      <Select
                        aria-label={`왼쪽 연결 키 ${i + 1}`}
                        value={k.left}
                        onChange={(e) =>
                          update({
                            keys: state.keys.map((key, j) =>
                              j === i ? { ...key, left: e.target.value } : key,
                            ),
                          })
                        }
                      >
                        {main?.columns.map((c) => (
                          <option value={c.key} key={c.key}>
                            {c.label}
                          </option>
                        ))}
                      </Select>
                      <span>=</span>
                      <Select
                        aria-label={`오른쪽 연결 키 ${i + 1}`}
                        value={k.right}
                        onChange={(e) =>
                          update({
                            keys: state.keys.map((key, j) =>
                              j === i ? { ...key, right: e.target.value } : key,
                            ),
                          })
                        }
                      >
                        {related.columns.map((c) => (
                          <option value={c.key} key={c.key}>
                            {c.label}
                          </option>
                        ))}
                      </Select>
                      <button
                        className="icon-button"
                        aria-label={`연결 키 ${i + 1} 삭제`}
                        disabled={state.keys.length === 1}
                        onClick={() =>
                          update({ keys: state.keys.filter((_, j) => i !== j) })
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </>
              )}
              <DatasetTable columns={result.columns} rows={result.rows} />
            </>
          )}
          {state.stage === 3 && (
            <>
              <div className="transform-options">
                <label>
                  <Checkbox
                    aria-label="결측값 포함 행 제외"
                    checked={state.dropMissing}
                    onCheckedChange={(v) => update({ dropMissing: v === true })}
                  />
                  <span>
                    <strong>결측값 포함 행 제외</strong>
                    <small>선택한 컬럼 중 빈 값이 있는 행을 제거합니다.</small>
                  </span>
                </label>
                <label>
                  <Checkbox
                    aria-label="중복 행 제거"
                    checked={state.deduplicate}
                    onCheckedChange={(v) => update({ deduplicate: v === true })}
                  />
                  <span>
                    <strong>중복 행 제거</strong>
                    <small>
                      출력 컬럼 값이 모두 같은 행은 하나만 유지합니다.
                    </small>
                  </span>
                </label>
              </div>
              <label className="field">
                남은 결측값 대체
                <input
                  aria-label="결측값 대체 값"
                  value={state.fillValue}
                  onChange={(e) => update({ fillValue: e.target.value })}
                  placeholder="빈 상태로 두면 원본을 유지합니다"
                />
                <small>
                  숫자 컬럼에는 숫자를 입력하세요. 행 제외 옵션이 먼저
                  적용됩니다.
                </small>
              </label>
              <div className="calculation-option">
                <label>
                  <Checkbox
                    aria-label="달성률 계산열 추가"
                    checked={state.calculation}
                    onCheckedChange={(v) => update({ calculation: v === true })}
                  />
                  <strong>계산열 추가: 달성률 (%)</strong>
                </label>
                <p>분자 ÷ 분모 × 100 · 소수점 둘째 자리까지 표시</p>
                {state.calculation && (
                  <div className="form-grid">
                    <label className="field">
                      분자
                      <Select
                        aria-label="계산 분자"
                        value={state.numerator}
                        onChange={(e) => update({ numerator: e.target.value })}
                      >
                        <option value="">선택</option>
                        {numeric
                          .filter((c) => c.key !== "calculated_rate")
                          .map((c) => (
                            <option key={c.key} value={c.key}>
                              {c.label}
                            </option>
                          ))}
                      </Select>
                    </label>
                    <label className="field">
                      분모
                      <Select
                        aria-label="계산 분모"
                        value={state.denominator}
                        onChange={(e) =>
                          update({ denominator: e.target.value })
                        }
                      >
                        <option value="">선택</option>
                        {numeric
                          .filter((c) => c.key !== "calculated_rate")
                          .map((c) => (
                            <option key={c.key} value={c.key}>
                              {c.label}
                            </option>
                          ))}
                      </Select>
                    </label>
                  </div>
                )}
              </div>
              <label className="field">
                집계 기준
                <Select
                  aria-label="집계 기준"
                  value={state.aggregateBy}
                  onChange={(e) => update({ aggregateBy: e.target.value })}
                >
                  <option value="">집계하지 않음</option>
                  {(main?.columns || [])
                    .filter(
                      (c) =>
                        state.selectedColumns.includes(c.key) &&
                        c.type !== "number",
                    )
                    .map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}별 합계
                      </option>
                    ))}
                </Select>
                <small>
                  선택 시 같은 값끼리 묶어 숫자 컬럼의 합계와 행 수를
                  계산합니다. 비율은 합산하지 않습니다.
                </small>
              </label>
              <DatasetTable columns={result.columns} rows={result.rows} />
            </>
          )}
          {state.stage === 4 && (
            <>
              <div className="quality-grid">
                {[
                  { label: "결과 행", value: result.rows.length },
                  { label: "결측 셀", value: result.missing },
                  { label: "중복 행", value: result.duplicates },
                  { label: "숫자 형식 오류", value: result.invalidNumbers },
                ].map((q) => (
                  <div key={q.label}>
                    <span>{q.label}</span>
                    <strong>{q.value.toLocaleString()}</strong>
                  </div>
                ))}
              </div>
              <div className="result-summary">
                <span>적용된 설정</span>
                <strong>
                  {state.selectedColumns.length}개 기본 컬럼 · 필터{" "}
                  {state.filters.length}개 ·{" "}
                  {related ? state.joinType : "연결 없음"}
                  {state.dropMissing ? " · 결측 제외" : ""}
                  {state.deduplicate ? " · 중복 제거" : ""}
                  {state.aggregateBy ? " · 집계" : ""}
                </strong>
              </div>
              <DatasetTable
                columns={result.columns}
                rows={result.rows}
                pageSize={10}
              />
            </>
          )}
          {state.stage === 5 && (
            <>
              <div className="save-dataset-intro">
                <span className="stat-icon blue">
                  <FileSpreadsheet size={23} />
                </span>
                <h4>분석에 사용할 데이터셋을 저장하세요</h4>
                <p>
                  실제 처리 결과 {result.rows.length}행 ·{" "}
                  {result.columns.length}열
                </p>
              </div>
              <label className="field">
                데이터셋 이름 <span>*</span>
                <input
                  aria-label="데이터셋 이름"
                  value={state.datasetName}
                  maxLength={80}
                  placeholder="예: 9월 제품별 생산 분석 데이터"
                  onChange={(e) =>
                    update({ datasetName: e.target.value, saved: false }, false)
                  }
                />
              </label>
              <div className="save-dataset-actions">
                <Button
                  variant="secondary"
                  onClick={() =>
                    downloadDataset({
                      name: state.datasetName || "준비된_데이터",
                      columns: result.columns,
                      rows: result.rows,
                    })
                  }
                >
                  <Download size={16} />
                  결과 CSV 다운로드
                </Button>
                <Button
                  variant="primary"
                  onClick={save}
                  disabled={state.saved}
                >
                  {state.saved ? <Check size={16} /> : <Database size={16} />}{" "}
                  {state.saved ? "데이터셋 저장 완료" : "데이터셋 저장"}
                </Button>
              </div>
            </>
          )}

        </div>

      </div>

    </section>
  );
}

