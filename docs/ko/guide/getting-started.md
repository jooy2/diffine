---
title: 시작하기
order: 1
---

# 시작하기

Diffine은 프레임워크마다 패키지를 하나씩 냅니다. 지금은 React뿐이고, 이 문서에 화면에 비교 결과를 띄우기까지 필요한 내용이 전부 있습니다.

## 필요한 것

- **React 18 또는 19**와 `react-dom`. 둘 다 peer dependency입니다.
- 빌드용 **Node.js 20.19 이상**.
- `ResizeObserver`를 지원하는 브라우저. 요즘 브라우저는 모두 지원합니다. 없어도 화면은 그려지고, 창 크기가 바뀔 때 다시 재는 일만 멈춥니다.

## 설치

```bash
npm install diffine-react
```

`react`와 `react-dom`은 peer dependency라 프로젝트에 이미 있는 것을 그대로 씁니다. 그 밖에 딸려 오는 패키지는 없습니다.

## 비교 결과 그리기

prop 두 개와 스타일시트 한 줄이면 됩니다.

```tsx
import { TextDiff } from 'diffine-react';
import 'diffine-react/styles.css';

export function Review({ saved, draft }: { saved: string; draft: string }) {
  return <TextDiff before={saved} after={draft} />;
}
```

<DiffineDemo sample="code" />

스타일시트는 애플리케이션 어디서든 한 번만 불러오면 됩니다. `.diffine` 밖으로 나가는 규칙이 하나도 없어서 import 순서 어디에 두든 상관없습니다.

### 양쪽에 이름 붙이기

문자열만 넘기면 그게 문서입니다. 객체로 넘기면 이름도 같이 붙고, 그 이름이 각 창 위에 표시됩니다.

```tsx
<TextDiff before={{ content: saved, label: 'v1.2' }} after={{ content: draft, label: '작업본' }} />
```

### 높이 정하기

기본 높이는 `24rem`이고 그 안에서 스크롤합니다. 엘리먼트에 직접 높이를 주거나, 기본값이 나오는 커스텀 속성을 바꾸세요.

```tsx
<TextDiff before={saved} after={draft} style={{ height: '40rem' }} />
```

```css
.diffine {
  --diffine-height: 40rem;
}
```

`--diffine-height: auto`로 두면 비교 결과만큼 높아지고, 스크롤은 페이지가 맡습니다.

## 다음에 볼 것

- [**텍스트 비교**](./text-diff) — 화면의 각 요소와 고쳐 쓰는 모드, 그리고 그것을 켜고 끄는 prop.
- [**비교 결과**](./diff) — 엔진이 무엇을 돌려주는지, 아무것도 그리지 않고 읽는 방법.
- [**API**](../api/) — 내보내는 것과 함수와 옵션 전부.
