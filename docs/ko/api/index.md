---
title: API
order: 1
---

# API

`diffine-react`가 내보내는 것 전부입니다. 각각이 무엇인지는 [가이드](../guide/getting-started)에 있고, 이 문서는 하나를 찾아볼 때 보는 곳입니다.

## 진입점

| import                     | 무엇이 들어 있는지                                        |
| -------------------------- | --------------------------------------------------------- |
| `diffine-react`            | 전부. 컴포넌트와 엔진과 타입.                             |
| `diffine-react/diff`       | 비교 엔진만. 컴포넌트는 번들에 들어가지 않습니다.         |
| `diffine-react/types`      | 타입만. prop에 타입 이름을 쓰려는 애플리케이션을 위한 것. |
| `diffine-react/styles.css` | 두 컴포넌트가 함께 쓰는 스타일시트.                       |

## `DiffineViewer`

```tsx
<DiffineViewer before={saved} after={draft} />
```

### 문서

| prop | 타입 | 기본값 | 무엇인지 |
| --- | --- | --- | --- |
| `before` | `string \| DiffineSource` | `''` | 왼쪽 문서. |
| `after` | `string \| DiffineSource` | `''` | 오른쪽 문서. |
| `result` | `DiffResult` | — | 이미 계산된 비교 결과. 주면 `before`와 `after`는 무시됩니다. |
| `diff` | `DiffOptions` | — | 비교 방식. 아래 참고. |

`DiffineSource`는 `{ content: string; label?: string }`입니다. `label`이 헤더에 표시되는 이름이고, 없으면 현재 로케일의 기본 단어가 들어갑니다.

### 화면

| prop | 타입 | 기본값 | 무엇을 정하는지 |
| --- | --- | --- | --- |
| `view` | `'split' \| 'unified'` | `'split'` | 좌우로 나눌지, 한 줄로 볼지. |
| `lineNumbers` | `boolean` | `true` | 각 줄에 번호를 붙일지. |
| `markers` | `boolean` | `true` | 바뀐 줄에 `+`, `−`, `~`를 붙일지. |
| `wrap` | `boolean` | `false` | 긴 줄을 접을지 옆으로 흘릴지. |
| `alignLines` | `boolean` | `true` | 맞은편 줄과 높이를 맞출지. |
| `connectors` | `boolean` | `true` | 변경을 두 창 사이에 띠로 그릴지. |
| `syncScroll` | `boolean` | `true` | 한쪽을 스크롤하면 다른 쪽도 따라갈지. |
| `header` | `boolean` | `true` | 각 문서의 이름을 위에 쓸지. |
| `summary` | `boolean` | `true` | 아래쪽 상태 표시줄을 그릴지. |
| `language` | `string` | `'plain'` | 문서가 어떤 언어인지. 그 언어로 색을 입힙니다. |
| `languageLabel` | `boolean` | `true` | 그 언어 이름을 위쪽 줄 오른쪽 끝에 쓸지. |
| `tabSize` | `number` | `4` | 탭을 몇 칸으로 그릴지. |
| `colorScheme` | `'system' \| 'light' \| 'dark'` | `'system'` | 어떤 팔레트로 그릴지. |
| `locale` | `'en' \| 'ko'` | `'en'` | 뷰어 자신이 쓰는 말의 언어. |
| `strings` | `Partial<DiffineStrings>` | — | 로케일 대신 쓸 단어. |

`connectors`와 `syncScroll`은 두 창 사이의 이야기라서 `unified`에서는 무시됩니다.

그 밖에 넘긴 것은 전부 엘리먼트로 그대로 갑니다. `id`, `className`, `style`, `aria-*`는 `<div>`에서와 똑같이 동작합니다.

### 지금 보고 있는 변경

