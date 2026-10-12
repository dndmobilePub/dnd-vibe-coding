"use client";

import { useId } from "react";
import { evaluatePreparation, numberValue, type PreparationState } from "@/lib/data-preparation";
import { chartTypes } from "./chart-gallery";

export function SelectedResultCharts({ chartIds, ...props }: {
  chartIds?: string[]; preparation: PreparationState; x?: string; y?: string; aggregation?: string; variant?: number;
}) {
  const selected = chartTypes.filter(type=>(chartIds || [props.variant === 1 ? "line" : "bar"]).includes(type.id));
  return <div className="selected-result-charts">{selected.map(type=><section key={type.id}><h4>{type.name}</h4><ResultChart {...props} chartId={type.id} /></section>)}</div>;
}

export function ResultChart({ preparation, x, y, aggregation = "sum", variant = 0, chartId, compact = false }: {
  preparation: PreparationState; x?: string; y?: string; aggregation?: string; variant?: number; chartId?: string; compact?: boolean;
}) {
  const gradientId = useId();
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
  const type = chartId || (variant === 1 ? "line" : "bar");
  const values = data.map(d=>d.value);
  const mean = values.reduce((a,b)=>a+b,0)/values.length;
  const deviation = Math.sqrt(values.reduce((s,v)=>s+(v-mean)**2,0)/values.length);
  const upper = Math.max(1, ...values, ...(type === "spc" ? [mean+3*deviation] : []));
  const lower = Math.min(0, ...values, ...(type === "spc" ? [mean-3*deviation] : []));
  const position = (value: number) => 110 - (value-lower)/(upper-lower)*90;
  const zero = position(0);
  const categoryWidth = Math.max(80, ...data.map(d=>d.label.length * 8 + 16));
  const points = data.map((d,i) => `${data.length === 1 ? 300 : 30 + i/(data.length-1)*540},${position(d.value)}`);
  const colors = ["#5d9ae0", "#2584ce", "#8ac4b0", "#9db8dc", "#b7a8d9", "#82bac7"];
  const color = (index: number) => colors[index % colors.length];
  const total = values.reduce((sum,value)=>sum+Math.max(0,value),0);
  const smoothPath = data.map((d,i) => {
    const cx = data.length === 1 ? 300 : 30+i/(data.length-1)*540;
    if (!i) return `M${cx},${position(d.value)}`;
    const previousX = 30+(i-1)/(data.length-1)*540;
    const middle = (previousX+cx)/2;
    return `C${middle},${position(data[i-1].value)} ${middle},${position(d.value)} ${cx},${position(d.value)}`;
  }).join(" ");
  const seriesKey = result.columns.find(c=>c.type !== "number" && c.key !== dimension)?.key;
  const series = seriesKey ? Array.from(new Set(result.rows.map(row=>row[seriesKey] || "미지정"))) : [metric || "값"];
  const seriesValues = series.map(name=>data.map(d=>{
    const rows = result.rows.filter(row=>(row[dimension] || "미지정") === d.label && (!seriesKey || (row[seriesKey] || "미지정") === name));
    const numbers = rows.map(row=>numberValue(row[metric] || "")).filter(Number.isFinite);
    return aggregation === "count" ? numbers.length : numbers.reduce((a,b)=>a+b,0)/(aggregation === "avg" ? Math.max(1,numbers.length) : 1);
  }));
  const stackMax = Math.max(1,...data.map((_,i)=>seriesValues.reduce((sum,series)=>sum+Math.max(0,series[i]),0)));
  const scatter = result.rows.map(row=>({label: row[dimension] || "미지정", x: numberValue(row[dimension] || ""), y: numberValue(row[metric] || "")})).filter(point=>Number.isFinite(point.x)&&Number.isFinite(point.y));
  return <div className={`result-chart ${compact ? "result-chart-compact" : ""}`}>
    {!compact && <p>{result.columns.find(c=>c.key===metric)?.label} · {aggregation === "avg" ? "평균" : aggregation === "count" ? "건수" : "합계"} · {data.length}개 그룹</p>}
    <div className="result-chart-plot">
      <svg role="img" aria-label={compact ? `준비 데이터 집계 미리보기 · ${allData.length}개 그룹 중 ${data.length}개` : "준비 데이터 집계 차트"} viewBox="-60 -4 720 180" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", minWidth: compact ? 0 : Math.max(600, data.length*categoryWidth), height: compact ? 88 : 248 }}>
        <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#2584ce" stopOpacity=".2" /><stop offset="1" stopColor="#2584ce" stopOpacity="0" /></linearGradient></defs>
        {!["donut", "heat", "hbar"].includes(type) && [20, 42.5, 65, 87.5, 110].map(level=><line key={level} x1="10" x2="590" y1={level} y2={level} stroke="#edf2f6" strokeWidth="1" />)}
        {type === "donut" ? <>
          {data.map((d,i)=><circle key={d.label} cx="300" cy="78" r="52" fill="none" stroke={color(i)} strokeWidth="24" pathLength="100" strokeDasharray={`${total ? Math.max(0,d.value)/total*100 : 0} 100`} strokeDashoffset={total ? -values.slice(0,i).reduce((s,v)=>s+Math.max(0,v),0)/total*100 : 0} transform="rotate(-90 300 78)"><title>{d.label}: {d.value.toLocaleString("ko-KR")}</title></circle>)}
          <text x="300" y="82" textAnchor="middle" fontSize="14">{Number(total.toFixed(2)).toLocaleString("ko-KR")}</text>
        </> : type === "hbar" ? data.map((d,i)=>{
          const rowHeight=120/data.length, origin=150+(0-lower)/(upper-lower)*380, end=150+(d.value-lower)/(upper-lower)*380;
          return <g key={d.label}><title>{d.label}: {d.value}</title><text x="140" y={20+i*rowHeight} textAnchor="end" fontSize="10">{d.label}</text><rect x={Math.min(origin,end)} y={9+i*rowHeight} width={Math.max(1,Math.abs(end-origin))} height={Math.max(2,rowHeight-5)} fill={color(i)} /><text x={end+5} y={20+i*rowHeight} fontSize="10">{Number(d.value.toFixed(2))}</text></g>;
        }) : type === "heat" ? seriesValues.map((row,j)=>row.map((value,i)=>{
          const width=500/data.length, height=115/series.length;
          return <g key={`${j}-${i}`}><title>{series[j]} · {data[i].label}: {value}</title><rect x={90+i*width} y={5+j*height} width={width-2} height={height-2} fill={color(0)} fillOpacity={.15+.85*Math.min(1,Math.abs(value)/Math.max(1,...seriesValues.flat().map(Math.abs)))} /><text x={90+(i+.5)*width} y={5+(j+.5)*height} textAnchor="middle" fontSize="9" style={{fill: Math.abs(value)/Math.max(1,...seriesValues.flat().map(Math.abs)) > .55 ? "#fff" : "#344e69"}}>{Number(value.toFixed(2))}</text>{!j&&<text x={90+(i+.5)*width} y="140" textAnchor="middle" fontSize="9">{data[i].label}</text>}{!i&&<text x="85" y={5+(j+.5)*height} textAnchor="end" fontSize="9">{series[j]}</text>}</g>;
        })) : type === "scatter" ? <>
          {scatter.length ? scatter.map((point,i)=>{
            const minX=Math.min(...scatter.map(p=>p.x)), maxX=Math.max(...scatter.map(p=>p.x));
            const minY=Math.min(...scatter.map(p=>p.y)), maxY=Math.max(...scatter.map(p=>p.y));
            return <circle key={i} cx={30+(point.x-minX)/(maxX-minX||1)*540} cy={110-(point.y-minY)/(maxY-minY||1)*90} r="4" fill={color(i)}><title>{point.label}: {point.x}, {point.y}</title></circle>;
          }) : <text x="300" y="80" textAnchor="middle" fontSize="12">산점도는 X축과 Y축에 숫자 컬럼을 선택해주세요.</text>}
          <text x="300" y="145" textAnchor="middle" fontSize="10">{result.columns.find(c=>c.key===dimension)?.label} / {result.columns.find(c=>c.key===metric)?.label}</text>
        </> : <>
        <line x1="10" x2="590" y1={zero} y2={zero} stroke="#e2eaf2" />
        {type === "line" && <path d={`${smoothPath} L${data.length === 1 ? 300 : 570},${zero} L${data.length === 1 ? 300 : 30},${zero} Z`} fill={`url(#${gradientId})`} />}
        {type === "line" && <path d={smoothPath} fill="none" stroke={color(1)} strokeWidth="3" />}
        {type === "area" && seriesValues.map((_,j)=>{
          const coords = data.map((_,i)=>({x:data.length===1?300:30+i/(data.length-1)*540, top:110-seriesValues.slice(0,j+1).reduce((s,row)=>s+Math.max(0,row[i]),0)/stackMax*90, bottom:110-seriesValues.slice(0,j).reduce((s,row)=>s+Math.max(0,row[i]),0)/stackMax*90}));
          return <path key={j} d={`M${coords.map(p=>`${p.x},${p.top}`).join(" L")} L${coords.slice().reverse().map(p=>`${p.x},${p.bottom}`).join(" L")} Z`} fill={color(j)} fillOpacity=".8"><title>{series[j]}</title></path>;
        })}
        {type === "spc" && <><polyline points={points.join(" ")} fill="none" stroke={color(0)} strokeWidth="2" />{[mean-3*deviation,mean,mean+3*deviation].map((limit,i)=><g key={i}><line x1="10" x2="590" y1={position(limit)} y2={position(limit)} stroke={i===1?"#526277":"#d83d45"} strokeDasharray="4 3" /><text x="590" y={position(limit)-3} textAnchor="end" fontSize="9">{["LCL","CL","UCL"][i]} {limit.toFixed(2)}</text></g>)}</>}
        {data.map((d,i) => {
          const cx = data.length===1 ? 300 : 30+i/(data.length-1)*540;
          const cy = position(d.value);
          return <g key={d.label}>
            <title>{d.label}: {d.value.toLocaleString("ko-KR")}</title>
            {type === "line" || type === "spc" ? <circle cx={cx} cy={cy} r="3" stroke="#fff" strokeWidth="1.5" fill={type==="spc" ? Math.abs(d.value-mean)>3*deviation ? "#d83d45" : color(0) : color(1)} /> : type === "bar" ? <rect x={cx-12} y={Math.min(zero,cy)} width="24" height={Math.max(1,Math.abs(zero-cy))} rx="2" fill={color(i)} /> : null}
            <text x={cx} y={cy-7} textAnchor="middle" fontSize={compact ? "18" : "10"}>{Number(d.value.toFixed(2)).toLocaleString("ko-KR")}</text>
            <text x={cx} y="145" textAnchor="middle" fontSize="12"><title>{d.label}</title>{compact && d.label.length > 8 ? `${d.label.slice(0,7)}…` : d.label}</text>
          </g>;
        })}
        </>}
      </svg>
    </div>
    {compact && <div className="result-chart-compact-labels" aria-label="차트 범주">{data.map((d,i)=><span key={d.label} title={d.label}><i style={{background:color(i)}} aria-hidden="true" />{d.label}</span>)}</div>}
    {!compact && !["bar", "hbar"].includes(type) && <div className="sample-legend">{(type === "area" || type === "heat" ? series : type === "line" || type === "spc" || type === "scatter" ? [result.columns.find(c=>c.key===metric)?.label || "값"] : data.map(d=>d.label)).map((label,i)=><span key={label}><i style={{background:color(type === "line" ? 1 : i)}} />{label}</span>)}</div>}
    {!compact && <p>최소 {Math.min(...values).toFixed(2)} · 최대 {Math.max(...values).toFixed(2)} · 평균 {mean.toFixed(2)} · 표준편차 {Math.sqrt(values.reduce((s,v)=>s+(v-mean)**2,0)/values.length).toFixed(2)}</p>}
  </div>;
}
