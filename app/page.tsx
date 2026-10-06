"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
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
const datasets = [
  {
    id: "production",
    title: "MES_일별생산실적",
    desc: "제품 및 공정별 일일 생산 실적",
    team: "생산관리팀",
    rows: "124,578",
    cols: 12,
    icon: Database,
    color: "blue",
  },
  {
    id: "plan",
    title: "APS_생산계획",
    desc: "주간 · 월간 생산 계획과 목표 수량",
    team: "생산기획팀",
    rows: "24,512",
    cols: 8,
    icon: Database,
    color: "purple",
  },
  {
    id: "stock",
    title: "재고_현황",
    desc: "원자재 및 완제품의 현재 재고",
    team: "자재관리팀",
    rows: "8,320",
    cols: 10,
    icon: Database,
    color: "green",
  },
];
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
              <stop stopColor="#8972ed" stopOpacity=".2" />
              <stop offset="1" stopColor="#8972ed" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 100 C25 105 35 70 65 77 S105 105 135 65 S180 80 210 43 S245 77 270 46 S305 60 335 26 S370 35 400 10 L400 120 L0 120Z"
            fill={`url(#${gradientId})`}
          />
          <path
            d="M0 100 C25 105 35 70 65 77 S105 105 135 65 S180 80 210 43 S245 77 270 46 S305 60 335 26 S370 35 400 10"
            fill="none"
            stroke="#8972ed"
            strokeWidth="3"
          />
        </svg>
      ) : (
        <div className="bars">
          {[48, 66, 58, 81, 70, 96, 78, 88, 105, 90, 98, 115].map((n, i) => (
            <div className="bar-pair" key={i}>
              <span style={{ height: `${n / 1.3}%` }} />
              <span style={{ height: `${(n - (i % 3) * 10 - 8) / 1.3}%` }} />
            </div>
          ))}
        </div>
      )}
      <div className="axis">
        {(variant === 2
          ? ["A 공정", "B 공정", "C 공정", "D 공정", "E 공정", "F 공정"]
          : ["4월", "5월", "6월", "7월", "8월", "9월"]
        ).map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  const [view, setView] = useState<View>("home");
  const [analyses, setAnalyses] = useState(initialAnalyses);
  const [query, setQuery] = useState("");
  const [prompt, setPrompt] = useState("");
  const [modal, setModal] = useState<"workflow" | "detail" | "help" | null>(
    null,
  );
  const [active, setActive] = useState<Analysis>(initialAnalyses[0]);
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string[]>(["production"]);
  const [dataTab, setDataTab] = useState<"mart" | "upload">("mart");
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [chartType, setChartType] = useState(0);
  const [join, setJoin] = useState("LEFT JOIN");
  const [validated, setValidated] = useState(false);
  const [upload, setUpload] = useState<{
    name: string;
    rows: number;
    columns: string[];
    preview: string[][];
  } | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [chat, setChat] = useState("");
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
    } catch {}
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!modal) return;
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
  }, [modal]);
  const persist = (next: Analysis[]) => {
    setAnalyses(next);
    try {
      localStorage.setItem("mnm-analyses", JSON.stringify(next));
    } catch {
      setToast("브라우저 저장 공간에 접근할 수 없어 현재 세션에만 유지됩니다.");
    }
  };
  const navigate = (next: View) => {
    setView(next);
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
    setTitle(text);
    setDescription(
      text ? "샘플 데이터를 활용하여 주요 추이와 개선 기회를 탐색합니다." : "",
    );
    setStep(0);
    setError("");
    setValidated(false);
    setSelected(["production"]);
    setUpload(null);
    setDataTab("mart");
    setMode("ai");
    setMessages([]);
    setChat("");
    setChartType(0);
    setJoin("LEFT JOIN");
    setModal("workflow");
  };
  const saveAnalysis = (publish: boolean) => {
    if (!title.trim()) {
      setError("분석 이름을 입력해주세요.");
      setStep(0);
      return;
    }
    const next: Analysis = {
      id: Date.now(),
      title: title.trim(),
      category: "나의 분석",
      date: new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" })
        .format(new Date())
        .replaceAll("-", "."),
      status: publish ? "게시됨" : "임시저장",
      starred: false,
      chart: chartType,
    };
    persist([next, ...analyses]);
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
    if (step === 0 && !title.trim()) {
      setError("분석 이름을 입력해주세요.");
      return;
    }
    if (step === 1 && !(dataTab === "upload" ? upload : selected.length)) {
      setError("데이터를 하나 이상 선택해주세요.");
      return;
    }
    if (step === 1 && !validated) {
      setError("다음 단계로 이동하기 전에 데이터 검증을 실행해주세요.");
      return;
    }
    setStep((s) => Math.min(s + 1, 4));
  };
  const readCSV = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("CSV 파일을 선택해주세요.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("5MB 이하의 CSV 파일을 사용해주세요.");
      return;
    }
    const text = await file.text();
    const rows: string[][] = [];
    let row: string[] = [],
      field = "",
      quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (quoted && text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = !quoted;
      } else if (c === "," && !quoted) {
        row.push(field);
        field = "";
      } else if ((c === "\n" || c === "\r") && !quoted) {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field);
        if (row.some((v) => v.trim())) rows.push(row);
        row = [];
        field = "";
      } else field += c;
    }
    row.push(field);
    if (row.some((v) => v.trim())) rows.push(row);
    if (
      quoted ||
      rows.length < 2 ||
      rows[0].length < 2 ||
      rows.some((r) => r.length !== rows[0].length)
    ) {
      setError("헤더와 데이터가 있고 열 개수가 일치하는 CSV를 사용해주세요.");
      return;
    }
    setUpload({
      name: file.name,
      rows: rows.length - 1,
      columns: rows[0].map((c) => c.replace(/^\uFEFF/, "")),
      preview: rows.slice(1, 6),
    });
    setValidated(false);
    setError("");
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
  const filtered = analyses.filter(
    (a) =>
      (view !== "favorites" || a.starred) &&
      (view !== "reports" || a.status === "게시됨") &&
      (filter === "전체" || a.status === filter) &&
      a.title.toLowerCase().includes(query.toLowerCase()),
  );
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
    <div className="app-shell">
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
      <aside className={`sidebar ${mobileMenu ? "mobile-open" : ""}`}>
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
            <button
              key={id}
              className={`nav-item ${view === id ? "active" : ""}`}
              aria-current={view === id ? "page" : undefined}
              onClick={() => navigate(id)}
            >
              <Icon size={19} />
              {label}
              {id === "analyses" && (
                <span className="nav-count">{analyses.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <div className="nav-label">SUPPORT</div>
        <button className="nav-item" onClick={() => setModal("help")}>
          <BookOpen size={19} />
          이용 가이드
          <ArrowUpRight className="nav-end" size={14} />
        </button>
        <button
          className={`nav-item ${view === "settings" ? "active" : ""}`}
          onClick={() => navigate("settings")}
        >
          <Settings size={19} />
          설정
        </button>
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
              aria-label="메뉴 열기"
              onClick={() => setMobileMenu(true)}
            >
              <Menu size={22} />
            </button>
            <span>워크스페이스</span>
            <ChevronRight size={14} />
            <strong>{view === "home" ? "홈" : pageTitle}</strong>
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
                <span className="activity-icon purple">
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

        <main id="main" className="main-content">
          {view === "home" ? (
            <>
              <section className="page-heading">
                <div>
                  <div className="eyebrow">YOUR DAILY INSIGHT</div>
                  <h1>
                    안녕하세요, 홍길동님 <span className="wave">✦</span>
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
                  당신의 데이터 분석 파트너
                </div>
                <h2 id="hero-title">
                  궁금한 것을 물어보세요.
                  <br />
                  <span>인사이트는 AI가 찾아드릴게요.</span>
                </h2>
                <p>복잡한 쿼리 없이, 일상의 언어로 데이터를 탐색하세요.</p>
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
                    value: 3,
                    unit: "개",
                    icon: Database,
                    color: "purple",
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
                      <Sparkles size={18} className="purple-text" />
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
                      color: "purple",
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
                        color: "purple",
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
                    <input
                      type="checkbox"
                      checked={emailUpdates}
                      onChange={(e) => {
                        setEmailUpdates(e.target.checked);
                        try {
                          localStorage.setItem(
                            "mnm-email",
                            String(e.target.checked),
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
                      3개 샘플 데이터셋 · 2026.09.15 기준
                    </span>
                  </div>
                  <div className="dataset-grid">
                    {datasets
                      .filter((d) =>
                        `${d.title} ${d.desc}`
                          .toLowerCase()
                          .includes(query.toLowerCase()),
                      )
                      .map((d) => (
                        <button
                          className={`dataset-card ${previewData === d.id ? "selected" : ""}`}
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
                  </div>
                  {!datasets.some((d) =>
                    `${d.title} ${d.desc}`
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                  ) && (
                    <div className="empty-state">
                      <Search size={30} />
                      <h2>검색 결과가 없어요</h2>
                      <p>다른 데이터 이름으로 검색해보세요.</p>
                    </div>
                  )}
                  {previewData && (
                    <section className="data-preview">
                      <div className="section-heading">
                        <h2>
                          {datasets.find((d) => d.id === previewData)?.title} ·
                          샘플 미리보기
                        </h2>
                        <button className="text-button" onClick={download}>
                          <Download size={16} />
                          샘플 CSV 다운로드
                        </button>
                      </div>
                      <p className="section-description">
                        아래는 기능 확인용 공통 생산 샘플입니다. 실제 데이터셋과
                        연결되지 않았습니다.
                      </p>
                      <DataTable />
                    </section>
                  )}
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
                        {view === "favorites"
                          ? "즐겨찾는 분석을 모아보세요"
                          : "아직 표시할 분석이 없어요"}
                      </h2>
                      <p>
                        {view === "favorites"
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
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div
            ref={modalRef}
            tabIndex={-1}
            className={`modal ${modal === "workflow" ? "workflow-modal" : ""}`}
            role="dialog"
            aria-modal="true"
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
                className="icon-button"
                aria-label="창 닫기"
                onClick={() => setModal(null)}
              >
                <X size={23} />
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
                            "데이터 마트의 샘플을 선택하거나 CSV를 업로드하고 검증하세요.",
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
                    AI 응답과 차트는 샘플입니다. CSV는 브라우저에서만 읽으며
                    서버로 전송하지 않습니다. 저장 항목은 분석 이름·상태·차트
                    형식이며 실제 데이터나 작업 단계는 보관하지 않습니다.
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
                    샘플 시각화 · 실제 계산 결과 아님
                  </span>
                </div>
                <MiniChart variant={active.chart} large />
                <div className="notice">
                  <Sparkles size={20} />
                  <span>
                    <strong>인사이트 예시</strong>
                    <br />
                    전반적인 생산 추이는 상승하고 있습니다. 실제 원인을
                    판단하려면 원본 데이터와 공정 조건을 함께 확인하세요.
                  </span>
                </div>
                <DataTable />
                <div className="detail-actions">
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
                  <button className="button secondary" onClick={download}>
                    <Download size={16} />
                    샘플 CSV
                  </button>
                  <button
                    className="button primary"
                    onClick={() => begin(active.title)}
                  >
                    이 주제로 새 분석
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
                        <span className="stat-icon purple">
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
                          placeholder="예: 9월 제품별 생산 실적 분석"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          maxLength={100}
                        />
                        <small>{title.length}/100</small>
                      </label>
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
                    <>
                      <div className="step-section-heading">
                        <div>
                          <h3>분석에 사용할 데이터를 준비하세요</h3>
                          <p>
                            데이터 선택 → 연결 설정 → 검증을 한 화면에서
                            진행합니다.
                          </p>
                        </div>
                        <div className="segmented">
                          <button
                            className={mode === "ai" ? "selected" : ""}
                            onClick={() => setMode("ai")}
                          >
                            <Sparkles size={14} />
                            AI 가이드
                          </button>
                          <button
                            className={mode === "manual" ? "selected" : ""}
                            onClick={() => setMode("manual")}
                          >
                            직접 설정
                          </button>
                        </div>
                      </div>
                      <div className="data-workspace">
                        <section className="data-source-panel">
                          <div className="filter-tabs">
                            <button
                              className={dataTab === "mart" ? "selected" : ""}
                              onClick={() => {
                                setDataTab("mart");
                                setValidated(false);
                                setError("");
                              }}
                            >
                              데이터 마트
                            </button>
                            <button
                              className={dataTab === "upload" ? "selected" : ""}
                              onClick={() => {
                                setDataTab("upload");
                                setValidated(false);
                                setError("");
                              }}
                            >
                              CSV 업로드
                            </button>
                          </div>
                          {dataTab === "mart" ? (
                            <div className="source-list">
                              {datasets.map((d) => (
                                <label
                                  key={d.id}
                                  className={`source-option ${selected.includes(d.id) ? "checked" : ""}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selected.includes(d.id)}
                                    onChange={() => {
                                      setSelected(
                                        selected.includes(d.id)
                                          ? selected.filter((id) => id !== d.id)
                                          : [...selected, d.id],
                                      );
                                      setValidated(false);
                                    }}
                                  />
                                  <span className={`stat-icon ${d.color}`}>
                                    <Database size={18} />
                                  </span>
                                  <span>
                                    <strong>{d.title}</strong>
                                    <small>{d.desc}</small>
                                    <small>
                                      {d.rows}행 · {d.cols}열
                                    </small>
                                  </span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <div className="upload-panel">
                              <Upload size={32} />
                              <h4>CSV 파일을 선택하세요</h4>
                              <p>
                                UTF-8 인코딩 · 최대 5MB
                                <br />
                                파일은 서버에 업로드되지 않습니다.
                              </p>
                              <label className="button secondary upload-label">
                                파일 선택
                                <input
                                  type="file"
                                  accept=".csv,text/csv"
                                  onChange={(e) => {
                                    void readCSV(e.target.files?.[0]);
                                    e.target.value = "";
                                  }}
                                />
                              </label>
                              {upload && (
                                <div className="uploaded-file">
                                  <FileSpreadsheet size={17} />
                                  {upload.name}
                                  <small>
                                    {upload.rows}행 · {upload.columns.length}열
                                  </small>
                                </div>
                              )}
                            </div>
                          )}
                        </section>
                        <section className="data-guide-panel">
                          {mode === "ai" ? (
                            <>
                              <div className="ai-panel-heading">
                                <Sparkles size={18} />
                                AI 데이터 가이드 <span>샘플</span>
                              </div>
                              <div className="chat-bubble">
                                생산 실적 분석에는{" "}
                                <strong>MES_일별생산실적</strong>을 추천해요.
                                계획 대비 달성률을 보려면{" "}
                                <strong>APS_생산계획</strong>도 선택해주세요.
                              </div>
                              <div className="suggestion-box">
                                <span>
                                  <Zap size={15} />
                                  추천 연결 방법
                                </span>
                                <strong>제품코드 기준 · {join}</strong>
                                <p>
                                  생산 실적을 유지하며 계획 데이터를 연결합니다.
                                </p>
                                <button
                                  className="button primary"
                                  onClick={() => {
                                    setSelected(["production", "plan"]);
                                    setDataTab("mart");
                                    setJoin("LEFT JOIN");
                                    setValidated(false);
                                    setToast(
                                      "추천 데이터와 연결 설정을 적용했습니다.",
                                    );
                                  }}
                                >
                                  추천 적용
                                  <Check size={15} />
                                </button>
                              </div>
                              {messages.map((m, i) => (
                                <div key={i} className="chat-pair">
                                  <div className="chat-user">{m}</div>
                                  <div className="chat-bubble">
                                    이 데모에서는 제품코드 기준의 LEFT JOIN을
                                    제안해요. 실제 AI 요청은 전송되지 않습니다.
                                    직접 설정에서 연결 방식을 바꿀 수 있어요.
                                  </div>
                                </div>
                              ))}
                              <form
                                className="chat-input"
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  if (chat.trim()) {
                                    setMessages([...messages, chat.trim()]);
                                    setChat("");
                                  }
                                }}
                              >
                                <input
                                  aria-label="데이터 가이드 질문"
                                  value={chat}
                                  onChange={(e) => setChat(e.target.value)}
                                  placeholder="데이터에 대해 물어보세요"
                                  maxLength={300}
                                />
                                <button
                                  aria-label="질문 보내기"
                                  disabled={!chat.trim()}
                                >
                                  <Send size={17} />
                                </button>
                              </form>
                            </>
                          ) : (
                            <>
                              <h4>데이터 연결 설정</h4>
                              <label className="field">
                                연결 방식
                                <select
                                  value={join}
                                  onChange={(e) => {
                                    setJoin(e.target.value);
                                    setValidated(false);
                                  }}
                                >
                                  <option>LEFT JOIN</option>
                                  <option>INNER JOIN</option>
                                </select>
                              </label>
                              <label className="field">
                                연결 기준
                                <select disabled>
                                  <option>제품코드 (product_code)</option>
                                </select>
                                <small>샘플 데이터의 연결 키입니다.</small>
                              </label>
                              <div className="notice">
                                <Workflow size={18} />
                                <span>
                                  연결 설정은 프로토타입 상태로만 유지되며 실제
                                  데이터 병합은 실행되지 않습니다.
                                </span>
                              </div>
                            </>
                          )}
                        </section>
                      </div>
                      <section className="data-preview compact">
                        <div className="section-heading">
                          <h4>
                            {dataTab === "upload" && upload
                              ? "업로드 데이터 미리보기"
                              : "생산 샘플 데이터 미리보기"}
                          </h4>
                          <span className="subtle-label">최대 5행 표시</span>
                        </div>
                        {dataTab === "upload" && upload ? (
                          <div className="table-scroll">
                            <table>
                              <thead>
                                <tr>
                                  {upload.columns.map((c, i) => (
                                    <th key={i}>{c}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {upload.preview.map((r, i) => (
                                  <tr key={i}>
                                    {r.map((c, j) => (
                                      <td key={j}>{c}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <DataTable />
                        )}
                      </section>
                      <div className="validation-bar">
                        <span className={validated ? "validation-success" : ""}>
                          {validated ? (
                            <>
                              <ShieldCheck size={19} />
                              형식 검증 완료 ·{" "}
                              {dataTab === "upload"
                                ? "CSV 열 구조 정상"
                                : "샘플 데이터 정상"}{" "}
                              (실제 병합 미실행)
                            </>
                          ) : (
                            <>
                              <ListFilter size={18} />
                              {dataTab === "upload"
                                ? upload
                                  ? `${upload.rows}행 선택됨`
                                  : "업로드한 파일 없음"
                                : `${selected.length}개 데이터 선택됨`}{" "}
                              · 다음 단계 전에 검증하세요
                            </>
                          )}
                        </span>
                        <button
                          className="button secondary"
                          disabled={
                            dataTab === "upload" ? !upload : !selected.length
                          }
                          onClick={() => {
                            setValidated(true);
                            setError("");
                          }}
                        >
                          데이터 검증
                          <ShieldCheck size={16} />
                        </button>
                      </div>
                    </>
                  )}
                  {step === 2 && (
                    <>
                      <div className="step-section-heading">
                        <div>
                          <h3>데이터를 가장 잘 설명하는 차트를 선택하세요</h3>
                          <p>
                            미리보기는 업로드 데이터와 별개인 고정 샘플입니다.
                          </p>
                        </div>
                      </div>
                      <div className="chart-choices">
                        {[
                          "생산 실적 비교",
                          "월별 추이",
                          "공정별 품질 비교",
                        ].map((c, i) => (
                          <button
                            key={c}
                            className={chartType === i ? "selected" : ""}
                            aria-pressed={chartType === i}
                            onClick={() => setChartType(i)}
                          >
                            {i === 1 ? (
                              <ChartNoAxesCombined size={23} />
                            ) : (
                              <ChartColumn size={23} />
                            )}
                            <strong>{c}</strong>
                            {chartType === i && <Check size={16} />}
                          </button>
                        ))}
                      </div>
                      <div className="chart-preview">
                        <div className="chart-title">
                          <h3>{title}</h3>
                          <span className="tag blue">샘플 미리보기</span>
                        </div>
                        <MiniChart variant={chartType} large />
                        <div className="chart-legend">
                          <span>
                            <i /> {chartType === 2 ? "A 공정" : "생산 실적"}
                          </span>
                          {chartType !== 1 && (
                            <span>
                              <i />
                              {chartType === 2 ? "B 공정" : "생산 계획"}
                            </span>
                          )}
                        </div>
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
                        <span className="tag purple">
                          <Sparkles size={13} />
                          인사이트 예시
                        </span>
                      </div>
                      <MiniChart variant={chartType} large />
                      <div className="insight-cards">
                        <div>
                          <span className="stat-icon green">
                            <ChartNoAxesCombined size={20} />
                          </span>
                          <h4>생산 추이 상승</h4>
                          <p>
                            월별 실적 차트에서 전반적인 상승 흐름을 확인할 수
                            있습니다.
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
                          <span className="stat-icon purple">
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
                            {dataTab === "upload"
                              ? upload?.name
                              : selected
                                  .map(
                                    (id) =>
                                      datasets.find((d) => d.id === id)?.title,
                                  )
                                  .join(", ")}
                          </strong>
                        </div>
                        <div>
                          <span>차트</span>
                          <strong>
                            {
                              [
                                "생산 실적 비교",
                                "월별 추이",
                                "공정별 품질 비교",
                              ][chartType]
                            }
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
                          게시하면 이름·날짜·상태·차트 형식만 브라우저에
                          저장합니다. 파일과 작업 단계는 보관하지 않으며 다른
                          사용자에게 공유되지 않습니다.
                        </span>
                      </div>
                    </div>
                  )}
                  {error && (
                    <div className="form-error" role="alert">
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
          className={`tag ${a.chart === 1 ? "purple" : a.chart === 2 ? "green" : "blue"}`}
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
          {a.chart === 0
            ? "제품별 생산 추이와 계획 대비 달성률"
            : a.chart === 1
              ? "원자재 수급 흐름과 재고 변동 추이"
              : "주요 공정의 품질 지표와 수율 비교"}
        </p>
        <MiniChart variant={a.chart} />
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
