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
| `diffine-react/diff`       | 텍스트 비교 엔진만. 컴포넌트는 번들에 들어가지 않습니다.  |
| `diffine-react/image`      | 이미지 비교 엔진만.                                       |
| `diffine-react/types`      | 타입만. prop에 타입 이름을 쓰려는 애플리케이션을 위한 것. |
| `diffine-react/styles.css` | 스타일시트.                                               |

## `TextDiff`

```tsx
<TextDiff before={saved} after={draft} />
<TextDiff mode="editor" defaultBefore={saved} defaultAfter={draft} />
```

### 모드

| prop   | 타입                   | 기본값     | 무엇을 정하는지        |
| ------ | ---------------------- | ---------- | ---------------------- |
| `mode` | `'viewer' \| 'editor'` | `'viewer'` | 두 문서를 읽을지 쓸지. |

컴포넌트 하나가 둘 다 그립니다. `editor`는 창마다 입력란을 한 겹 덮어서 글자를 칠 때마다 비교를 다시 계산하고, 나머지는 — 줄도, 깔리는 색도, 짚어 주는 단어도, 띠도, 버튼도, 찾기도 — 양쪽이 같습니다.

`editor`에서 무시되는 prop이 셋 있습니다. `view`와 `alignLines`는 입력란이 한 열이 될 수도, 커서를 놓을 수 있는 빈 칸으로 채워질 수도 없어서 무시되고, `result`는 아직 아무도 손대지 않은 문서의 비교라서 무시됩니다. 반대로 `readOnly`, `indentWithTab`, `spellCheck`, `defaultBefore`, `defaultAfter`, `onLanguageChange`는 `viewer`에서 하는 일이 없습니다.

### 문서

| prop | 타입 | 기본값 | 무엇인지 |
| --- | --- | --- | --- |
| `before` | `string \| DiffineSource` | `''` | 왼쪽 문서. |
| `after` | `string \| DiffineSource` | `''` | 오른쪽 문서. |
| `defaultBefore` | `string \| DiffineSource` | `''` | 왼쪽 입력란이 처음 담을 내용. 에디터 전용. |
| `defaultAfter` | `string \| DiffineSource` | `''` | 오른쪽 입력란이 처음 담을 내용. 에디터 전용. |
| `onBeforeChange` | `(value: string) => void` | — | 왼쪽 문서가 바뀌었을 때. |
| `onAfterChange` | `(value: string) => void` | — | 오른쪽 문서가 바뀌었을 때. |
| `onDiff` | `(result: DiffResult) => void` | — | 비교를 다시 계산할 때마다의 결과. |
| `readOnly` | `boolean \| 'before' \| 'after'` | `false` | 고칠 수 없는 쪽. 에디터 전용. |
| `result` | `DiffResult` | — | 이미 계산된 비교 결과. 주면 `before`와 `after`는 무시됩니다. 뷰어 전용. |
| `diff` | `DiffOptions` | — | 비교 방식. 아래 참고. |

`DiffineSource`는 `{ content: string; label?: string }`입니다. `label`이 헤더에 표시되는 이름이고, 없으면 현재 로케일의 기본 낱말이 들어갑니다.

