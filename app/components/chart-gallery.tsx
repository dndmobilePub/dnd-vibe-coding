"use client";

import { useState } from "react";
import { ChartColumn, ChartBar, ChartSpline, ChartPie, Grid3X3, ScatterChart, ChartArea, Activity } from "lucide-react";
import { Checkbox } from "./checkbox";

export const chartTypes = [
  { id: "bar", name: "세로 막대", title: "라인별 평균 불량률", icon: ChartColumn },
  { id: "hbar", name: "가로 막대", title: "불량 유형별 건수", icon: ChartBar },
  { id: "line", name: "물결 라인", title: "일자별 불량률 추이 vs 목표", icon: ChartSpline },
  { id: "donut", name: "도넛", title: "불량 유형 구성비", icon: ChartPie },
  { id: "heat", name: "히트맵", title: "라인 × 교대조 불량률", icon: Grid3X3 },
  { id: "scatter", name: "산점도", title: "설비온도 vs 불량률", icon: ScatterChart },
  { id: "area", name: "누적영역", title: "주간 생산량 (라인군 누적)", icon: ChartArea },
  { id: "spc", name: "SPC 관리도", title: "E라인 X̄ 관리도", icon: Activity },
];
const recommendations: Record<string, string[]> = {
  "원인 분석": ["bar", "line", "heat", "scatter"],
  "추이 모니터링": ["line", "area", "spc"],
  "비교 분석": ["bar", "hbar", "donut"],
  "예측": ["line", "scatter", "area"],
};
const palette = ["#1f4e79", "#f17e28", "#20bf66", "#f04855", "#a54bf4"];
const lines = [3.2,5.8,2.1,4.4,7.9,3];
const defects = [412,287,196,131,74];
const defectLabels = ["치수불량","외관스크래치","용접불량","도장불량","기타"];
const trend = [4.1,4.4,3.9,4.8,5.2,4.6,5.9,6.4,5.8,6.9,7.4,6.8,7.9,7.2];
const heat = [[.32,.55,.21,.44,.81,.28],[.36,.61,.24,.47,.88,.31],[.29,.52,.19,.4,.74,.26]];
const control = [4.43,4.53,4.37,4.61,4.47,4.75,4.54,4.87,5.12,4.69,4.59,4.97,5.31,4.79,4.61,4.95,5.08,4.73,4.6,4.88];