| prop | 타입 | 기본값 | 무엇인지 |
| --- | --- | --- | --- |
| `selected` | `number` | — | 보고 있는 변경, 없으면 -1. |
| `defaultSelected` | `number` | `-1` | 처음에 선택할 변경. |
| `onSelectedChange` | `(selected: number, change: DiffChange \| null) => void` | — | 다른 변경으로 이동했을 때. |

`selected`는 `changes`의 인덱스입니다. 값을 주면 애플리케이션이 들고 있는 것이 되고, 값을 바꾸면 버튼을 눌렀을 때와 똑같이 화면이 이동합니다. `onSelectedChange`는 둘 중 어느 쪽이 들고 있든 호출됩니다.

### `DiffineStrings`

| 키               | 한국어 기본값                                           |
| ---------------- | ------------------------------------------------------- |
| `before`         | `이전`                                                  |
| `after`          | `이후`                                                  |
| `empty`          | `아직 비교할 내용이 없습니다.`                          |
| `placeholder`    | `여기에 문서를 입력하거나 붙여 넣으세요.`               |
| `identical`      | `두 문서가 같습니다.`                                   |
| `added`          | `추가됨`                                                |
| `removed`        | `삭제됨`                                                |
| `changed`        | `변경됨`                                                |
| `summary`        | `변경 {changes}건, {inserted}줄 추가, {deleted}줄 삭제` |
| `documentSize`   | `{label}: {characters}자, {size}`                       |
| `previousChange` | `이전 변경`                                             |
| `nextChange`     | `다음 변경`                                             |
| `changePosition` | `변경 {total}건 중 {position}번째`                      |

`added`, `removed`, `changed`, `summary`, `documentSize`, `changePosition`은 화면에 나오지 않고 스크린 리더가 읽습니다. `summary`의 `{changes}`, `{inserted}`, `{deleted}` 자리에 집계가 들어갑니다. `documentSize`의 `{label}` 자리에는 한쪽의 이름이, `{characters}`와 `{size}` 자리에는 읽는 사람의 언어로 이미 써 둔 수가 들어갑니다. `placeholder`는 에디터의 빈 입력란에 나오는 문구입니다.

### `DIFFINE_LANGUAGES`

```ts
interface DiffineLanguageOption {
  id: string;
  name: string;
}

const DIFFINE_LANGUAGES: readonly DiffineLanguageOption[];
```

`language`에 넣을 수 있는 언어 전부입니다. `plain`이 맨 앞이고 그 뒤로 highlight.js 식별자 서른네 개가 알파벳순으로 옵니다. `id`가 `language`에 넣는 값이고, `name`이 창 위에 쓰이는 이름입니다. 로케일과 상관없이 영어로 씁니다. `TypeScript`는 어느 언어에서나 `TypeScript`이기 때문입니다.

에디터의 메뉴가 이 목록으로 만들어집니다. 다른 곳에 메뉴를 따로 만든다면 베껴 두지 말고 이 목록에서 만드는 편이 좋습니다.

`highlight.js`와 문법 하나하나가 `import()` 뒤에 있습니다. `plain`이 아닌 언어를 요청하기 전까지는 아무것도 내려받지 않고, 요청하면 그 언어의 문법만 내려받습니다. 문법이 도착한 다음 프레임에 색이 입혀지고, 그 전까지는 문서 그대로 그려집니다.

### `DiffineHighlight`

```ts
type DiffineHighlight = (
  line: DiffLine,
  side: 'before' | 'after'
) => readonly DiffineToken[] | null | undefined;

interface DiffineToken {
  /** 이 구간이 줄에서 차지하는 글자 수. */
  length: number;
  className?: string;
  style?: React.CSSProperties;
}
```

두 컴포넌트가 그리는 줄마다, 줄 전체를 넘겨 호출합니다. 구간은 순서대로 읽고 사이의 빈 곳은 그냥 그리며, `null`이면 그 줄은 손대지 않습니다. `length`는 `String.prototype.slice`와 같은 단위로 셉니다.

