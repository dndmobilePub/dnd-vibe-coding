"use client";
import { Select } from "./select";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ResultChart } from "./result-chart";
import { ChartGallery, chartTypes } from "./chart-gallery";
import { Checkbox } from "./checkbox";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DataPreparation, DatasetTable } from "./data-preparation";
import {
  preparationSources,
  createPreparationState,
  evaluatePreparation,
  downloadDataset,
  type PreparationState,
  type SavedDataset,
} from "@/lib/data-preparation";
import {
  ArrowUpRight,
  ArrowRight,
  Bell,
  BookOpen,
  ChartColumn,
  ChartNoAxesCombined,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Database,
  Download,
  FileSpreadsheet,
  FolderClosed,
  Home,
  LayoutDashboard,
  ListFilter,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Upload,
  Workflow,
  X,
  Zap,
} from "lucide-react";

type View = "home" | "analyses" | "data" | "favorites" | "reports" | "settings";
type Analysis = {
  id: number;
  title: string;
  category: string;
  date: string;
  status: string;
  starred: boolean;
  chart: number;
  chartTypes?: string[];
  description?: string;
  preparation?: PreparationState;
  step?: number;
  kind?: string;
  x?: string;
  y?: string;
  aggregation?: string;
  history?: string[];
  updatedAt?: number;
};
const initialAnalyses: Analysis[] = [
  {
    id: 1,
    title: "제품별 생산 실적 분석",
    category: "생산 관리",
    date: "2026.09.15",
    status: "게시됨",
    starred: true,
    chart: 0,
  },
  {
    id: 2,
    title: "월별 원자재 수급 현황",
    category: "구매 · 자재",
    date: "2026.09.14",
    status: "게시됨",
    starred: false,
    chart: 1,
  },
  {
    id: 3,
    title: "공정별 품질 지표 모니터링",
    category: "품질 관리",
    date: "2026.09.14",
    status: "임시저장",
    starred: true,
    chart: 2,
  },
];
const datasets = preparationSources.map((d) => ({
  id: d.id,
  title: d.title,
  desc: d.desc,
  team:
    d.id === "stock"
      ? "자재관리팀"
      : d.id === "plan"
        ? "생산기획팀"
        : "생산관리팀",
  rows: d.rows.length.toLocaleString(),
  cols: d.columns.length,
  color: d.id === "stock" ? "green" : d.id === "production" ? "blue" : "sky",
}));
const sampleRows = [
  ["2026-09-15", "CU-001", "전기동", "A 공정", "1,280", "1,250", "97.7%"],
  ["2026-09-15", "CU-002", "동선", "B 공정", "960", "948", "98.8%"],
  ["2026-09-15", "PM-001", "금", "C 공정", "320", "316", "98.8%"],
  ["2026-09-14", "CU-001", "전기동", "A 공정", "1,240", "1,218", "98.2%"],
  ["2026-09-14", "CU-002", "동선", "B 공정", "980", "964", "98.4%"],
];
const prompts = [
  "이번 달 생산 실적을 분석해줘",
  "계획 대비 실적이 궁금해",
  "재고 이상 징후를 찾아줘",
];
const steps = [
  "분석 설정",
  "데이터 준비",
  "차트 · 시각화",
  "인사이트",
  "게시 · 공유",
];

