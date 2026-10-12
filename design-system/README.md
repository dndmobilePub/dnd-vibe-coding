# MnM Insight Design System

현재 화면의 Light 테마를 기준으로 만든 공통 라이브러리입니다.

## React 사용

```tsx
import { Button, IconButton, Checkbox, Select, Input, Textarea } from "@/app/components/ui";
import { Plus } from "lucide-react";

<Button variant="primary">저장</Button>
<Button variant="secondary" disabled>취소</Button>
<IconButton aria-label="분석 추가"><Plus size={16} /></IconButton>
<Checkbox aria-label="전체 선택" checked="indeterminate" />
<Select aria-label="분석 유형"><option>기초 통계</option></Select>
<Input aria-label="분석 이름" aria-invalid={false} />
<Textarea aria-label="분석 목적" />
```

- 버튼 기본 `type`은 `button`입니다. 폼 전송은 `type="submit"`을 명시합니다.
- 모든 컴포넌트는 원래 HTML/Radix props와 React 19의 `ref`를 전달합니다.
- Checkbox는 controlled/uncontrolled, checked/unchecked/indeterminate를 지원합니다.
- 입력 컨트롤의 label, 오류 설명(`aria-describedby`), 검증 로직은 사용하는 화면에서 제공합니다.
- 기존 Checkbox/Select import 경로도 유지됩니다. 기존 화면의 공통 버튼은 Button을 사용합니다.
- Input/Textarea는 기존 field 스타일을 바탕으로 추출했습니다. 검색창 등 특수 레이아웃의 입력은 자동 교체하지 않았습니다.
- CSS는 현재 Next.js 루트의 globals.css에서 로드합니다. 다른 프로젝트에서 사용할 때 `tokens.css`와 해당 컴포넌트 스타일, Noto Sans KR 폰트, Radix Checkbox 및 lucide-react가 필요합니다. 별도 npm 패키지는 만들지 않았습니다.

## 토큰 관리

`tokens.json` → `tokens.css`와 Figma 플러그인 `code.js`를 생성합니다.

```sh
node scripts/export-design-system.cjs
```

색상과 숫자 원시값 → 의미 토큰 → 컴포넌트 토큰의 세 단계입니다. 기존 `--blue`, `--ink`, `--space-*` 이름을 보존합니다. 원시값을 바꾸면 코드와 다음 Figma 생성에 함께 반영됩니다. 다크 테마는 현재 범위에 없습니다.

## Figma

대상: https://www.figma.com/design/ZHOemrpiqV4w6m4tfUYtWh

파일은 생성했지만 Starter MCP 호출 한도로 컴포넌트 작성이 차단됐습니다. 파일 내부 변환은 아직 완료되지 않았습니다.

호출 한도 해제 후 연결 도구로 생성하거나, Figma 데스크톱에서 다음 플러그인을 실행할 수 있습니다.

1. 대상 파일을 열고 Plugins → Development → Import plugin from manifest에서 `design-system/figma-plugin/manifest.json`을 선택합니다.
2. `MnM Insight Design System`을 실행합니다.
3. Foundations와 Components 페이지에서 토큰, 타이포 스타일, 인스턴스 예시를 확인합니다.

플러그인은 네트워크를 사용하지 않고 기존 페이지를 수정하지 않습니다. 이미 `MnM · Components`가 있으면 중복 생성을 중단합니다. 중간 오류가 발생했다면 Undo로 이번 생성을 되돌린 다음 원인을 확인하세요. Noto Sans KR 폰트가 없으면 Inter를 사용하고 Foundations에 대체 사실을 표시합니다.

| React export | Figma component | 속성/상태 |
| --- | --- | --- |
| Button | Button | Primary/Secondary × Default/Hover/Focus/Disabled |
| IconButton | IconButton | Default/Hover/Focus/Disabled, 추가 아이콘 예시 |
| Checkbox | Checkbox | Unchecked/Checked/Indeterminate × Default/Hover/Focus/Disabled |
| Select | Select | Default/Hover/Focus/Disabled/Invalid, Label |
| Input | Input | Default/Hover/Focus/Disabled/Invalid, Label |
| Textarea | Textarea | Default/Hover/Focus/Disabled/Invalid, Label |

Figma 상태는 설계용 표현입니다. 코드에서는 hover/focus, disabled, aria-invalid, checked 속성으로 상태가 결정됩니다. Code Connect 게시와 팀 라이브러리 Publish는 수행하지 않았습니다.

## 확인할 항목

- 기존 버튼의 클릭·폼 전송과 disabled 동작
- 체크박스 선택·부분 선택·키보드 포커스
- 셀렉트/입력의 포커스·오류·모바일 레이아웃
- Figma 플러그인 실행 후 6개 컴포넌트 세트, 총 39개 변형과 토큰 바인딩

빌드·타입 검사·테스트·브라우저 검증 및 Figma 플러그인 실행 검증은 수행하지 않았습니다.
