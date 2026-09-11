---
title: 시작하기
order: 1
---

# 시작하기

Diffine은 프레임워크마다 패키지를 하나씩 내지만, 둘은 같은 라이브러리입니다. 엔진도 비교 결과를 읽는 방식도 색상값까지의 팔레트도 같습니다. 쓰는 쪽을 사이드바에서 고르세요. 메뉴 위에 있는 전환기가 이 사이트 모든 문서의 내용을 바꿉니다.

|  |  |  |
| --- | --- | --- |
| **React** | npm의 [`diffine-react`](https://www.npmjs.com/package/diffine-react) | 뷰어와 에디터, 그리고 엔진 |
| **Flutter** | pub.dev의 [`diffine`](https://pub.dev/packages/diffine) | 뷰어와 에디터, 그리고 엔진 |

## 필요한 것

::: fw react

- **React 18 또는 19**와 `react-dom`. 둘 다 peer dependency입니다.
- 빌드용 **Node.js 20.19 이상**.
- `ResizeObserver`를 지원하는 브라우저. 요즘 브라우저는 모두 지원합니다. 없어도 화면은 그려지고, 창 크기가 바뀔 때 다시 재는 일만 멈춥니다.

:::

::: fw flutter

- **Flutter 3.32 이상**과 함께 딸려 오는 Dart SDK.
- 그 밖에는 없습니다. 패키지가 Material도 Cupertino도 불러오지 않아서 `MaterialApp`, `CupertinoApp`, 맨 `WidgetsApp` 어디에 넣어도 디자인 시스템이 하나 더 딸려 오지 않습니다.

:::

## 설치

::: fw react

```bash
npm install diffine-react
```

`react`와 `react-dom`은 peer dependency라 프로젝트에 이미 있는 것을 그대로 씁니다. 딸려 오는 것은 `highlight.js` 하나이고, 그마저도 `import()` 뒤에 있어서 `language="plain"`인 컴포넌트는 아무것도 내려받지 않습니다.

:::

::: fw flutter

```bash
flutter pub add diffine
```

딸려 오는 것은 Dart 팀이 만든 [`characters`](https://pub.dev/packages/characters) 하나이고, Flutter가 이미 함께 배포하는 패키지입니다. 글자 단위 비교에서 이모지를 조각으로 쪼개면 글리프 절반만 바뀐 것으로 표시되기 때문입니다.

:::

## 비교 결과 그리기

::: fw react

prop 두 개와 스타일시트 한 줄이면 됩니다.

```tsx
import { TextDiff } from 'diffine-react/text-diff';
import 'diffine-react/styles.css';

export function Review({ saved, draft }: { saved: string; draft: string }) {
  return <TextDiff before={saved} after={draft} />;
}
```

:::

::: fw flutter

인자 두 개와 import 한 줄이면 됩니다.

```dart
import 'package:diffine/diffine.dart';

Widget review(String saved, String draft) {
  return TextDiff(before: saved, after: draft);
}
```

:::

<DiffineDemo sample="code" />

::: fw react

스타일시트는 애플리케이션 어디서든 한 번만 불러오면 됩니다. `.diffine` 밖으로 나가는 규칙이 없어서 import 순서는 상관없습니다.

:::

::: fw flutter

따로 연결할 것은 없습니다. 팔레트가 전역이 아니라 위젯을 따라다녀서, 밝은 화면 안에 어두운 비교 하나만 둘 수도 있습니다.

:::

### 양쪽에 이름 붙이기

::: fw react

문자열만 넘기면 그게 문서입니다. 객체로 넘기면 이름도 함께 지정할 수 있고, 그 이름이 각 창 위에 표시됩니다.

```tsx
<TextDiff before={{ content: saved, label: 'v1.2' }} after={{ content: draft, label: '작업본' }} />
```

:::

::: fw flutter

문서와 이름은 각각 다른 인자입니다. 이름은 각 창 위에 표시됩니다.

```dart
TextDiff(
  before: saved,
  beforeLabel: 'v1.2',
  after: draft,
  afterLabel: '작업본',
);
```

:::

### 높이 정하기

::: fw react

기본 높이는 `24rem`이고 그 안에서 스크롤합니다. 엘리먼트에 직접 높이를 주거나, 기본값이 나오는 커스텀 속성을 바꾸세요.

```tsx
<TextDiff before={saved} after={draft} style={{ height: '40rem' }} />
```

```css
.diffine {
  --diffine-height: 40rem;
}
```

`--diffine-height: auto`로 두면 비교 결과 높이만큼 늘어나고, 스크롤은 페이지가 맡습니다.

:::

::: fw flutter

기본 높이는 논리 픽셀 384이고 그 안에서 스크롤합니다. 직접 높이를 주거나, 감싼 위젯의 높이를 전부 쓰게 하세요.

```dart
TextDiff(before: saved, after: draft, height: 640);

Expanded(child: TextDiff(before: saved, after: draft, height: double.infinity));
```

같은 값이 테마에도 있어서, 호출할 때마다 적지 않고 한 곳에서 정할 수 있습니다.

```dart
TextDiff(
  before: saved,
  after: draft,
  theme: DiffineTheme.light.copyWith(height: 640),
);
```

:::

## 다음에 볼 것

- [**텍스트 비교**](./text-diff) — 화면의 각 요소와 고쳐 쓰는 모드, 그리고 그것을 켜고 끄는 <Fw react="prop" flutter="인자" />.
- [**이미지 비교**](./image-diff) — 두 이미지를 픽셀 단위로 비교하고 읽는 방법.
- [**비교 결과**](./diff) — 엔진이 무엇을 돌려주는지, 아무것도 그리지 않고 읽는 방법.
- [**API**](../api/) — 내보내는 것과 함수와 옵션 전부.