줄은 이 구간과 비교 결과의 경계를 모두 반영해 잘립니다. 문자열의 절반인 바뀐 단어는 문자열의 절반인 바뀐 단어로 그려집니다.

이것을 주면 `language`에 더해지는 것이 아니라 `language`를 대신합니다. 한 줄에는 구간이 한 벌뿐이고, 둘이 동시에 자르는 것에는 답이 없습니다.

## `DiffineEditor`

```tsx
<DiffineEditor defaultBefore={saved} defaultAfter={draft} />
```

두 창을 고칠 수 있게 만든 뷰어입니다. 아래 prop 중 뷰어에도 있는 것은 뜻이 같습니다. 다른 점은 양쪽 높이를 맞추지 않는다는 것과 한 줄로 보기가 없다는 것입니다.

### 문서

| prop | 타입 | 기본값 | 무엇인지 |
| --- | --- | --- | --- |
| `before` | `string \| DiffineSource` | — | 왼쪽 문서. 애플리케이션이 들고 있습니다. |
| `after` | `string \| DiffineSource` | — | 오른쪽 문서. 애플리케이션이 들고 있습니다. |
| `defaultBefore` | `string \| DiffineSource` | `''` | 왼쪽 입력란이 처음 담을 내용. |
| `defaultAfter` | `string \| DiffineSource` | `''` | 오른쪽 입력란이 처음 담을 내용. |
| `onBeforeChange` | `(value: string) => void` | — | 왼쪽 문서가 바뀌었을 때. |
| `onAfterChange` | `(value: string) => void` | — | 오른쪽 문서가 바뀌었을 때. |
| `onDiff` | `(result: DiffResult) => void` | — | 비교를 다시 계산할 때마다의 결과. |
| `readOnly` | `boolean \| 'before' \| 'after'` | `false` | 고칠 수 없는 쪽. |
| `diff` | `DiffOptions` | — | 두 문서를 비교하는 방식. 글자를 칠 때마다 다시 돌립니다. |

`before`나 `after`를 주면 그 문서는 애플리케이션의 것이 됩니다. 둘 중 어느 쪽인지는 첫 렌더에서 정해집니다. `onBeforeChange`와 `onAfterChange`는 어느 쪽이 들고 있든 호출됩니다.

### 화면

| prop | 타입 | 기본값 | 무엇을 정하는지 |
| --- | --- | --- | --- |
| `lineNumbers` | `boolean` | `true` | 줄마다 번호를 붙일지. |
| `markers` | `boolean` | `true` | 바뀐 줄에 `+`, `−`, `~`를 붙일지. |
| `wrap` | `boolean` | `false` | 긴 줄을 접을지 옆으로 흘릴지. |
| `connectors` | `boolean` | `true` | 변경마다 두 창 사이에 띠를 그릴지. |
| `syncScroll` | `boolean` | `true` | 한쪽을 스크롤하면 다른 쪽도 따라갈지. |
| `header` | `boolean` | `true` | 각 쪽 위에 이름을 쓸지. |
| `navigation` | `boolean` | `true` | 변경 사이를 오가는 버튼을 그릴지. |
| `summary` | `boolean` | `true` | 아래쪽 상태 표시줄을 그릴지. |
| `language` | `string` | — | 문서가 어떤 언어인지. 애플리케이션이 들고 있습니다. |
| `defaultLanguage` | `string` | `'plain'` | 에디터가 직접 들고 있을 때 처음 언어. |
| `onLanguageChange` | `(language: string) => void` | — | 언어를 골랐을 때. |
| `languagePicker` | `boolean` | `true` | 언어 메뉴를 위쪽 줄에 그릴지. |
| `virtualize` | `boolean` | `true` | 보이는 줄만 그릴지. |
| `tabSize` | `number` | `4` | 탭을 몇 글자 너비로 그릴지. |
| `colorScheme` | `'system' \| 'light' \| 'dark'` | `'system'` | 어떤 색으로 그릴지. |
| `locale` | `'en' \| 'ko'` | `'en'` | 에디터가 쓰는 말의 언어. |
| `strings` | `Partial<DiffineStrings>` | — | 로케일 문구 대신 쓸 문구. |
| `highlight` | `DiffineHighlight` | — | 비교 결과와 별개로 줄에 색을 입히는 방법. |