뷰어는 렌더할 때마다 prop에서 문서를 다시 읽습니다. 에디터는 제어 컴포넌트와 비제어 컴포넌트 양쪽을 지원합니다. `before`나 `after`를 주면 그 문서는 애플리케이션이 관리하고, `defaultBefore`나 `defaultAfter`를 주면 컴포넌트가 관리합니다. 어느 쪽인지는 첫 렌더에서 정해지고, `onBeforeChange`와 `onAfterChange`는 누가 관리하든 호출됩니다.

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
| `navigation` | `boolean` | `true` | 변경 사이를 오가는 버튼을 그릴지. |
| `search` | `boolean` | `true` | 창 안에서 문서를 찾을 수 있게 할지. |
| `summary` | `boolean` | `true` | 아래쪽 상태 표시줄을 그릴지. |
| `virtualize` | `boolean` | `true` | 보이는 줄만 그릴지. |
| `language` | `string` | `'plain'` | 문서가 어떤 언어인지. 그 언어로 색을 입힙니다. |
| `defaultLanguage` | `string` | `'plain'` | 컴포넌트가 직접 관리할 때의 처음 언어. |
| `onLanguageChange` | `(language: string) => void` | — | 메뉴에서 언어를 골랐을 때. 에디터 전용. |
| `languageLabel` | `boolean` | `true` | 그 언어를 위쪽 줄 오른쪽 끝에 그릴지. |
| `tabSize` | `number` | `4` | 탭을 몇 칸으로 그릴지. |
| `colorScheme` | `'system' \| 'light' \| 'dark'` | `'system'` | 어떤 팔레트로 그릴지. |
| `font` | `DiffineFont` | — | 문서를 그리는 글꼴. |
| `locale` | `'en' \| 'ko'` | `'en'` | 컴포넌트 자신이 쓰는 말의 언어. |
| `strings` | `Partial<DiffineStrings>` | — | 로케일 대신 쓸 단어. |
| `highlight` | `DiffineHighlight` | — | `language` 대신 쓸, 애플리케이션 자신의 강조기. |

`connectors`와 `syncScroll`은 두 창 사이의 이야기라서 `unified`에서는 무시됩니다. `languageLabel`은 `viewer`에서 언어 이름을, `editor`에서 그 이름을 고르는 메뉴를 그립니다. 그 선택을 누가 관리하는지는 `language`, `defaultLanguage`, `onLanguageChange`가 정합니다.

그 밖에 넘긴 것은 전부 엘리먼트로 그대로 갑니다. `id`, `className`, `style`, `aria-*`는 `<div>`에서와 똑같이 동작합니다.

### 입력

| prop            | 타입      | 기본값  | 무엇을 정하는지                             |
| --------------- | --------- | ------- | ------------------------------------------- |
| `indentWithTab` | `boolean` | `false` | Tab이 탭 문자를 넣을지, 다음 컨트롤로 갈지. |
| `spellCheck`    | `boolean` | `false` | 브라우저가 맞춤법 표시를 할지.              |

둘 다 `editor`의 것입니다. `indentWithTab`을 켜도 **Shift+Tab**은 이전 컨트롤로 가고 **Escape**는 다음 Tab을 브라우저에 넘깁니다. 키보드로 빠져나올 수 없는 입력란은 되지 않습니다.

### 지금 보고 있는 변경

| prop | 타입 | 기본값 | 무엇인지 |
| --- | --- | --- | --- |
| `selected` | `number` | — | 보고 있는 변경, 없으면 -1. |
| `defaultSelected` | `number` | `-1` | 처음에 선택할 변경. |
| `onSelectedChange` | `(selected: number, change: DiffChange \| null) => void` | — | 다른 변경으로 이동했을 때. |

`selected`는 `changes`의 인덱스입니다. 값을 주면 애플리케이션이 관리하는 것이 되고, 값을 바꾸면 버튼을 눌렀을 때와 똑같이 화면이 이동합니다. `onSelectedChange`는 누가 관리하든 호출됩니다.

### 창 안에서 찾기

창은 각자 찾습니다. 위쪽 막대의 버튼이 그 창 아래에 막대를 열고, **Ctrl+F**(맥에서는 **Cmd+F**)는 키보드가 놓인 창의 막대를 엽니다. 양쪽은 질의도 개수도 막대도 각자여서, 한쪽을 닫아도 다른 쪽은 그대로입니다.

입력하는 동안 찾은 자리가 표시되고 창은 지금 보고 있는 자리로 이동합니다. **Enter**와 **Shift+Enter**로 다음과 이전을 오갑니다. 입력란 안의 스위치 세 개는 각각 대소문자 구분, 단어 단위, 정규식입니다. **Escape**는 막대를 닫습니다.

에디터에는 바꾸기 줄이 하나 더 붙고 **Ctrl+H**가 막대와 함께 그 줄을 엽니다. 바꿀 내용은 적은 글자 그대로 들어갑니다. `$1`은 달러 기호와 숫자 1입니다. 브라우저 자신의 편집 명령으로 넣기 때문에 Ctrl+Z로 되돌립니다. `readOnly`인 쪽은 찾기만 되고 바꾸기는 되지 않습니다.

