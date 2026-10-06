import { evaluatePreparation, numberValue, type PreparationState } from "@/lib/data-preparation";

export function ResultChart({ preparation, x, y, aggregation = "sum", variant = 0, compact = false }: {
  preparation: PreparationState; x?: string; y?: string; aggregation?: string; variant?: number; compact?: boolean;
}) {
  const result = evaluatePreparation(preparation);
  const dimension = x || result.columns.find(c => c.type !== "number")?.key || result.columns[0]?.key;
  const metric = y || result.columns.find(c => c.type === "number")?.key;
  const groups = new Map<string, number[]>();
  for (const row of result.rows) {
    const value = metric ? numberValue(row[metric] || "") : NaN;
    if (!Number.isFinite(value)) continue;
    const label = row[dimension] || "미지정";
    groups.set(label, [...(groups.get(label) || []), value]);
  }
  const allData = Array.from(groups, ([label, values]) => ({ label,
    value: aggregation === "avg" ? values.reduce((a,b)=>a+b,0)/values.length : aggregation === "count" ? values.length : values.reduce((a,b)=>a+b,0),
  }));
  const data = compact ? allData.slice(0, 6) : allData;
  if (!data.length) return <p role="status">표시할 숫자 데이터가 없습니다. 숫자 컬럼을 선택해주세요.</p>;
  const upper = Math.max(1, ...data.map(d => d.value));
  const lower = Math.min(0, ...data.map(d => d.value));
  const position = (value: number) => 110 - (value-lower)/(upper-lower)*90;
  const zero = position(0);
  const points = data.map((d,i) => `${data.length === 1 ? 300 : 30 + i/(data.length-1)*540},${position(d.value)}`);
  const values = data.map(d=>d.value);
  const mean = values.reduce((a,b)=>a+b,0)/values.length;
  return <div className={`result-chart ${compact ? "result-chart-compact" : ""}`}>
    {!compact && <p>{result.columns.find(c=>c.key===metric)?.label} · {aggregation === "avg" ? "평균" : aggregation === "count" ? "건수" : "합계"} · {data.length}개 그룹</p>}
    <div className="result-chart-plot">
      <svg role="img" aria-label={compact ? `준비 데이터 집계 미리보기 · ${allData.length}개 그룹 중 ${data.length}개` : "준비 데이터 집계 차트"} viewBox="0 0 600 170" preserveAspectRatio={compact ? "none" : "xMidYMid meet"} style={{ width: "100%", minWidth: compact ? 0 : Math.max(400, data.length*65), height: compact ? 120 : 248 }}>
        <line x1="10" x2="590" y1={zero} y2={zero} stroke="#526277" />
        {variant === 1 && <polyline points={points.join(" ")} fill="none" stroke="#1769d3" strokeWidth="3" />}
        {data.map((d,i) => {
          const cx = data.length===1 ? 300 : 30+i/(data.length-1)*540;
          const cy = position(d.value);
          return <g key={d.label}>
            <title>{d.label}: {d.value.toLocaleString("ko-KR")}</title>
            {variant===1 ? <circle cx={cx} cy={cy} r="4" fill="#1769d3" /> : <rect x={cx-12} y={Math.min(zero,cy)} width="24" height={Math.max(1,Math.abs(zero-cy))} fill="#1769d3" />}
            <text x={cx} y={cy-7} textAnchor="middle" fontSize={compact ? "18" : "10"}>{Number(d.value.toFixed(2)).toLocaleString("ko-KR")}</text>
            <text x={cx} y="145" textAnchor="middle" fontSize={compact ? "18" : "10"}>{compact && d.label.length > 8 ? `${d.label.slice(0,7)}…` : d.label}</text>
          </g>;
        })}
      </svg>
    </div>
    {!compact && <p>최소 {Math.min(...values).toFixed(2)} · 최대 {Math.max(...values).toFixed(2)} · 평균 {mean.toFixed(2)} · 표준편차 {Math.sqrt(values.reduce((s,v)=>s+(v-mean)**2,0)/values.length).toFixed(2)}</p>}
  </div>;
}
