---
title: API
order: 1
---

# API

`diffine-react`가 내보내는 것 전부입니다. 각각이 무엇인지는 [가이드](../guide/getting-started)에 있고, 이 문서는 하나를 찾아볼 때 보는 곳입니다.

## 진입점

| import                     | 무엇이 들어 있는지                                        |
| -------------------------- | --------------------------------------------------------- |
| `diffine-react`            | 전부. 뷰어와 엔진과 타입.                                 |
| `diffine-react/diff`       | 비교 엔진만. 컴포넌트는 번들에 들어가지 않습니다.         |
| `diffine-react/types`      | 타입만. prop에 타입 이름을 쓰려는 애플리케이션을 위한 것. |
| `diffine-react/styles.css` | 뷰어의 스타일시트.                                        |

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
| `summary` | `boolean` | `true` | 집계를 아래에 쓸지. |
| `tabSize` | `number` | `4` | 탭을 몇 칸으로 그릴지. |
| `colorScheme` | `'system' \| 'light' \| 'dark'` | `'system'` | 어떤 팔레트로 그릴지. |
| `locale` | `'en' \| 'ko'` | `'en'` | 뷰어 자신이 쓰는 말의 언어. |
| `strings` | `Partial<DiffineStrings>` | — | 로케일 대신 쓸 단어. |

`connectors`와 `syncScroll`은 두 창 사이의 이야기라서 `unified`에서는 무시됩니다.

그 밖에 넘긴 것은 전부 엘리먼트로 그대로 갑니다. `id`, `className`, `style`, `aria-*`는 `<div>`에서와 똑같이 동작합니다.

### `DiffineStrings`

| 키          | 한국어 기본값                                           |
| ----------- | ------------------------------------------------------- |
| `before`    | `이전`                                                  |
| `after`     | `이후`                                                  |
| `empty`     | `아직 비교할 내용이 없습니다.`                          |
| `identical` | `두 문서가 같습니다.`                                   |
| `added`     | `추가됨`                                                |
| `removed`   | `삭제됨`                                                |
| `changed`   | `변경됨`                                                |
| `summary`   | `변경 {changes}건, {inserted}줄 추가, {deleted}줄 삭제` |

`added`, `removed`, `changed`는 화면에 나오지 않고 스크린 리더가 읽습니다. `summary`의 `{changes}`, `{inserted}`, `{deleted}` 자리에 집계가 들어갑니다.

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

| 속성                     | 밝은 테마 | 어두운 테마 |
| ------------------------ | --------- | ----------- |
| `--diffine-surface`      | `#ffffff` | `#1b222c`   |
| `--diffine-text`         | `#1f2733` | `#e4e9f0`   |
| `--diffine-muted`        | `#6e798c` | `#8d99ad`   |
| `--diffine-border`       | `#d6dee9` | `#2f3945`   |
| `--diffine-gutter`       | `#f4f7fb` | `#232b36`   |
| `--diffine-accent`       | `#0e7ffc` | `#4c9dff`   |
| `--diffine-insert-line`  | `#e7f8ee` | `#12301f`   |
| `--diffine-insert-piece` | `#a5e9c1` | `#206c42`   |
| `--diffine-delete-line`  | `#fdecee` | `#351c20`   |
| `--diffine-delete-piece` | `#ffc3c8` | `#7f303a`   |
| `--diffine-blank`        | `#f0f3f7` | `#151b23`   |

`-line` 쪽이 줄 전체에 옅게 깔리는 색이고, `-piece` 쪽이 그 위에서 바뀐 부분을 짚는 색입니다.

### 치수

| 속성                    | 기본값      | 무엇인지                                   |
| ----------------------- | ----------- | ------------------------------------------ |
| `--diffine-height`      | `24rem`     | 뷰어의 높이. `auto`면 내용만큼 늘어납니다. |
| `--diffine-radius`      | `0.5rem`    | 테두리의 모서리 반지름.                    |
| `--diffine-font`        | 고정폭 스택 | 문서를 그리는 서체.                        |
| `--diffine-font-size`   | `0.8125rem` | 그 크기.                                   |
| `--diffine-line-height` | `1.5rem`    | 접히지 않은 줄 하나의 높이.                |
| `--diffine-links-width` | `3rem`      | 두 창 사이 열의 너비.                      |

`--diffine-digits`와 `--diffine-tab-size`는 컴포넌트가 가장 긴 문서와 `tabSize`를 보고 엘리먼트에 직접 씁니다. 손으로 지정해도 다음 렌더에서 덮어씁니다.