찾기를 연 창도 보이는 줄만 그립니다. 9000번째 줄에서 찾은 자리는 그리로 스크롤한 다음 그려집니다. `search={false}`는 버튼과 단축키를 함께 끕니다. 그 키를 페이지의 다른 기능이 쓰고 있다면 이 값을 쓰세요.

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
| `search`         | `찾기`                                                  |
| `searchIn`       | `{label}에서 찾기`                                      |
| `searchPrevious` | `이전 결과`                                             |
| `searchNext`     | `다음 결과`                                             |
| `searchClose`    | `찾기 닫기`                                             |
| `searchPosition` | `결과 {total}건 중 {position}번째`                      |
| `searchEmpty`    | `결과 없음`                                             |
| `matchCase`      | `대소문자 구분`                                         |
| `wholeWord`      | `단어 단위`                                             |
| `regex`          | `정규식`                                                |
| `replace`        | `바꾸기`                                                |
| `replaceWith`    | `바꿀 내용`                                             |
| `replaceAll`     | `모두 바꾸기`                                           |

아래 열세 개는 `ImageDiff`의 것입니다. 그 위는 모두 공용이고, 두 컴포넌트가 같은 낱말 묶음을 씁니다.

| 키             | 한국어 기본값                         |
| -------------- | ------------------------------------- |
| `language`     | `구문 강조`                           |
| `imageSize`    | `{label}: {width} × {height}, {size}` |
| `imageSummary` | `변경 {regions}곳, 전체의 {percent}%` |
| `choose`       | `이미지 고르기`                       |
| `chooseIn`     | `{label}에 넣을 이미지 고르기`        |
| `unsupported`  | `이미지 파일이 아닙니다.`             |
| `loading`      | `이미지를 읽는 중`                    |
| `zoomOut`      | `축소`                                |
| `zoomIn`       | `확대`                                |
| `zoomFit`      | `창에 맞추기`                         |
| `zoomLevel`    | `{percent}%`                          |
| `fade`         | `두 이미지 겹쳐 보기`                 |
| `wipe`         | `끌어서 나눠 보기`                    |

`added`, `removed`, `changed`, `summary`, `documentSize`, `changePosition`, `searchPosition`, `searchEmpty`, `imageSummary`는 화면에 나오지 않고 스크린 리더가 읽습니다. `language`는 에디터의 언어 메뉴 이름으로 읽힙니다.

자리 표시자는 이렇게 채워집니다. `searchIn`과 `chooseIn`의 `{label}` 자리에는 그 버튼이 맡은 쪽의 이름이 들어갑니다. 한 컴포넌트에 같은 버튼이 둘씩 놓이므로 이것으로 구분합니다. `summary`의 `{changes}`, `{inserted}`, `{deleted}` 자리에는 집계가 들어갑니다. `documentSize`의 `{label}` 자리에는 한쪽의 이름이, `{characters}`와 `{size}` 자리에는 읽는 사람의 언어로 이미 써 둔 수가 들어가고, `imageSize`의 `{width}`, `{height}`, `{size}`도 마찬가지입니다. `imageSummary`는 `{regions}`와 `{percent}`를, `zoomLevel`은 `{percent}`를 받습니다. `placeholder`는 에디터의 빈 입력란에 나오는 문구입니다.

### `DiffineFont`

```ts
interface DiffineFont {
  family?: string;
  size?: string | number;
  lineHeight?: string | number;
  letterSpacing?: string | number;
}
```

`--diffine-font`, `--diffine-font-size`, `--diffine-line-height`, `--diffine-letter-spacing`와 같은 값 네 개입니다. 글꼴을 CSS가 아니라 자기 상태로 관리하는 애플리케이션을 위한 것입니다. 빠뜨린 값은 스타일시트의 값을 그대로 씁니다. 수는 픽셀이고, 문자열은 CSS가 읽는 대로입니다.