function path(values: number[], min: number, max: number) {
  return values.map((v,i)=>`${i ? "L" : "M"}${64+i/(values.length-1)*472},${228-(v-min)/(max-min)*180}`).join(" ");
}
function Grid({max = 9, min = 0}: {max?: number; min?: number}) {
  return <>{[0,1,2,3,4].map(i=><g key={i}><line x1="64" x2="536" y1={228-i*45} y2={228-i*45} stroke="#e5ebf2" /><text x="56" y={232-i*45} textAnchor="end">{Number((min+(max-min)*i/4).toFixed(2)).toLocaleString("ko-KR")}</text></g>)}</>;
}
export function SampleChart({ id }: {id: string}) {
  const labels = id === "hbar" || id === "donut" ? defectLabels : id === "area" ? ["가공군","조립군","도장군"] : [];
  return <div className="sample-chart">
    <svg viewBox="0 0 600 280" role="img" aria-label={`${chartTypes.find(t=>t.id===id)?.name} 샘플 차트`}>
      {id === "bar" && <><Grid />{lines.map((v,i)=><g key={i}><rect x={86+i*76} y={228-v/9*180} width="42" height={v/9*180} rx="3" fill={v>6 ? palette[1] : palette[0]} /><text x={107+i*76} y={220-v/9*180} textAnchor="middle">{v}</text><text x={107+i*76} y="252" textAnchor="middle">{"ABCDEF"[i]}라인</text></g>)}</>}
      {id === "hbar" && <>{defects.map((v,i)=><g key={i}><text x="128" y={69+i*38} textAnchor="end">{defectLabels[i]}</text><rect x="140" y={52+i*38} width={v/450*364} height="24" rx="3" fill={palette[i]} /><text x={148+v/450*364} y={69+i*38}>{v}</text></g>)}</>}
      {id === "line" && <><Grid min={3} max={9}/><line x1="64" x2="536" y1="183" y2="183" stroke={palette[2]} strokeDasharray="6 4"/><path d={trend.map((v,i)=>{ const px=64+i/13*472, py=228-(v-3)/6*180; if(!i)return `M${px},${py}`; const prevX=64+(i-1)/13*472, prevY=228-(trend[i-1]-3)/6*180; return `C${(prevX+px)/2},${prevY} ${(prevX+px)/2},${py} ${px},${py}`; }).join(" ")} fill="none" stroke={palette[1]} strokeWidth="3"/>{trend.map((v,i)=><g key={i}><circle cx={64+i/13*472} cy={228-(v-3)/6*180} r="3" fill={palette[1]}/>{true && <text x={64+i/13*472} y="252" textAnchor="middle">{i+1}일</text>}</g>)}<text x="534" y="176" textAnchor="end" fill={palette[2]}>목표 4.5%</text></>}
      {id === "donut" && <>{defects.map((v,i)=>{const total=defects.reduce((a,b)=>a+b,0), before=defects.slice(0,i).reduce((a,b)=>a+b,0);return <circle key={i} cx="300" cy="138" r="78" fill="none" stroke={palette[i]} strokeWidth="38" pathLength="100" strokeDasharray={`${v/total*100} ${100-v/total*100}`} strokeDashoffset={-before/total*100} transform="rotate(-90 300 138)"/>;})}<text x="300" y="138" textAnchor="middle" className="donut-total">1,100</text><text x="300" y="160" textAnchor="middle">총 불량 건수</text></>}
      {id === "heat" && <>{Array.from("ABCDEF").map((l,i)=><text key={l} x={150+i*60} y="40" textAnchor="middle">{l}</text>)}{heat.map((row,j)=><g key={j}><text x="105" y={84+j*60} textAnchor="end">{j+1}조</text>{row.map((v,i)=><g key={i}><rect x={121+i*60} y={48+j*60} width="58" height="58" rx="2" fill={palette[0]} fillOpacity={v}/><text x={150+i*60} y={84+j*60} textAnchor="middle" style={{fill:v>.65?"white":"#163b63"}}>{v.toFixed(2)}</text></g>)}</g>)}</>}
      {id === "scatter" && <><Grid max={10}/>{Array.from({length:44},(_,i)=>{const x=72+(i*37%450), value=1+(x-72)/472*7+(Math.sin(i*4)*1.5);return <circle key={i} cx={x} cy={228-value/10*180} r="4" fill={x>400?palette[1]:palette[0]} fillOpacity=".75"/>;})}{[62,70,78,85,93].map((v,i)=><text key={v} x={64+i*118} y="252" textAnchor="middle">{v}°C</text>)}</>}
      {id === "area" && <><Grid max={26000}/>{[[9500,10300,9100,10600,11200,10800,12400,13000],[14500,15800,14600,16600,17900,17300,18600,19500],[18100,19500,18000,20400,21600,20900,22500,23700]].reverse().map((values,i)=><path key={i} d={`${path(values,0,26000)} L536,228 L64,228 Z`} fill={[palette[1],palette[2],palette[0]][i]} fillOpacity=".7"/>)}{Array.from({length:8},(_,i)=><text key={i} x={64+i/7*472} y="252" textAnchor="middle">W{i+1}</text>)}</>}
      {id === "spc" && <><Grid min={4} max={5.5}/>{[4.1,4.6,5.1].map((v,i)=><g key={v}><line x1="64" x2="536" y1={228-(v-4)/1.5*180} y2={228-(v-4)/1.5*180} stroke={i===1?"#526277":palette[3]} strokeDasharray="5 4"/><text x="536" y={221-(v-4)/1.5*180} textAnchor="end" style={{fill:i===1?"#526277":palette[3]}}>{["LCL","CL","UCL"][i]} {v}</text></g>)}<path d={path(control,4,5.5)} fill="none" stroke={palette[0]} strokeWidth="2"/>{control.map((v,i)=><circle key={i} cx={64+i/19*472} cy={228-(v-4)/1.5*180} r={v>5.1?5:3} fill={v>5.1?palette[3]:palette[0]}/>)}{[1,5,10,15,20].map((v,i)=><text key={v} x={64+i*118} y="252" textAnchor="middle">7/{String(v).padStart(2,"0")}</text>)}</>}
    </svg>
    <div className="sample-legend">{labels.map((l,i)=><span key={l}><i style={{background:id === "area" ? [palette[0],palette[2],palette[1]][i] : palette[i]}} />{l}</span>)}{id==="bar" && <><span><i style={{background:palette[0]}}/>평균 불량률 (%)</span><span><i style={{background:palette[1]}}/>관리 상한 초과</span></>}{id==="line" && <><span><i style={{background:palette[1]}}/>불량률</span><span><i style={{background:palette[2]}}/>목표</span></>}</div>
  </div>;
}

export function ChartGallery({ kind, selected, onChange }: {kind: string; selected: string[]; onChange: (selected: string[])=>void}) {
  const [columns, setColumns] = useState(2);
  const recommended = recommendations[kind] || [];
  return <section className="chart-gallery" aria-label="차트 유형 선택">
    <header className="chart-gallery-toolbar"><div><h3>차트 유형 선택</h3><span role="status">{selected.length}개 선택됨</span></div><div className="chart-gallery-actions">
      <button className="button secondary" onClick={()=>onChange(chartTypes.map(t=>t.id))}>전체 선택</button>
      <button className="button secondary" onClick={()=>onChange([])}>선택 해제</button>
      <div className="segmented" aria-label="차트 배치">{[1,2,3].map(n=><button key={n} aria-pressed={columns===n} className={columns===n?"selected":""} onClick={()=>setColumns(n)}>{n}열</button>)}</div>
      <button className="button secondary" onClick={()=>onChange(recommended)}>권장만 선택</button>
    </div></header>
    <div className="chart-type-options">{chartTypes.map(({id,name,icon:Icon})=><label key={id} className={`chart-type-option ${selected.includes(id)?"selected":""}`}>
      <Checkbox aria-label={`${name} 선택`} checked={selected.includes(id)} onCheckedChange={checked=>onChange(checked?[...selected,id]:selected.filter(s=>s!==id))}/><Icon size={18} aria-hidden="true"/><span>{name}</span>{recommended.includes(id)&&<span className="recommended-badge">권장</span>}
    </label>)}</div>
    <p className="chart-gallery-note">유형별 샘플 미리보기 · 준비 데이터 집계는 아래에서 확인하세요.</p>
    {selected.length ? <div className="sample-chart-grid" style={{gridTemplateColumns:`repeat(${columns}, minmax(0, 1fr))`}}>{chartTypes.filter(t=>selected.includes(t.id)).map(({id,name,title},i)=><article className="sample-chart-card" key={id}><header><span className="sample-chart-number">{i+1}</span><h4>{title}</h4><span className="sample-chart-kind">{name}</span></header><SampleChart id={id}/></article>)}</div> : <p className="chart-gallery-empty" role="status">미리 볼 차트 유형을 선택해주세요.</p>}
  </section>;
}