### 입력

| prop            | 타입      | 기본값  | 무엇을 정하는지                             |
| --------------- | --------- | ------- | ------------------------------------------- |
| `indentWithTab` | `boolean` | `false` | Tab이 탭 문자를 넣을지, 다음 컨트롤로 갈지. |
| `spellCheck`    | `boolean` | `false` | 브라우저가 맞춤법 표시를 할지.              |

`indentWithTab`을 켜도 **Shift+Tab**은 이전 컨트롤로 가고 **Escape**는 다음 Tab을 브라우저에 넘깁니다. 키보드로 빠져나올 수 없는 입력란은 되지 않습니다.

`selected`, `defaultSelected`, `onSelectedChange`는 뷰어와 같습니다. 그 밖에 넘긴 것은 그대로 요소로 갑니다.

## `diffText`

```ts
diffText(before: string, after: string, options?: DiffOptions): DiffResult
```

### `DiffOptions`

| 옵션              | 타입                                                          | 기본값    |
| ----------------- | ------------------------------------------------------------- | --------- |
| `inline`          | `'none' \| 'word' \| 'character'`                             | `'word'`  |
| `whitespace`      | `'exact' \| 'trailing' \| 'surrounding' \| 'amount' \| 'all'` | `'exact'` |
| `ignoreCase`      | `boolean`                                                     | `false`   |
| `inlineThreshold` | `number`                                                      | `0.3`     |
| `maxCost`         | `number`                                                      | `5000`    |

`DIFFINE_DEFAULTS`가 이 표를 값으로 담고 있습니다.

### `DiffResult`

```ts
interface DiffResult {
  before: readonly string[];
  after: readonly string[];
  rows: readonly DiffRow[];
  changes: readonly DiffChange[];
  stats: DiffStats;
  complete: boolean;
}
```

### `DiffRow`

```ts
interface DiffRow {
  kind: 'equal' | 'insert' | 'delete' | 'replace';
  before: DiffLine | null;
  after: DiffLine | null;
}

interface DiffLine {
  index: number;
  text: string;
  segments: readonly DiffSegment[];
}

interface DiffSegment {
  kind: 'equal' | 'insert' | 'delete';
  text: string;
}
```

### `DiffChange`

```ts
interface DiffChange {
  kind: 'insert' | 'delete' | 'replace';
  beforeStart: number;
  beforeEnd: number;
  afterStart: number;
  afterEnd: number;
  rowStart: number;
  rowEnd: number;
}
```

범위는 모두 끝을 포함하지 않습니다. 목록에는 바뀐 구간만 들어가고, 안 바뀐 구간은 그 사이의 빈 자리입니다.

### `DiffStats`

```ts
interface DiffStats {
  unchanged: number;
  changed: number;
  inserted: number;
  deleted: number;
}
```

`changed`는 마주 보면서 서로 다른 줄 짝의 개수입니다. 그래서 고쳐진 줄 하나는 `inserted` 하나에 `deleted` 하나가 아니라 `changed` 하나로 셉니다.

## `diffWords`와 `diffCharacters`

```ts
diffWords(before: string, after: string, options?: DiffOptions): DiffInlineResult
diffCharacters(before: string, after: string, options?: DiffOptions): DiffInlineResult
```

```ts
interface DiffInlineResult {
  before: readonly DiffSegment[];
  after: readonly DiffSegment[];
  similarity: number;
}
```

한 목록이 아니라 양쪽으로 나눠 돌려주므로, 한쪽을 이어 붙이면 그쪽에 넘긴 문자열이 그대로 나옵니다.

