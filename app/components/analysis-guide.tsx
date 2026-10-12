"use client";
import { Button } from "./ui/button";
import { useEffect, useRef, useState } from "react";
import { Bot, Check, Send, Sparkles } from "lucide-react";
import { preparationSources, sourcesFor, type PreparationState } from "@/lib/data-preparation";

const guidance = [
  "분석 이름과 목적을 입력하고 분석 유형을 선택해보세요.",
  "",
  "분석 목적에 맞는 차트 유형과 축, 집계 방식을 선택해보세요.",
  "차트의 주요 변화와 이상치를 확인하고 인사이트를 정리해보세요.",
  "분석 설정과 결과를 최종 확인한 뒤 저장하거나 게시해보세요.",
];
export function AnalysisGuide({ step, state, onChange, onNotify }: { step: number; state: PreparationState; onChange: (next: PreparationState) => void; onNotify: (message: string) => void }) {
  const [chat, setChat] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const setError = (message: string) => { if (message) onNotify(message); };
  const all = sourcesFor(state);
  const main = all.find(s => s.id === state.main);
  const related = all.find(s => s.id === state.related);
  const update = (patch: Partial<PreparationState>) => {
    onChange({ ...state, ...patch, saved: false, reviewed: false });
    setError("");
  };
  const threadRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const thread = threadRef.current;
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, [messages]);
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
  return (
          <aside className="preparation-ai" aria-label="AI 준비 가이드">
            <div className="ai-panel-heading">
              <Bot size={24} aria-hidden="true" />
              <div><strong>AI 준비 가이드</strong><small>단계별 준비 도우미 · 예시 응답</small></div>
            </div>
            <div className="preparation-chat-thread" ref={threadRef} role="log" aria-label="데이터 준비 대화" aria-relevant="additions">
            <div className="preparation-chat-message">
              <span className="chat-avatar robot-avatar" aria-label="AI"><Bot size={20} aria-hidden="true" /></span>
              <div className="chat-message-content"><div className="chat-bubble">
              {
                step === 1 ? [
                  "생산 실적과 제품 마스터를 함께 선택하면 제품 분류별 분석을 할 수 있어요.",
                  "생산일자·제품코드·생산수량은 주요 조회 컬럼이에요. 필요한 범위로 필터를 설정해보세요.",
                  "제품코드로 LEFT JOIN하면 제품 마스터에 없는 실적도 유지할 수 있어요.",
                  "샘플에는 빈 공정과 중복 실적이 있어요. 결측 제외·중복 제거 옵션으로 정리해보세요.",
                  "숫자 형식 오류는 저장 전에 해결해야 해요. 결측·중복 경고도 함께 확인하세요.",
                  "알아보기 쉬운 이름으로 저장하면 데이터 라이브러리에서 다시 사용할 수 있어요.",
                ][state.stage] : guidance[step]
              }
            </div></div></div>
            {step === 1 && state.stage === 0 && (
              <div className="suggestion-box">
                <span>
                  <Sparkles size={14} />
                  추천 데이터
                </span>
                <strong>MES_일별생산실적 + 제품_마스터</strong>
                <p>제품 분류와 규격을 실적에 연결합니다.</p>
                <Button variant="primary" onClick={recommend}>
                  추천 적용
                  <Check size={14} />
                </Button>
              </div>
            )}
            {step === 1 && state.stage === 2 && (
              <Button
                variant="secondary" className="ai-apply"
                onClick={() => {
                  const key = main?.columns.find((c) =>
                    related?.columns.some((r) => r.key === c.key),
                  );
                  if (!key) {
                    setError("공통 컬럼이 없어 키를 직접 선택해야 합니다.");
                    return;
                  }
                  update({
                    joinType: "LEFT JOIN",
                    keys: [{ left: key.key, right: key.key }],
                  });
                }}
              >
                공통 키 추천 적용
              </Button>
            )}
            {step === 1 && state.stage === 1 && (
              <Button
                variant="secondary" className="ai-apply"
                onClick={() => {
                  const recommended =
                    main?.columns
                      .filter((c) =>
                        [
                          "date",
                          "product_code",
                          "process",
                          "quantity",
                          "planned",
                        ].includes(c.key),
                      )
                      .map((c) => c.key) || [];
                  update({
                    selectedColumns: recommended.length
                      ? recommended
                      : main?.columns.map((c) => c.key) || [],
                  });
                }}
              >
                추천 컬럼 적용
                <Check size={14} />
              </Button>
            )}
            {step === 1 && state.stage === 3 && (
              <Button
                variant="secondary" className="ai-apply"
                onClick={() => update({ dropMissing: true, deduplicate: true })}
              >
                추천 정리 적용
                <Check size={14} />
              </Button>
            )}
            {messages.map((m, i) => (
              <div className="chat-pair" key={i}>
                <div className="preparation-chat-message user-message">
                  <div className="chat-message-content"><div className="chat-user">{m}</div></div>
                  <span className="chat-avatar user-avatar" aria-label="홍길동">홍</span>
                </div>
                <div className="preparation-chat-message">
                  <span className="chat-avatar robot-avatar" aria-label="AI"><Bot size={20} aria-hidden="true" /></span>
                  <div className="chat-message-content"><div className="chat-bubble">
                  현재 단계의 설정을 확인하고 적용해주세요. 이 안내는 예시
                  응답이며 실제 AI 요청은 전송하지 않습니다.
                </div></div></div>
              </div>
            ))}
            </div>
            <form
              className="chat-input"
              onSubmit={(e) => {
                e.preventDefault();
                if (chat.trim()) {
                  setMessages(previous => [...previous, chat.trim()]);
                  setChat("");
                }
              }}
            >
              <input
                aria-label="데이터 가이드 질문"
                value={chat}
                maxLength={300}
                onChange={(e) => setChat(e.target.value)}
                placeholder="준비 방법을 물어보세요"
              />
              <button aria-label="질문 보내기" disabled={!chat.trim()}>
                <Send size={16} />
              </button>
            </form>
          </aside>
  );
}