function MiniChart({
  variant = 0,
  large = false,
}: {
  variant?: number;
  large?: boolean;
}) {
  const gradientId = useId();
  const data = [48, 66, 58, 81, 70, 96].map((value, i) => ({
    label: variant === 2 ? `${String.fromCharCode(65 + i)} 공정` : `${4 + i}월`,
    value,
    comparison: value - (i % 3) * 10 - 8,
  }));
  const linePoints = data.map((point, i) =>
    `${(i / (data.length - 1)) * 400} ${120 - point.value}`,
  );
  const linePath = `M ${linePoints.join(" L ")}`;
  return (
    <div
      className={`mini-chart chart-${variant} ${large ? "large-chart" : ""}`}
      role="img"
      aria-label={
        variant === 0
          ? "샘플 월별 생산 실적 막대 차트"
          : variant === 1
            ? "샘플 원자재 수급 추이 차트"
            : "샘플 공정별 품질 지표 차트"
      }
    >
      <div className="chart-grid" />
      {variant === 1 ? (
        <svg viewBox="0 0 400 120" preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#2584ce" stopOpacity=".2" />
              <stop offset="1" stopColor="#2584ce" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={`${linePath} L400 120 L0 120Z`}
            fill={`url(#${gradientId})`}
          />
          <path
            d={linePath}
            fill="none"
            stroke="#2584ce"
            strokeWidth="3"
          />
        </svg>
      ) : (
        <div className="bars">
          {data.map((point) => (
            <div className="bar-pair" key={point.label}>
              <span style={{ height: `${point.value / 1.3}%` }} />
              <span style={{ height: `${point.comparison / 1.3}%` }} />
            </div>
          ))}
        </div>
      )}
      <div className="axis">
        {data.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}

const viewPaths: Record<View, string> = {
  home: "/",
  analyses: "/analyses",
  data: "/data-library",
  reports: "/reports",
  favorites: "/favorites",
  settings: "/settings",
};

export default function Workspace({ view, editor = false, sessionId, copy = false, initialTitle = "" }: {
  view: View; editor?: boolean; sessionId?: number; copy?: boolean; initialTitle?: string;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [analyses, setAnalyses] = useState(initialAnalyses);
  const [query, setQuery] = useState("");
  const [prompt, setPrompt] = useState("");
  const [modal, setModal] = useState<"workflow" | "detail" | "help" | null>(
    editor ? "workflow" : null,
  );
  const [active, setActive] = useState<Analysis>(initialAnalyses[0]);
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [preparation, setPreparation] = useState<PreparationState>(
    createPreparationState,
  );
  const [savedDatasets, setSavedDatasets] = useState<SavedDataset[]>([]);
  const [chartType, setChartType] = useState(0);
  const [selectedChartTypes, setSelectedChartTypes] = useState(chartTypes.map(t=>t.id));
  const [editingId, setEditingId] = useState<number | null>(null);
  const [kind, setKind] = useState("비교 분석");
  const [domain, setDomain] = useState("생산 관리");
  const [x, setX] = useState("");
  const [y, setY] = useState("");
  const [aggregation, setAggregation] = useState("sum");
  const [sort, setSort] = useState("recent");
  const [notifications, setNotifications] = useState(false);
  const [unread, setUnread] = useState(true);
  const [toast, setToast] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [filter, setFilter] = useState("전체");
  const [error, setError] = useState("");
  const [previewData, setPreviewData] = useState<string | null>(null);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const a = localStorage.getItem("mnm-analyses");
      if (a) {
        const parsed = JSON.parse(a);
        if (
          Array.isArray(parsed) &&
          parsed.every(
            (x) =>
              typeof x.id === "number" &&
              typeof x.title === "string" &&
              typeof x.category === "string" &&
              typeof x.date === "string" &&
              typeof x.status === "string" &&
              typeof x.starred === "boolean" &&
              [0, 1, 2].includes(x.chart),
          )
        )
          setAnalyses(parsed);
      }
      setEmailUpdates(localStorage.getItem("mnm-email") !== "false");
      const saved = JSON.parse(
        localStorage.getItem("mnm-prepared-datasets") || "[]",
      );
      if (Array.isArray(saved))
        setSavedDatasets(
          saved.filter(
            (d) =>
              typeof d.id === "string" &&
              typeof d.name === "string" &&
              Array.isArray(d.columns) &&
              Array.isArray(d.rows),
          ),
        );
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!modal || editor) return;
    restoreFocus.current = document.activeElement as HTMLElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modalRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setModal(null);
      if (e.key === "Tab") {
        const nodes = modalRef.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input, textarea, select, a[href]",
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === modalRef.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", onKey);
      restoreFocus.current?.focus();
    };
  }, [modal, editor]);
  const persist = (next: Analysis[]) => {
    setAnalyses(next);
    try {
      localStorage.setItem("mnm-analyses", JSON.stringify(next));
    } catch {
      setToast("브라우저 저장 공간에 접근할 수 없어 현재 세션에만 유지됩니다.");
    }
  };
  const navigate = (next: View) => {
    router.push(viewPaths[next]);
    setQuery("");
    setFilter("전체");
    setPreviewData(null);
    setMobileMenu(false);
  };
  const star = (id: number) =>
    persist(
      analyses.map((a) => (a.id === id ? { ...a, starred: !a.starred } : a)),
    );
  const begin = (text = "") => {
    if (!editor) { router.push(`/analyses/new${text ? `?title=${encodeURIComponent(text)}` : ""}`); return; }
    setEditingId(null);
    setKind("비교 분석");
    setDomain("생산 관리");
    setX(""); setY(""); setAggregation("sum");
    setTitle(text);
    setDescription(
      text ? "샘플 데이터를 활용하여 주요 추이와 개선 기회를 탐색합니다." : "",
    );
    setStep(0);
    setError("");
    setPreparation(createPreparationState());
    setChartType(0);
    setSelectedChartTypes(chartTypes.map(t=>t.id));
    setModal("workflow");
  };
  const resume = (a: Analysis, copy = false) => {
    if (!editor) { router.push(`/analyses/new?session=${a.id}${copy ? "&copy=1" : ""}`); return; }
    setEditingId(copy ? null : a.id);
    setTitle(copy ? `${a.title} 복사본` : a.title);
    setDescription(a.description || "");
    setPreparation(a.preparation || createPreparationState());
    setStep(a.step ?? 0);
    setChartType(a.chart);
    setSelectedChartTypes(a.chartTypes?.filter(id=>chartTypes.some(t=>t.id===id)) || [a.chart === 1 ? "line" : "bar"]);
    setKind(a.kind || "비교 분석");
    setDomain(a.category);
    setX(a.x || ""); setY(a.y || "");
    setAggregation(a.aggregation || "sum");
    setError(""); setModal("workflow");
  };
  useEffect(() => {
    if (!editor || !ready) return;
    if (sessionId !== undefined) {
      const existing = analyses.find(a => a.id === sessionId);
      if (existing) resume(existing, copy);
      else { setError("저장된 분석을 찾을 수 없습니다. 새 분석으로 시작해주세요."); }
    } else begin(initialTitle);
    // Initialize once after browser storage has been restored.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, ready, sessionId, copy, initialTitle]);
  const saveAnalysis = (publish: boolean) => {
    if (publish && !preparation.saved) { setError("데이터셋을 저장한 뒤 게시해주세요."); setStep(1); return; }
    if (!title.trim()) {
      setError("분석 이름을 입력해주세요.");
      setStep(0);
      return;
    }
    const next: Analysis = {
      id: editingId ?? Date.now(),
      title: title.trim(),
      category: domain,
      date: new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" })
        .format(new Date())
        .replaceAll("-", "."),
      status: publish ? "게시됨" : "임시저장",
      starred: analyses.find(a => a.id === editingId)?.starred ?? false,
      chart: chartType,
      chartTypes: selectedChartTypes,
      description, preparation, step, kind, x, y, aggregation,
      updatedAt: Date.now(),
      history: [...(analyses.find(a => a.id === editingId)?.history || []),
        `${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} · ${publish ? "게시" : "저장"} · ${steps[step]}`],
    };
    persist([next, ...analyses.filter(a => a.id !== next.id)]);
    setModal(null);
    navigate("analyses");
    setToast(
      publish
        ? "분석을 내 워크스페이스에 게시했습니다. (로컬 데모)"
        : "분석을 이 브라우저에 임시저장했습니다.",
    );
  };
  const nextStep = () => {
    setError("");
    if (step === 2 && !selectedChartTypes.length) { setError("차트 유형을 하나 이상 선택해주세요."); return; }
    if (step === 0 && !title.trim()) {
      setError("분석 이름을 입력해주세요.");
      titleRef.current?.focus();
      return;
    }
    if (step === 1 && !preparation.saved) {
      setError("데이터셋을 저장할 때까지 데이터 준비의 6단계를 완료해주세요.");
      return;
    }
    setStep((s) => Math.min(s + 1, 4));
  };
  const download = () => {
    const content =
      "\uFEFF일자,제품코드,제품명,공정,계획수량,생산수량,달성률\n" +
      sampleRows
        .map((r) => r.map((c) => '"' + c.replaceAll('"', '""') + '"').join(","))
        .join("\n");
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "MnM_샘플_생산실적.csv";
    a.click();
    URL.revokeObjectURL(url);
    setToast("샘플 데이터 CSV를 내려받았습니다.");
  };
  const visibleDatasets = datasets.filter((d) =>
    `${d.title} ${d.desc}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const visibleSavedDatasets = savedDatasets.filter((d) =>
    d.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const filtered = analyses.filter(
    (a) =>
      (view !== "favorites" || a.starred) &&
      (view !== "reports" || a.status === "게시됨") &&
      (filter === "전체" || a.status === filter) &&
      a.title.toLowerCase().includes(query.trim().toLowerCase()),
  ).sort((a,b) => sort === "name" ? a.title.localeCompare(b.title, "ko") : (b.updatedAt ?? b.id) - (a.updatedAt ?? a.id));
  const navs: { id: View; label: string; icon: typeof Home }[] = [
    { id: "home", label: "워크스페이스", icon: Home },
    { id: "analyses", label: "나의 분석", icon: ChartNoAxesCombined },
    { id: "data", label: "데이터 라이브러리", icon: Database },
    { id: "reports", label: "공유 리포트", icon: FolderClosed },
    { id: "favorites", label: "즐겨찾기", icon: Star },
  ];
  const pageTitle = {
    home: "워크스페이스",
    analyses: "나의 분석",
    data: "데이터 라이브러리",
    favorites: "즐겨찾기",
    reports: "공유 리포트",
    settings: "워크스페이스 설정",
  }[view];

  return (
    <div className={`app-shell ${editor ? "editor-shell" : ""}`} inert={!ready} aria-busy={!ready}>
      <a className="skip-link" href="#main">
        본문으로 건너뛰기
      </a>
      {mobileMenu && (
        <button
          className="sidebar-backdrop"
          aria-label="메뉴 닫기"
          onClick={() => setMobileMenu(false)}
        />
      )}
      <aside id="workspace-navigation" className={`sidebar ${mobileMenu ? "mobile-open" : ""}`}>
        <button
          className="brand"
          onClick={() => navigate("home")}
          aria-label="MnM Insight 홈"
        >
          <span className="brand-mark">
            <ChartNoAxesCombined size={24} />
          </span>
          <span>
            MnM<span className="brand-light"> Insight</span>
            <small>AI ANALYTICS WORKSPACE</small>
          </span>
        </button>
        <button
          className="workspace-switch"
          onClick={() => navigate("settings")}
        >
          <span className="workspace-avatar">M</span>
          <span>
            LS MnM<small>생산 · 데이터 워크스페이스</small>
          </span>
          <ChevronDown size={15} />
        </button>
        <div className="nav-label">WORKSPACE</div>
        <nav aria-label="메인 메뉴">
          {navs.map(({ id, label, icon: Icon }) => (
            <Link
              key={id}
              className={`nav-item ${view === id ? "active" : ""}`}
              aria-current={view === id ? "page" : undefined}
              href={viewPaths[id]}
              onClick={() => setMobileMenu(false)}
            >
              <Icon size={19} />
              {label}
              {id === "analyses" && (
                <span className="nav-count">{analyses.length}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <div className="nav-label">SUPPORT</div>
        <button className="nav-item" onClick={() => setModal("help")}>
          <BookOpen size={19} />
          이용 가이드
          <ArrowUpRight className="nav-end" size={14} />
        </button>
        <Link
          className={`nav-item ${view === "settings" ? "active" : ""}`}
          href="/settings"
          aria-current={view === "settings" ? "page" : undefined}
        >
          <Settings size={19} />
          설정
        </Link>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon">
              <Sparkles size={18} />
            </span>
            <strong>데이터 분석, 처음인가요?</strong>
            <p>AI와 함께 첫 인사이트를 발견하세요.</p>
            <button onClick={() => begin()}>
              분석 시작하기 <ArrowRight size={14} />
            </button>
          </div>
          <button className="profile" onClick={() => navigate("settings")}>
            <span className="avatar">홍</span>
            <span>
              <strong>홍길동</strong>
              <small>생산관리팀</small>
            </span>
            <MoreHorizontal size={20} />
          </button>
        </div>
        <div className="sidebar-foot">
          LS MnM <span>© 2026</span>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-toggle"
              aria-label={mobileMenu ? "메뉴 닫기" : "메뉴 열기"}
              aria-expanded={mobileMenu}
              aria-controls="workspace-navigation"
              onClick={() => setMobileMenu(true)}
            >
              <Menu size={22} />
            </button>
            <span>워크스페이스</span>
            <ChevronRight size={14} />
            <strong>{editor ? (sessionId && !copy ? "분석 편집" : "새 분석 만들기") : view === "home" ? "홈" : pageTitle}</strong>
          </div>
          <div className="top-actions">
            <span className="demo-label">
              <span />
              샘플 데이터 환경
            </span>
            <button
              className="icon-button notification-button"
              aria-label="알림"
              aria-expanded={notifications}
              onClick={() => setNotifications(!notifications)}
            >
              <Bell size={19} />
              {unread && <i />}
            </button>
            <button
              className="icon-button"
              aria-label="도움말"
              onClick={() => setModal("help")}
            >
              <CircleHelp size={19} />
            </button>
            <span className="top-divider" />
            <button
              className="avatar avatar-small"
              aria-label="사용자 설정"
              onClick={() => navigate("settings")}
            >
              홍
            </button>
          </div>
          {notifications && (
            <section className="notification-popover" aria-label="알림 목록">
              <div className="popover-title">
                <strong>알림</strong>
                <button
                  onClick={() => {
                    setUnread(false);
                    setToast("모든 알림을 읽음 처리했습니다.");
                  }}
                >
                  <CheckCheck size={15} />
                  모두 읽음
                </button>
                <button
                  className="icon-button"
                  aria-label="알림 닫기"
                  onClick={() => setNotifications(false)}
                >
                  <X size={16} />
                </button>
              </div>
              <button
                onClick={() => {
                  navigate("data");
                  setNotifications(false);
                }}
              >
                <span className="activity-icon blue">
                  <Database size={17} />
                </span>
                <span>
                  <strong>생산 데이터가 업데이트되었어요</strong>
                  <small>MES_일별생산실적 · 샘플 알림</small>
                </span>
              </button>
              <button
                onClick={() => {
                  setActive(initialAnalyses[0]);
                  setModal("detail");
                  setNotifications(false);
                }}
              >
                <span className="activity-icon sky">
                  <Sparkles size={17} />
                </span>
                <span>
                  <strong>새로운 인사이트가 준비되었어요</strong>
                  <small>생산 실적 분석 · 샘플 알림</small>
                </span>
              </button>
            </section>
          )}
        </header>

        <main id={editor ? "workspace-content" : "main"} className="main-content" hidden={editor}>
          {view === "home" ? (
            <>
              <section className="page-heading">
                <div>
                  <div className="eyebrow">YOUR DAILY INSIGHT</div>
                  <h1>
                    안녕하세요, 홍길동님 <Sparkles className="wave" size={24} aria-hidden="true" />
                  </h1>
                  <p>오늘의 데이터에서 새로운 가능성을 발견해보세요.</p>
                </div>
                <button className="button primary" onClick={() => begin()}>
                  <Plus size={18} />새 분석 만들기
                </button>
              </section>

              <section className="ai-hero" aria-labelledby="hero-title">
                <div className="hero-orbit orbit-one" />
                <div className="hero-orbit orbit-two" />
                <div className="hero-sparkle">
                  <Sparkles size={38} />
                </div>
                <div className="ai-eyebrow">
                  <span>
                    <Sparkles size={13} />
                    MnM AI
                  </span>
                  질문으로 시작하는 분석
                </div>
                <h2 id="hero-title">
                  데이터에 질문하고,
                  <br />
                  <span>다음 인사이트를 발견하세요.</span>
                </h2>
                <p>궁금한 내용을 입력하면 분석 설정을 시작할 수 있어요.</p>
                <form
                  className="prompt-form"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    if (prompt.trim()) begin(prompt.trim());
                  }}
                >
                  <Sparkles className="prompt-icon" size={20} />
                  <input
                    aria-label="AI 분석 질문"
                    aria-describedby="prompt-hint"
                    placeholder="예: 지난달 대비 제품별 생산 실적은 어떻게 달라졌어?"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    maxLength={100}
                  />
                  <button
                    type="submit"
                    aria-label="AI 분석 시작"
                    disabled={!prompt.trim()}
                  >
                    <ArrowRight size={21} />
                  </button>
                </form>
                <p id="prompt-hint" className="prompt-hint">샘플 환경 · 질문을 바탕으로 분석을 설정합니다.</p>
                <div className="prompt-suggestions">
                  <span>이렇게 시작해보세요</span>
                  {prompts.map((p) => (
                    <button key={p} onClick={() => begin(p)}>
                      {p}
                      <ArrowUpRight size={12} />
                    </button>
                  ))}
                </div>
              </section>

              <section className="stats-grid" aria-label="워크스페이스 요약">
                {[
                  {
                    label: "나의 분석",
                    value: analyses.length,
                    unit: "개",
                    icon: ChartNoAxesCombined,
                    color: "blue",
                    note: "내 브라우저에 저장된 분석",
                    action: "analyses" as View,
                  },
                  {
                    label: "연결된 데이터",
                    value: datasets.length + savedDatasets.length,
                    unit: "개",
                    icon: Database,
                    color: "sky",
                    note: "샘플 데이터셋을 탐색하세요",
                    action: "data" as View,
                  },
                  {
                    label: "공유 리포트",
                    value: analyses.filter((a) => a.status === "게시됨").length,
                    unit: "개",
                    icon: FolderClosed,
                    color: "green",
                    note: "게시된 분석을 한눈에 확인",
                    action: "reports" as View,
                  },
                  {
                    label: "즐겨찾기",
                    value: analyses.filter((a) => a.starred).length,
                    unit: "개",
                    icon: Star,
                    color: "orange",
                    note: "자주 찾는 분석을 빠르게",
                    action: "favorites" as View,
                  },
                ].map(
                  ({ label, value, unit, icon: Icon, color, note, action }) => (
                    <button
                      className="stat-card"
                      key={label}
                      onClick={() => navigate(action)}
                    >
                      <div>
                        <span>{label}</span>
                        <span className={`stat-icon ${color}`}>
                          <Icon size={19} />
                        </span>
                      </div>
                      <strong>
                        {value}
                        <small>{unit}</small>
                      </strong>
                      <p>
                        {note}
                        <ChevronRight size={14} />
                      </p>
                    </button>
                  ),
                )}
              </section>

              <section className="analyses-section">
                <div className="section-heading">
                  <h2>
                    최근 분석{" "}
                    <span className="count-pill">{analyses.length}</span>
                  </h2>
                  <button
                    className="text-button"
                    onClick={() => navigate("analyses")}
                  >
                    전체 보기
                    <ArrowRight size={15} />
                  </button>
                </div>
                <div className="analysis-grid">
                  {analyses.slice(0, 3).map((a) => (
                    <AnalysisCard
                      key={a.id}
                      analysis={a}
                      onOpen={() => {
                        setActive(a);
                        setModal("detail");
                      }}
                      onStar={() => star(a.id)}
                    />
                  ))}
                </div>
              </section>

              <div className="bottom-grid">
                <section className="recommendations">
                  <div className="section-heading">
                    <h2>
                      <Sparkles size={18} className="accent-text" />
                      나를 위한 AI 추천
                    </h2>
                    <span className="subtle-label">샘플 추천</span>
                  </div>
                  <p className="section-description">
                    생산관리팀의 데이터로 시작할 수 있는 분석이에요.
                  </p>
                  {[
                    {
                      icon: ChartColumn,
                      color: "blue",
                      title: "생산 계획 대비 실적, 얼마나 달성했을까요?",
                      desc: "목표와 실적을 비교하고 주요 차이를 확인하세요.",
                      tag: "생산 분석",
                    },
                    {
                      icon: Workflow,
                      color: "sky",
                      title: "공정별 품질 편차를 한눈에",
                      desc: "공정별 수율을 비교해 개선 기회를 찾아보세요.",
                      tag: "품질 분석",
                    },
                    {
                      icon: Database,
                      color: "green",
                      title: "원자재 재고, 충분히 확보되어 있나요?",
                      desc: "재고 흐름을 파악하고 수급 리스크를 점검하세요.",
                      tag: "재고 분석",
                    },
                  ].map(({ icon: Icon, color, title, desc, tag }) => (
                    <button
                      className="recommendation-row"
                      key={title}
                      onClick={() => begin(title)}
                    >
                      <span className={`recommendation-icon ${color}`}>
                        <Icon size={21} />
                      </span>
                      <span className="recommendation-copy">
                        <strong>{title}</strong>
                        <small>{desc}</small>
                      </span>
                      <span className={`tag ${color}`}>{tag}</span>
                      <ChevronRight size={17} />
                    </button>
                  ))}
                </section>
                <section className="activity">
                  <div className="section-heading">
                    <h2>워크스페이스 소식</h2>
                    <span className="live-dot">최근 활동</span>
                  </div>
                  <div className="activity-list">
                    {[
                      {
                        icon: Database,
                        color: "blue",
                        title: "생산 데이터 업데이트",
                        text: "MES_일별생산실적 데이터가 갱신되었어요.",
                        time: "샘플 · 10분 전",
                        action: () => navigate("data"),
                      },
                      {
                        icon: ChartNoAxesCombined,
                        color: "green",
                        title: "새로운 분석이 공유되었어요",
                        text: "김민수님이 월간 생산 리포트를 게시했어요.",
                        time: "샘플 · 1시간 전",
                        action: () => navigate("reports"),
                      },
                      {
                        icon: Sparkles,
                        color: "sky",
                        title: "AI가 새로운 패턴을 발견했어요",
                        text: "A 공정의 생산 수율 추이를 확인해보세요.",
                        time: "샘플 · 2시간 전",
                        action: () => {
                          setActive(initialAnalyses[2]);
                          setModal("detail");
                        },
                      },
                    ].map(
                      ({ icon: Icon, color, title, text, time, action }) => (
                        <button
                          className="activity-row"
                          key={title}
                          onClick={action}
                        >
                          <span className={`activity-icon ${color}`}>
                            <Icon size={16} />
                          </span>
                          <span>
                            <strong>{title}</strong>
                            <p>{text}</p>
                            <small>{time}</small>
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                </section>
              </div>
              <div className="guide-banner">
                <span className="guide-art">
                  <BookOpen size={24} />
                </span>
                <div>
                  <strong>더 나은 분석을 위한 작은 시작</strong>
                  <p>
                    데이터 연결부터 인사이트 공유까지, 이용 가이드와
                    함께해보세요.
                  </p>
                </div>
                <button
                  className="button secondary"
                  onClick={() => setModal("help")}
                >
                  가이드 살펴보기
                  <ArrowUpRight size={15} />
                </button>
              </div>
            </>
          ) : (
            <>
              <section className="page-heading">
                <div>
                  <div className="eyebrow">
                    {view === "data"
                      ? "YOUR DATA, CONNECTED"
                      : "YOUR ANALYTICS SPACE"}
                  </div>
                  <h1>{pageTitle}</h1>
                  <p>
                    {view === "data"
                      ? "분석의 시작, 신뢰할 수 있는 데이터를 한곳에서."
                      : view === "settings"
                        ? "내 워크스페이스와 알림 환경을 관리하세요."
                        : "발견한 인사이트를 다시 살펴보고 다음 분석을 이어가세요."}
                  </p>
                </div>
                {view !== "settings" && (
                  <button className="button primary" onClick={() => begin()}>
                    <Plus size={18} />새 분석 만들기
                  </button>
                )}
              </section>
              {view === "settings" ? (
                <section className="settings-panel">
                  <h2>워크스페이스 정보</h2>
                  <dl>
                    <div>
                      <dt>이름</dt>
                      <dd>LS MnM · 생산 데이터 워크스페이스</dd>
                    </div>
                    <div>
                      <dt>사용자</dt>
                      <dd>홍길동 · 생산관리팀 (데모 프로필)</dd>
                    </div>
                    <div>
                      <dt>데이터 환경</dt>
                      <dd>
                        <span className="status published">샘플 데이터</span>
                      </dd>
                    </div>
                  </dl>
                  <h2>알림 설정</h2>
                  <label className="setting-toggle">
                    <span>
                      <strong>분석 업데이트 알림</strong>
                      <small>
                        이 브라우저에 알림 설정을 저장합니다. 이메일 발송은
                        연결되어 있지 않습니다.
                      </small>
                    </span>
                    <Checkbox
                      aria-label="분석 업데이트 알림"
                      checked={emailUpdates}
                      onCheckedChange={(checked) => {
                        setEmailUpdates(checked === true);
                        try {
                          localStorage.setItem(
                            "mnm-email",
                            String(checked === true),
                          );
                          setToast("알림 설정을 저장했습니다.");
                        } catch {
                          setToast("설정을 저장할 수 없습니다.");
                        }
                      }}
                    />
                  </label>
                  <div className="notice">
                    <ShieldCheck size={20} />
                    <span>
                      이 프로토타입은 샘플 데이터를 사용합니다. 실제 사내
                      데이터, AI 모델, 인증 서버와 연결되어 있지 않습니다.
                    </span>
                  </div>
                </section>
              ) : view === "data" ? (
                <>
                  <div className="list-toolbar">
                    <label className="search-input">
                      <Search size={18} />
                      <input
                        aria-label="데이터 검색"
                        placeholder="데이터 이름 검색"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </label>
                    <span className="subtle-label">
                      {datasets.length}개 샘플 · {savedDatasets.length}개 준비된
                      데이터셋
                    </span>
                  </div>
                  <div className="dataset-grid">
                    {visibleDatasets.map((d) => (
                        <button
                          className={`dataset-card ${previewData === d.id ? "selected" : ""}`}
                          aria-pressed={previewData === d.id}
                          key={d.id}
                          onClick={() => setPreviewData(d.id)}
                        >
                          <span className={`stat-icon ${d.color}`}>
                            <Database size={23} />
                          </span>
                          <span className="status published">사용 가능</span>
                          <h2>{d.title}</h2>
                          <p>{d.desc}</p>
                          <div>
                            <span>{d.team}</span>
                            <span>
                              {d.rows}행 · {d.cols}열
                            </span>
                          </div>
                          <span className="dataset-link">
                            샘플 데이터 미리보기
                            <ArrowRight size={15} />
                          </span>
                        </button>
                      ))}
                    {visibleSavedDatasets.map((d) => (
                        <button
                          className={`dataset-card ${previewData === d.id ? "selected" : ""}`}
                          aria-pressed={previewData === d.id}
                          key={d.id}
                          onClick={() => setPreviewData(d.id)}
                        >
                          <span className="stat-icon blue">
                            <FileSpreadsheet size={23} />
                          </span>
                          <span className="status published">
                            브라우저 저장
                          </span>
                          <h2>{d.name}</h2>
                          <p>{d.sources.join(" + ")}</p>
                          <div>
                            <span>{d.date}</span>
                            <span>
                              {d.rows.length.toLocaleString()}행 ·{" "}
                              {d.columns.length}열
                            </span>
                          </div>
                          <span className="dataset-link">
                            준비 결과 미리보기
                            <ArrowRight size={15} />
                          </span>
                        </button>
                      ))}
                  </div>
                  {visibleDatasets.length + visibleSavedDatasets.length === 0 && (
                    <div className="empty-state">
                      <Search size={32} aria-hidden="true" />
                      <h2>검색 결과가 없어요</h2>
                      <p>데이터 이름이나 설명의 다른 단어로 검색해보세요.</p>
                      <button className="button secondary" onClick={() => setQuery("")}>검색 초기화</button>
                    </div>
                  )}
                  {previewData &&
                    !savedDatasets.some((d) => d.id === previewData) && (
                      <section className="data-preview">
                        <div className="section-heading">
                          <h2>
                            {datasets.find((d) => d.id === previewData)?.title}{" "}
                            · 샘플 미리보기
                          </h2>
                          <button
                            className="text-button"
                            onClick={() => {
                              const source = preparationSources.find(
                                (s) => s.id === previewData,
                              );
                              if (source)
                                downloadDataset({
                                  name: source.title,
                                  columns: source.columns,
                                  rows: source.rows,
                                });
                            }}
                          >
                            <Download size={16} />
                            샘플 CSV 다운로드
                          </button>
                        </div>
                        <p className="section-description">
                          데이터 준비에서 사용하는 동일한 로컬 샘플입니다. 실제
                          사내 데이터 마트와 연결되어 있지 않습니다.
                        </p>
                        {preparationSources
                          .filter((s) => s.id === previewData)
                          .map((s) => (
                            <DatasetTable
                              key={s.id}
                              columns={s.columns}
                              rows={s.rows}
                            />
                          ))}
                      </section>
                    )}
                  {savedDatasets
                    .filter((d) => d.id === previewData)
                    .map((d) => (
                      <section className="data-preview" key={d.id}>
                        <div className="section-heading">
                          <h2>{d.name} · 준비 결과</h2>
                          <button
                            className="text-button"
                            onClick={() => downloadDataset(d)}
                          >
                            <Download size={16} />
                            결과 CSV 다운로드
                          </button>
                        </div>
                        <p className="section-description">
                          조회·연결·전처리가 적용된 실제 저장 결과입니다. 현재
                          브라우저에서만 보관됩니다.
                        </p>
                        <DatasetTable
                          columns={d.columns}
                          rows={d.rows}
                          pageSize={10}
                        />
                      </section>
                    ))}
                </>
              ) : (
                <>
                  <div className="list-toolbar">
                    <div className="filter-tabs" aria-label="분석 상태 필터">
                      {["전체", "게시됨", "임시저장"].map((f) => (
                        <button
                          key={f}
                          aria-pressed={filter === f}
                          className={filter === f ? "selected" : ""}
                          onClick={() => setFilter(f)}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                    <label className="search-input">
                      <Search size={18} />
                      <input
                        aria-label="분석 검색"
                        placeholder="분석 이름 검색"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </label>
                  </div>
                  <label className="select-field">정렬 <Select aria-label="분석 정렬" value={sort} onChange={e=>setSort(e.target.value)}><option value="recent">최근 저장순</option><option value="name">이름순</option></Select></label>
                  <p className="search-summary" role="status">{filtered.length}개의 분석{query.trim() ? ` · “${query.trim()}” 검색 결과` : ""}</p>
                  <div className="analysis-grid">
                    {filtered.map((a) => (
                      <AnalysisCard
                        key={a.id}
                        analysis={a}
                        onOpen={() => {
                          setActive(a);
                          setModal("detail");
                        }}
                        onStar={() => star(a.id)}
                      />
                    ))}
                  </div>
                  {filtered.length === 0 && (
                    <div className="empty-state">
                      <Search size={32} />
                      <h2>
                        {query.trim() || filter !== "전체"
                          ? "검색 조건에 맞는 분석이 없어요"
                          : view === "favorites"
                          ? "즐겨찾는 분석을 모아보세요"
                          : "아직 표시할 분석이 없어요"}
                      </h2>
                      <p>
                        {query.trim() || filter !== "전체"
                          ? "검색어 또는 상태 필터를 바꿔보세요."
                          : view === "favorites"
                          ? "분석 카드의 별을 누르면 여기에 표시됩니다."
                          : "검색 조건을 바꾸거나 새로운 분석을 시작해보세요."}
                      </p>
                      <button
                        className="button secondary"
                        onClick={() => {
                          setQuery("");
                          setFilter("전체");
                        }}
                      >
                        필터 초기화
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
          <footer className="main-footer">
            <span>데이터를 연결하고, 가능성을 발견하다.</span>
            <span>
              <ShieldCheck size={13} />
              MnM Insight · UI/UX 프로토타입
            </span>
          </footer>
        </main>
      </div>

      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
          <button aria-label="메시지 닫기" onClick={() => setToast("")}>
            <X size={15} />
          </button>
        </div>
      )}

      {modal && (
        <div
          className={editor ? "analysis-page" : "modal-overlay"}
          role={editor ? "main" : undefined}
          id={editor ? "main" : undefined}
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div
            ref={modalRef}
            tabIndex={-1}
            className={editor ? "analysis-editor" : `modal ${modal === "workflow" ? "workflow-modal" : ""}`}
            role={editor ? "region" : "dialog"}
            aria-modal={editor ? undefined : true}
            aria-labelledby="modal-title"
          >
            <header className="modal-header">
              <div>
                <span className="eyebrow">
                  {modal === "workflow"
                    ? "CREATE YOUR NEXT INSIGHT"
                    : modal === "help"
                      ? "GETTING STARTED"
                      : "ANALYSIS OVERVIEW"}
                </span>
                <h2 id="modal-title">
                  {modal === "workflow"
                    ? "새 분석 만들기"
                    : modal === "help"
                      ? "데이터에서 인사이트까지"
                      : active.title}
                </h2>
              </div>
              <button
                className={editor ? "button secondary" : "icon-button"}
                aria-label={editor ? "분석 목록으로" : "창 닫기"}
                onClick={() => editor ? router.push("/analyses") : setModal(null)}
              >
                {editor ? <span>목록으로</span> : <X size={23} />}
              </button>
            </header>
            {modal === "help" ? (
              <div className="help-content">
                <p>
                  다섯 단계로 분석을 시작해보세요. 언제든 임시저장하고 분석
                  목록에서 확인할 수 있습니다.
                </p>
                {steps.map((s, i) => (
                  <div className="guide-step" key={s}>
                    <span>{i + 1}</span>
                    <div>
                      <h3>{s}</h3>
                      <p>
                        {
                          [
                            "분석 이름과 목적을 정하거나, AI 질문으로 시작하세요.",
                            "데이터 불러오기·조회·연결·전처리·결과 확인·저장의 6단계를 진행하세요.",
                            "막대, 추이, 비교 차트 중 목적에 맞는 형식을 선택하세요.",
                            "시각화와 예시 인사이트를 함께 확인하세요.",
                            "분석을 이 브라우저에 게시하거나 샘플 CSV를 내려받으세요.",
                          ][i]
                        }
                      </p>
                    </div>
                  </div>
                ))}
                <div className="notice">
                  <CircleHelp size={20} />
                  <span>
                    AI 응답은 예시이며, 준비 데이터는 실제 집계합니다. 분석 설정과 작업 단계를 이 브라우저에 저장하고 복원합니다.
                  </span>
                </div>
                <button className="button primary" onClick={() => begin()}>
                  첫 분석 시작하기
                  <ArrowRight size={17} />
                </button>
              </div>
            ) : modal === "detail" ? (
              <div className="detail-content">
                <div className="detail-meta">
                  <span className="tag blue">{active.category}</span>
                  <span
                    className={`status ${active.status === "게시됨" ? "published" : "draft"}`}
                  >
                    {active.status}
                  </span>
                  <span>{active.date}</span>
                </div>
                <div className="chart-title">
                  <h3>{active.title}</h3>
                  <span className="subtle-label">
                    준비 데이터 집계 결과
                  </span>
                </div>
                {active.preparation ? <ResultChart preparation={active.preparation} x={active.x} y={active.y} aggregation={active.aggregation} variant={active.chart} /> : <MiniChart variant={active.chart} large />}
                <div className="notice">
                  <Sparkles size={20} />
                  <span>
                    <strong>인사이트 예시</strong>
                    <br />
                    데이터의 분포와 기간별 변화를 확인하세요. 실제 원인을 판단하려면 원본 데이터와 공정 조건을 함께 확인하세요.
                  </span>
                </div>
                {active.preparation ? <DatasetTable columns={evaluatePreparation(active.preparation).columns} rows={evaluatePreparation(active.preparation).rows} pageSize={10} /> : <DataTable />}
                <p>진행 단계: {steps[active.step ?? 0]} · {active.kind || "샘플 분석"}</p>
                <ul>{active.history?.map((h,i)=><li key={i}>{h}</li>)}</ul>
                <div className="detail-actions">
                  <button className="button secondary" onClick={() => resume(active, true)}>복제</button>
                  <button
                    className="button secondary"
                    onClick={() => {
                      star(active.id);
                      setActive({ ...active, starred: !active.starred });
                    }}
                  >
                    <Star
                      size={16}
                      fill={active.starred ? "currentColor" : "none"}
                    />
                    {active.starred ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                  </button>
                  <button className="button secondary" onClick={() => active.preparation ? downloadDataset({ name: active.title, ...evaluatePreparation(active.preparation) }) : download()}>
                    <Download size={16} />
                    샘플 CSV
                  </button>
                  <button
                    className="button primary"
                    onClick={() => resume(active)}
                  >
                    이어서 분석하기
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <ol className="workflow-steps">
                  {steps.map((s, i) => (
                    <li
                      className={
                        i === step ? "current" : i < step ? "completed" : ""
                      }
                      key={s}
                      aria-current={i === step ? "step" : undefined}
                    >
                      <span>{i < step ? <Check size={14} /> : i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
                <div className="workflow-body">
                  {step === 0 && (
                    <div className="setup-step">
                      <div className="step-title">
                        <span className="stat-icon sky">
                          <Sparkles size={24} />
                        </span>
                        <h3>어떤 인사이트를 찾고 싶으세요?</h3>
                        <p>
                          분석의 목적을 알려주시면, 적합한 데이터와 방법을
                          제안할게요.
                        </p>
                      </div>
                      <label className="field">
                        분석 이름 <span>*</span>
                        <input
                          ref={titleRef}
                          aria-invalid={!!error && !title.trim()}
                          aria-describedby={error && !title.trim() ? "analysis-error" : undefined}
                          placeholder="예: 9월 제품별 생산 실적 분석"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          maxLength={100}
                        />
                        <small>{title.length}/100</small>
                      </label>
                      <label className="field">분석 유형<Select value={kind} onChange={e=>setKind(e.target.value)}>{["원인 분석", "추이 모니터링", "비교 분석", "예측"].map(k=><option key={k}>{k}</option>)}</Select></label>
                      <label className="field">도메인<Select value={domain} onChange={e=>setDomain(e.target.value)}>{["생산 관리", "품질 관리", "설비 보전", "구매 · 자재", "물류 · 재고"].map(k=><option key={k}>{k}</option>)}</Select></label>
                      <label className="field">
                        분석 목적
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="확인하고 싶은 내용이나 해결할 문제를 입력하세요."
                          maxLength={500}
                        />
                      </label>
                      <div className="notice">
                        <Sparkles size={18} />
                        <span>처음이라면 추천 주제로 시작해보세요.</span>
                      </div>
                      <div className="setup-prompts">
                        {prompts.map((p) => (
                          <button
                            className="button secondary"
                            key={p}
                            onClick={() => {
                              setTitle(p);
                              setDescription(
                                "샘플 데이터로 " + p.replace("해줘", "합니다"),
                              );
                            }}
                          >
                            {p}
                            <ArrowUpRight size={13} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {step === 1 && (
                    <DataPreparation
                      state={preparation}
                      onChange={(next) => {
                        setPreparation(next);
                        setError("");
                      }}
                      onSave={(dataset) => {
                        setSavedDatasets((prev) => [
                          dataset,
                          ...prev.filter((d) => d.id !== dataset.id),
                        ]);
                        setError("");
                      }}
                    />
                  )}
                  {step === 2 && (
                    <>
                      <div className="step-section-heading">
                        <div>
                          <h3>데이터를 가장 잘 설명하는 차트를 선택하세요</h3>
                          <p>
                            준비 데이터를 선택한 축과 집계 방식으로 표시합니다.
                          </p>
                        </div>
                      </div>
                      <div className="chart-controls">
                        <label className="select-field">X축 <Select aria-label="X축" value={x} onChange={e=>setX(e.target.value)}><option value="">자동 선택</option>{evaluatePreparation(preparation).columns.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}</Select></label>
                        <label className="select-field">Y축 <Select aria-label="Y축" value={y} onChange={e=>setY(e.target.value)}><option value="">자동 선택</option>{evaluatePreparation(preparation).columns.filter(c=>c.type==="number").map(c=><option key={c.key} value={c.key}>{c.label}</option>)}</Select></label>
                        <label className="select-field">집계 <Select aria-label="집계 방식" value={aggregation} onChange={e=>setAggregation(e.target.value)}><option value="sum">합계</option><option value="avg">평균</option><option value="count">건수</option></Select></label>
                      </div>
                      <ChartGallery kind={kind} selected={selectedChartTypes} onChange={next=>{ setSelectedChartTypes(next); setChartType(next.includes("line") ? 1 : 0); setError(""); }} />
                      <div className="chart-preview">
                        <div className="chart-title">
                          <h3>{title}</h3>
                          <span className="tag blue">준비 데이터</span>
                        </div>
                        <ResultChart preparation={preparation} x={x} y={y} aggregation={aggregation} variant={chartType} />
                        
                      </div>
                    </>
                  )}
                  {step === 3 && (
                    <>
                      <div className="step-section-heading">
                        <div>
                          <h3>숫자 뒤에 숨은 이야기를 살펴보세요</h3>
                          <p>
                            다음은 인사이트 화면 구성을 보여주는 예시이며,
                            업로드 데이터의 분석 결과가 아닙니다.
                          </p>
                        </div>
                        <span className="tag sky">
                          <Sparkles size={13} />
                          인사이트 예시
                        </span>
                      </div>
                      <ResultChart preparation={preparation} x={x} y={y} aggregation={aggregation} variant={chartType} />
                      <div className="insight-cards">
                        <div>
                          <span className="stat-icon green">
                            <ChartNoAxesCombined size={20} />
                          </span>
                          <h4>추이 검토</h4>
                          <p>
                            시간 컬럼을 X축으로 선택하고 기간별 변화 방향을 확인하세요.
                          </p>
                        </div>
                        <div>
                          <span className="stat-icon blue">
                            <ListFilter size={20} />
                          </span>
                          <h4>계획 대비 편차 확인</h4>
                          <p>
                            실적과 계획을 함께 비교하면 개선이 필요한 구간을
                            찾을 수 있습니다.
                          </p>
                        </div>
                        <div>
                          <span className="stat-icon sky">
                            <Sparkles size={20} />
                          </span>
                          <h4>다음 분석 제안</h4>
                          <p>
                            제품별·공정별로 나누어 변화의 원인을 살펴보세요.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                  {step === 4 && (
                    <div className="publish-step">
                      <span className="publish-icon">
                        <Check size={32} />
                      </span>
                      <h3>새로운 인사이트를 발견했어요!</h3>
                      <p>
                        분석을 워크스페이스에 게시하고 언제든 다시 확인하세요.
                      </p>
                      <div className="publish-summary">
                        <strong>{title}</strong>
                        <p>{description || "분석 목적 미입력"}</p>
                        <div>
                          <span>데이터</span>
                          <strong>
                            {preparation.datasetName || "준비된 데이터셋"} ·{" "}
                            {evaluatePreparation(preparation).rows.length}행
                          </strong>
                        </div>
                        <div>
                          <span>차트</span>
                          <strong>
                            {chartTypes.filter(t=>selectedChartTypes.includes(t.id)).map(t=>t.name).join(" / ")}
                          </strong>
                        </div>
                        <div>
                          <span>공유 범위</span>
                          <strong>현재 브라우저 (로컬 데모)</strong>
                        </div>
                      </div>
                      <div className="notice">
                        <ShieldCheck size={20} />
                        <span>
                          분석 목적·유형·데이터 준비·차트 설정·작업 단계를 이 브라우저에 저장하고 복원합니다. 다른 사용자와의 공유는 연결되지 않았습니다.
                        </span>
                      </div>
                    </div>
                  )}
                  {error && (
                    <div id="analysis-error" className="form-error" role="alert">
                      {error}
                    </div>
                  )}
                </div>
                <footer className="workflow-footer">
                  <span>
                    <ShieldCheck size={15} />
                    샘플 데이터 · 브라우저 내 처리
                  </span>
                  <div>
                    {step > 0 && (
                      <button
                        className="button secondary"
                        onClick={() => {
                          setStep(step - 1);
                          setError("");
                        }}
                      >
                        이전
                      </button>
                    )}
                    <button
                      className="button secondary"
                      onClick={() => saveAnalysis(false)}
                    >
                      임시저장
                    </button>
                    <button
                      className="button primary"
                      onClick={() =>
                        step === 4 ? saveAnalysis(true) : nextStep()
                      }
                    >
                      {step === 4
                        ? "분석 게시하기"
                        : `다음: ${steps[step + 1]}`}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </footer>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AnalysisCard({
  analysis: a,
  onOpen,
  onStar,
}: {
  analysis: Analysis;
  onOpen: () => void;
  onStar: () => void;
}) {
  return (
    <article className="analysis-card">
      <div className="analysis-card-top">
        <span
          className={`tag ${a.chart === 1 ? "sky" : a.chart === 2 ? "green" : "blue"}`}
        >
          {a.category}
        </span>
        <button
          className={`star-button ${a.starred ? "starred" : ""}`}
          aria-label={`${a.title} ${a.starred ? "즐겨찾기 해제" : "즐겨찾기 추가"}`}
          aria-pressed={a.starred}
          onClick={onStar}
        >
          <Star size={17} fill={a.starred ? "currentColor" : "none"} />
        </button>
      </div>
      <button className="analysis-open" onClick={onOpen}>
        <h3>{a.title}</h3>
        <p>
          {a.description || (a.chart === 0
            ? "제품별 생산 추이와 계획 대비 달성률"
            : a.chart === 1
              ? "원자재 수급 흐름과 재고 변동 추이"
              : "주요 공정의 품질 지표와 수율 비교")}
        </p>
        <p className="analysis-card-context">{a.step !== undefined ? `${a.kind || "분석"} · ${steps[a.step]}` : "샘플 분석"}</p>
        <div className="analysis-card-chart">
          {a.preparation?.saved ? <ResultChart compact preparation={a.preparation} x={a.x} y={a.y} aggregation={a.aggregation} variant={a.chart} /> : <MiniChart variant={a.chart} />}
        </div>
      </button>
      <div className="analysis-card-footer">
        <span className="date">
          <Clock3 size={12} />
          {a.date}
        </span>
        <span
          className={`status ${a.status === "게시됨" ? "published" : "draft"}`}
        >
          <i />
          {a.status}
        </span>
      </div>
    </article>
  );
}
function DataTable() {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {[
              "일자",
              "제품코드",
              "제품명",
              "공정",
              "계획수량",
              "생산수량",
              "달성률",
            ].map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sampleRows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}