## `diffSequence`

```ts
diffSequence(before: readonly string[], after: readonly string[], options?: DiffOptions): DiffEdit[]
```

```ts
interface DiffEdit {
  kind: 'equal' | 'insert' | 'delete';
  beforeStart: number;
  beforeEnd: number;
  afterStart: number;
  afterEnd: number;
}
```

돌아온 편집 목록은 두 배열을 순서대로 빠짐없이 한 번씩 덮습니다.

## 커스텀 속성

`.diffine`에 선언돼 있고, 같은 방식으로 덮어쓰면 됩니다.

### 색

| 속성                     | 밝은 테마   | 어두운 테마 |
| ------------------------ | ----------- | ----------- |
| `--diffine-surface`      | `#ffffff`   | `#1b222c`   |
| `--diffine-text`         | `#1f2733`   | `#e4e9f0`   |
| `--diffine-muted`        | `#6e798c`   | `#8d99ad`   |
| `--diffine-border`       | `#d6dee9`   | `#2f3945`   |
| `--diffine-gutter`       | `#f4f7fb`   | `#232b36`   |
| `--diffine-accent`       | `#0e7ffc`   | `#4c9dff`   |
| `--diffine-insert-line`  | `#e7f8ee`   | `#12301f`   |
| `--diffine-insert-piece` | `#a5e9c1`   | `#206c42`   |
| `--diffine-delete-line`  | `#fdecee`   | `#351c20`   |
| `--diffine-delete-piece` | `#ffc3c8`   | `#7f303a`   |
| `--diffine-insert-text`  | `#1a7f4b`   | `#5fd08a`   |
| `--diffine-delete-text`  | `#c2333f`   | `#ff8b95`   |
| `--diffine-blank`        | `#f0f3f7`   | `#151b23`   |
| `--diffine-selection`    | `#0e7ffc33` | `#4c9dff40` |

`-line` 쪽이 줄 전체에 옅게 깔리는 색이고, `-piece` 쪽이 그 위에서 바뀐 부분을 짚는 색입니다. `-text` 쪽은 같은 두 색을 글자로 읽을 만큼 진하게 만든 것으로, 뒤에 깔린 것이 여백뿐인 아래쪽 상태 표시줄의 집계에 씁니다. `--diffine-selection`은 에디터만 쓰고, 반투명해야 합니다. 선택 영역 아래의 글자는 입력란 뒤에서 그리기 때문입니다.

### 치수

| 속성                     | 기본값      | 무엇인지                                   |
| ------------------------ | ----------- | ------------------------------------------ |
| `--diffine-height`       | `24rem`     | 뷰어의 높이. `auto`면 내용만큼 늘어납니다. |
| `--diffine-radius`       | `0.5rem`    | 테두리의 모서리 반지름.                    |
| `--diffine-font`         | 고정폭 스택 | 문서를 그리는 서체.                        |
| `--diffine-font-size`    | `0.8125rem` | 그 크기.                                   |
| `--diffine-line-height`  | `1.5rem`    | 접히지 않은 줄 하나의 높이.                |
| `--diffine-links-width`  | `3rem`      | 두 창 사이 열의 너비.                      |
| `--diffine-marker-width` | `1.25rem`   | `+`, `−`, `~` 열의 너비.                   |

`--diffine-digits`와 `--diffine-tab-size`는 컴포넌트가 가장 긴 문서와 `tabSize`를 보고 엘리먼트에 직접 씁니다. 손으로 지정해도 다음 렌더에서 덮어씁니다. `--diffine-gutter-width`, `--diffine-gutter-numbers`, `--diffine-gutter-markers`, `--diffine-gutter-rule`은 위의 두 값과 어떤 열을 켰는지를 보고 계산합니다. 왼쪽 열과, 마지막 줄 아래로 그 열을 이어 그리는 띠와, 에디터 입력란의 들여쓰기가 모두 이 값으로 재어집니다.