`family`는 고정폭 스택이어야 하고, `lineHeight`는 배수가 아니라 길이여야 합니다. 줄에 글자가 있든 없든 행의 높이가 그만큼이고, 에디터의 입력란이 그 행 위에 겹쳐지며, 긴 비교에서 그리지 않는 줄도 정확히 그만큼의 높이로 대신하기 때문입니다.

### `DIFFINE_LANGUAGES`

```ts
interface DiffineLanguageOption {
  id: string;
  name: string;
}

const DIFFINE_LANGUAGES: readonly DiffineLanguageOption[];
```

`language`에 넣을 수 있는 언어 전부입니다. `plain`이 맨 앞이고 그 뒤로 highlight.js 식별자 서른네 개가 알파벳순으로 옵니다. `id`가 `language`에 넣는 값이고, `name`이 창 위에 쓰이는 이름입니다. 로케일과 상관없이 영어로 씁니다. `TypeScript`는 어느 언어에서나 `TypeScript`이기 때문입니다.

에디터의 메뉴가 이 목록으로 만들어집니다. 다른 곳에 메뉴를 따로 만든다면 목록을 복사해 두지 말고 이 값에서 만드세요. 언어가 늘어나도 따라옵니다.

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

컴포넌트가 그리는 줄마다, 줄 전체를 넘겨 호출합니다. 구간은 순서대로 읽고 사이의 빈 곳은 그냥 그리며, `null`이면 그 줄은 손대지 않습니다. `length`는 `String.prototype.slice`와 같은 단위로 셉니다.

줄은 이 구간과 비교 결과의 경계를 모두 반영해 잘립니다. 문자열의 절반인 바뀐 단어는 문자열의 절반인 바뀐 단어로 그려집니다.

이것을 주면 `language`에 더해지는 것이 아니라 `language`를 대신합니다. 한 줄에는 구간이 한 벌뿐이고, 둘이 동시에 자르는 것에는 답이 없습니다.

## `ImageDiff`

```tsx
<ImageDiff before={saved} after={rendered} />
<ImageDiff mode="editor" view="wipe" />
```

### 이미지

| Prop | 타입 | 기본값 | 무엇인지 |
| --- | --- | --- | --- |
| `mode` | `'viewer' \| 'editor'` | `'viewer'` | 이미지를 보기만 할지 고르기도 할지. |
| `before` | `DiffineImageInput` | — | 왼쪽 이미지. |
| `after` | `DiffineImageInput` | — | 오른쪽 이미지. |
| `defaultBefore` | `DiffineImageInput` | — | 왼쪽이 처음에 보여 줄 이미지. 에디터 전용. |
| `defaultAfter` | `DiffineImageInput` | — | 오른쪽이 처음에 보여 줄 이미지. 에디터 전용. |
| `onBeforeChange` | `(value: File) => void` | — | 왼쪽에 이미지를 골랐을 때. |
| `onAfterChange` | `(value: File) => void` | — | 오른쪽에 이미지를 골랐을 때. |
| `onDiff` | `(result: DiffImageResult \| null) => void` | — | 비교를 다시 할 때마다 그 결과. |
| `result` | `DiffImageResult` | — | 이미 계산해 둔 비교. 이미지는 그래도 그립니다. |
| `diff` | `DiffImageOptions` | — | 어떻게 비교할지. [`diffImage`](#diffimage) 참고. |
| `maxPixels` | `number` | `4000000` | 이미지를 몇 픽셀까지 해석할지. |

`DiffineImageInput`은 이미지 자체이거나 이름을 붙인 이미지입니다. `Blob | ImageBitmap | DiffPixels`, 또는 그중 하나를 감싼 `{ content, label }`입니다. URL은 받지 않습니다. 받아 오는 일은 애플리케이션의 몫입니다.

`editor`도 제어 컴포넌트와 비제어 컴포넌트 양쪽을 지원합니다. `defaultBefore`와 `defaultAfter`는 컴포넌트에 맡기고, `before`와 `after`는 애플리케이션이 관리합니다. `onBeforeChange`와 `onAfterChange`는 누가 관리하든 호출됩니다.

### 화면

| Prop | 타입 | 기본값 | 무엇을 정하는지 |
| --- | --- | --- | --- |
| `view` | `'split' \| 'overlay' \| 'wipe' \| 'mask'` | `'split'` | 두 장을 어떻게 놓을지. |
| `fade` | `number` | `0.5` | 두 번째 이미지를 얼마나 비칠지. overlay 전용. |
| `onFadeChange` | `(fade: number) => void` | — | 겹침 정도가 바뀌었을 때. |
| `wipe` | `number` | `0.5` | 두 장을 가르는 선의 위치. 0에서 1. wipe 전용. |
| `onWipeChange` | `(wipe: number) => void` | — | 그 선이 움직였을 때. |
| `marks` | `boolean` | `true` | 달라진 픽셀에 색을 깔지. |
| `outlines` | `boolean` | `true` | 변경마다 상자를 두를지. |
| `header` | `boolean` | `true` | 각 창 위에 이름을 쓸지. |
| `navigation` | `boolean` | `true` | 변경 사이를 오가는 버튼을 그릴지. |
| `zoom` | `boolean` | `true` | 확대 버튼을 그릴지. |
| `summary` | `boolean` | `true` | 창 아래 막대를 그릴지. |
| `colorScheme` | `'system' \| 'light' \| 'dark'` | `'system'` | 어느 팔레트로 그릴지. |
| `locale` | `'en' \| 'ko'` | `'en'` | 컴포넌트가 쓰는 말의 언어. |
| `strings` | `Partial<DiffineStrings>` | — | 로케일 대신 쓸 낱말. |

`split`은 창을 둘 그리고 나머지 셋은 하나를 그리며, 그 위에 두 이름을 함께 씁니다. 표시하는 색은 prop이 아니라 [커스텀 속성](#색) 다섯 개입니다. 캔버스에는 스타일을 입힐 수 없어서 값을 읽어 직접 칠하기 때문입니다.

### 움직이기

| Prop | 타입 | 기본값 | 무엇을 정하는지 |
| --- | --- | --- | --- |
| `viewport` | `DiffineImageViewport \| 'fit'` | — | 지금 보고 있는 자리. |
| `defaultViewport` | `DiffineImageViewport \| 'fit'` | `'fit'` | 처음 보여 줄 자리. |
| `onViewportChange` | `(viewport: DiffineImageViewport) => void` | — | 옮기거나 확대했을 때. |
| `selected` | `number` | — | 몇 번째 변경으로 옮겨 갔는지. 없으면 -1. |
| `defaultSelected` | `number` | `-1` | 어느 변경에서 시작할지. |
| `onSelectedChange` | `(selected: number, region: DiffImageRegion \| null) => void` | — | 변경으로 옮겨 갔을 때. |

`DiffineImageViewport`는 `{ scale, x, y }`입니다. 프레임의 한 픽셀을 화면 몇 픽셀로 그리는지, 그리고 창 한가운데가 보고 있는 프레임 위의 점입니다. 두 창에 같은 값을 주기 때문에 좌우 보기가 함께 움직입니다.

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

## `diffImage`

```ts
import { diffImage } from 'diffine-react/image';

const result = diffImage(before, after, { align: 'shift' });
```

`(before: DiffPixels, after: DiffPixels, options?: DiffImageOptions) => DiffImageResult`

두 이미지를 픽셀 단위로 비교합니다. 크기가 같을 필요는 없습니다. 한쪽만 덮는 자리는 오류가 아니라 `added`나 `removed`로 돌아옵니다.

### `DiffPixels`

| 필드 | 타입 | 무엇인지 |
| --- | --- | --- |
| `data` | `Uint8ClampedArray` | 빨강, 초록, 파랑, 알파를 1바이트씩. 길이는 `width * height * 4`. |
| `width` | `number` |  |
| `height` | `number` |  |

`ImageData`와 같은 모양입니다. 캔버스가 돌려준 것을 그대로 넣으면 됩니다.

### `DiffImageOptions`

| 옵션 | 타입 | 기본값 | 무엇을 정하는지 |
| --- | --- | --- | --- |
| `tolerance` | `number` | `0.05` | 두 픽셀이 얼마나 달라야 차이로 셀지. 0에서 1. |
| `ignoreAntialiasing` | `boolean` | `true` | 경계를 부드럽게 그린 탓에만 달라진 픽셀을 뺄지. |
| `align` | `'none' \| 'shift'` | `'none'` | 비교 전에 두 이미지의 어긋남을 찾을지. |
| `alignRadius` | `number` | `16` | 그 탐색이 몇 픽셀까지 갈지. |
| `blockSize` | `number` | `16` | 달라진 픽셀을 묶는 격자가 얼마나 성긴지. |
| `maxRegions` | `number` | `200` | 돌려줄 영역의 최대 개수. 넘으면 큰 것부터 남깁니다. |

`DIFFINE_IMAGE_DEFAULTS`가 이 표를 객체로 담고 있습니다.

### `DiffImageResult`

| 필드       | 타입                | 무엇인지                                       |
| ---------- | ------------------- | ---------------------------------------------- |
| `width`    | `number`            | 두 이미지를 비교한 프레임.                     |
| `height`   | `number`            |                                                |
| `before`   | `DiffImageArea`     | 그 프레임에서 첫 번째 이미지가 놓인 자리.      |
| `after`    | `DiffImageArea`     | 두 번째 이미지가 놓인 자리.                    |
| `offset`   | `{ x, y }`          | 둘을 맞추려고 두 번째를 얼마나 옮겼는지.       |
| `mask`     | `Uint8Array`        | 프레임의 픽셀마다 무슨 일이 있었는지, 한 줄씩. |
| `regions`  | `DiffImageRegion[]` | 변경이 있는 자리. 읽는 순서대로.               |
| `stats`    | `DiffImageStats`    | 프레임이 어느 쪽으로 얼마나 갔는지.            |
| `complete` | `boolean`           | 영역 목록이 전부인지.                          |

`mask`의 한 바이트는 `DIFF_PIXEL_KINDS`의 인덱스입니다. `['equal', 'changed', 'added', 'removed']`이므로 `0`이 그대로인 픽셀이고 나머지는 달라진 픽셀입니다.

`offset`은 내용이 어디 있었는지가 아니라 어디로 옮겼는지입니다. 내용이 1픽셀 오른쪽에 그려진 이미지는 1픽셀 왼쪽으로 옮기므로 `x`는 `-1`입니다.

### `DiffImageRegion`

`{ x, y, width, height, pixels }`입니다. 달라진 픽셀 한 덩어리를 감싸는 가장 작은 사각형과, 그 안에 든 픽셀 수입니다. `DiffImageArea`는 개수가 빠진 같은 모양입니다.

### `DiffImageStats`

| 필드        | 무엇을 세는지                                       |
| ----------- | --------------------------------------------------- |
| `pixels`    | 프레임의 전체 픽셀 수.                              |
| `unchanged` | 그대로인 픽셀.                                      |
| `changed`   | 달라진 픽셀.                                        |
| `added`     | 두 번째 이미지만 덮는 픽셀.                         |
| `removed`   | 첫 번째 이미지만 덮는 픽셀.                         |
| `ratio`     | `unchanged`가 아닌 전부가 프레임에서 차지하는 비율. |

## 커스텀 속성

`.diffine`에 선언돼 있고, 같은 방식으로 덮어쓰면 됩니다.

### 색

| 속성                       | 밝은 테마   | 어두운 테마 |
| -------------------------- | ----------- | ----------- |
| `--diffine-surface`        | `#ffffff`   | `#1b222c`   |
| `--diffine-text`           | `#1f2733`   | `#e4e9f0`   |
| `--diffine-muted`          | `#6e798c`   | `#8d99ad`   |
| `--diffine-border`         | `#d6dee9`   | `#2f3945`   |
| `--diffine-gutter`         | `#f4f7fb`   | `#232b36`   |
| `--diffine-accent`         | `#0e7ffc`   | `#4c9dff`   |
| `--diffine-insert-line`    | `#e7f8ee`   | `#12301f`   |
| `--diffine-insert-piece`   | `#a5e9c1`   | `#206c42`   |
| `--diffine-delete-line`    | `#fdecee`   | `#351c20`   |
| `--diffine-delete-piece`   | `#ffc3c8`   | `#7f303a`   |
| `--diffine-insert-text`    | `#1a7f4b`   | `#5fd08a`   |
| `--diffine-delete-text`    | `#c2333f`   | `#ff8b95`   |
| `--diffine-search`         | `#ffe9a8`   | `#5c4713`   |
| `--diffine-search-current` | `#ffbd3d`   | `#8a5c0f`   |
| `--diffine-blank`          | `#f0f3f7`   | `#151b23`   |
| `--diffine-selection`      | `#0e7ffc33` | `#4c9dff40` |

이미지 비교가 칠하는 다섯 색과, 그 뒤에 깔리는 두 색입니다.

| 속성                      | 밝은 테마                | 어두운 테마               |
| ------------------------- | ------------------------ | ------------------------- |
| `--diffine-image-changed` | `rgb(232 62 140 / 0.55)` | `rgb(255 92 168 / 0.55)`  |
| `--diffine-image-added`   | `rgb(26 127 75 / 0.5)`   | `rgb(63 190 122 / 0.5)`   |
| `--diffine-image-removed` | `rgb(194 51 63 / 0.5)`   | `rgb(255 106 116 / 0.5)`  |
| `--diffine-image-outline` | `rgb(20 28 40 / 0.4)`    | `rgb(228 233 240 / 0.35)` |
| `--diffine-image-marker`  | `rgb(14 127 252 / 0.95)` | `rgb(76 157 255 / 0.95)`  |
| `--diffine-image-ground`  | `#eaeef4`                | `#151b23`                 |
| `--diffine-image-chequer` | `#dbe1ea`                | `#1e2530`                 |

`-line` 쪽이 줄 전체에 옅게 깔리는 색이고, `-piece` 쪽이 그 위에서 바뀐 부분을 짚는 색입니다. `-text` 쪽은 같은 두 색을 글자로 읽을 만큼 진하게 만든 것으로, 뒤에 깔린 것이 여백뿐인 아래쪽 상태 표시줄의 집계에 씁니다. `--diffine-search` 짝은 찾기가 짚는 색입니다. 앞은 찾은 자리 전부, 뒤는 지금 보고 있는 자리입니다. 강조색 대신 세 번째 색을 쓰는 이유는, 찾은 자리가 이미 초록이나 빨강으로 물든 줄에 놓일 수 있고 그 세 바탕 모두에서 읽혀야 하기 때문입니다. `--diffine-selection`은 에디터만 쓰고, 반투명해야 합니다. 선택 영역 아래의 글자는 입력란 뒤에서 그리기 때문입니다.

### 치수

| 속성                       | 기본값      | 무엇인지                                   |
| -------------------------- | ----------- | ------------------------------------------ |
| `--diffine-height`         | `24rem`     | 뷰어의 높이. `auto`면 내용만큼 늘어납니다. |
| `--diffine-radius`         | `0.5rem`    | 테두리의 모서리 반지름.                    |
| `--diffine-font`           | 고정폭 스택 | 문서를 그리는 서체.                        |
| `--diffine-font-size`      | `0.8125rem` | 그 크기.                                   |
| `--diffine-line-height`    | `1.5rem`    | 접히지 않은 줄 하나의 높이.                |
| `--diffine-letter-spacing` | `normal`    | 자간.                                      |
| `--diffine-links-width`    | `3rem`      | 두 창 사이 열의 너비.                      |
| `--diffine-marker-width`   | `1.25rem`   | `+`, `−`, `~` 열의 너비.                   |

`--diffine-digits`와 `--diffine-tab-size`는 컴포넌트가 가장 긴 문서와 `tabSize`를 보고 엘리먼트에 직접 씁니다. 손으로 지정해도 다음 렌더에서 덮어씁니다. `--diffine-gutter-width`, `--diffine-gutter-numbers`, `--diffine-gutter-markers`, `--diffine-gutter-rule`은 위의 두 값과 어떤 열을 켰는지를 보고 계산합니다. 왼쪽 열과, 마지막 줄 아래로 그 열을 이어 그리는 띠와, 에디터 입력란의 들여쓰기가 모두 이 값으로 재어집니다.
