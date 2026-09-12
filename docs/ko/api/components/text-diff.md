---
title: TextDiff
order: 1
description: '두 문서를 나란히 또는 한 줄로, 읽거나 고쳐 쓰면서 봅니다. 설정과 타입과 기본값 전부.'
---

# `TextDiff`

::: fw react

```tsx
<TextDiff before={saved} after={draft} />
<TextDiff mode="editor" defaultBefore={saved} defaultAfter={draft} />
```

:::

::: fw flutter

```dart
TextDiff(before: saved, after: draft);
TextDiff(mode: DiffineMode.editor, defaultBefore: saved, defaultAfter: draft);
```

:::

## 모드

::: fw react

| prop   | 타입                   | 기본값     | 무엇을 정하는지        |
| ------ | ---------------------- | ---------- | ---------------------- |
| `mode` | `'viewer' \| 'editor'` | `'viewer'` | 두 문서를 읽을지 쓸지. |

:::

::: fw flutter

| 인자   | 타입          | 기본값               | 무엇을 정하는지        |
| ------ | ------------- | -------------------- | ---------------------- |
| `mode` | `DiffineMode` | `DiffineMode.viewer` | 두 문서를 읽을지 쓸지. |

:::

<Fw react="컴포넌트 하나가" flutter="위젯 하나가" /> 둘 다 그립니다. `editor`는 창마다 입력란을 한 겹 덮어서 글자를 칠 때마다 비교를 다시 계산하고, 나머지는 — 줄도, 깔리는 색도, 짚어 주는 단어도, 띠도, 버튼도, 찾기도 — 양쪽이 같습니다.

::: fw react

`editor`에서 무시되는 prop이 몇 있습니다. `view`, `alignLines`, `collapse`, `context`, `renderGutter`, `renderWidget`은 입력란이 한 열이 될 수도, 커서를 놓을 수 있는 빈 칸으로 채워질 수도, 줄을 감출 수도, 줄 사이에 다른 것을 끼울 수도 없어서 무시되고, `result`는 아직 아무도 손대지 않은 문서의 비교라서 무시됩니다. 반대로 `readOnly`, `indentWithTab`, `spellCheck`, `defaultBefore`, `defaultAfter`, `onLanguageChange`는 `viewer`에서 하는 일이 없습니다.

:::

::: fw flutter

`DiffineMode.editor`에서 무시되는 인자가 몇 있습니다. `view`, `alignLines`, `collapse`, `context`, `renderGutter`, `renderWidget`은 입력란이 한 열이 될 수도, 커서를 놓을 수 있는 빈 칸으로 채워질 수도, 줄을 감출 수도, 줄 사이에 다른 것을 끼울 수도 없어서 무시되고, `result`는 아직 아무도 손대지 않은 문서의 비교라서 무시됩니다. 반대로 `readOnly`, `indentWithTab`, `defaultBefore`, `defaultAfter`, `onLanguageChanged`는 `DiffineMode.viewer`에서 하는 일이 없습니다.

:::

## 문서

::: fw react

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
| `result` | [`DiffResult`](../types/diff-result) | — | 이미 계산된 비교 결과. 주면 `before`와 `after`는 무시됩니다. 뷰어 전용. |
| `diff` | [`DiffOptions`](../types/diff-options) | — | 비교 방식. |

`DiffineSource`는 `{ content: string; label?: string }`입니다. `label`이 헤더에 표시되는 이름이고, 없으면 현재 로케일의 기본 낱말이 들어갑니다.

뷰어는 렌더할 때마다 prop에서 문서를 다시 읽습니다. 에디터는 제어 컴포넌트와 비제어 컴포넌트 양쪽을 지원합니다. `before`나 `after`를 주면 그 문서는 애플리케이션이 관리하고, `defaultBefore`나 `defaultAfter`를 주면 컴포넌트가 관리합니다. 어느 쪽인지는 첫 렌더에서 정해지고, `onBeforeChange`와 `onAfterChange`는 누가 관리하든 호출됩니다.

:::

::: fw flutter

| 인자 | 타입 | 기본값 | 무엇인지 |
| --- | --- | --- | --- |
| `before` | `String?` | — | 왼쪽 문서. |
| `after` | `String?` | — | 오른쪽 문서. |
| `beforeLabel` | `String?` | — | 헤더가 왼쪽을 부르는 이름. |
| `afterLabel` | `String?` | — | 오른쪽을 부르는 이름. |
| `defaultBefore` | `String?` | — | 왼쪽 입력란이 처음 담을 내용. 에디터 전용. |
| `defaultAfter` | `String?` | — | 오른쪽 입력란이 처음 담을 내용. 에디터 전용. |
| `onBeforeChanged` | `ValueChanged<String>?` | — | 왼쪽 문서가 바뀌었을 때. |
| `onAfterChanged` | `ValueChanged<String>?` | — | 오른쪽 문서가 바뀌었을 때. |
| `onDiff` | `ValueChanged<DiffResult>?` | — | 비교를 다시 계산할 때마다의 결과. |
| `readOnly` | `DiffineSide?` | — | 고칠 수 없는 쪽. 에디터 전용. |
| `result` | [`DiffResult?`](../types/diff-result) | — | 이미 계산된 비교 결과. 주면 `before`와 `after`는 무시됩니다. 뷰어 전용. |
| `diff` | [`DiffOptions`](../types/diff-options) | `kDiffineDefaults` | 비교 방식. |

문서와 이름이 한 값이 아니라 인자 둘인 이유는 `String` 자체가 이미 문서 전부이기 때문입니다. 이름을 주지 않으면 헤더에 현재 로케일의 기본 낱말이 들어갑니다.

뷰어는 빌드할 때마다 위젯에서 문서를 다시 읽습니다. 에디터는 `before`나 `after`를 주면 그 문서를 애플리케이션이 관리하고, `defaultBefore`나 `defaultAfter`를 주면 위젯이 관리합니다. 어느 쪽인지는 첫 빌드에서 정해지고, `onBeforeChanged`와 `onAfterChanged`는 누가 관리하든 호출됩니다.

:::

## 화면

::: fw react

| prop | 타입 | 기본값 | 무엇을 정하는지 |
| --- | --- | --- | --- |
| `view` | `'split' \| 'unified'` | `'split'` | 좌우로 나눌지, 한 줄로 볼지. |
| `lineNumbers` | `boolean` | `true` | 각 줄에 번호를 붙일지. |
| `markers` | `boolean` | `true` | 바뀐 줄에 `+`, `−`, `~`를 붙일지. |
| `wrap` | `boolean` | `false` | 긴 줄을 접을지 옆으로 흘릴지. |
| `alignLines` | `boolean` | `true` | 맞은편 줄과 높이를 맞출지. |
| `collapse` | `boolean` | `false` | 변경에서 먼 그대로인 줄을 접을지. |
| `context` | `number` | `3` | 변경 앞뒤로 남길 그대로인 줄 수. |
| `connectors` | `boolean` | `true` | 변경을 두 창 사이에 띠로 그릴지. |
| `applyChanges` | `boolean` | `false` | 변경마다 반대편에 적용하는 버튼을 둘지. |
| `syncScroll` | `boolean` | `true` | 한쪽을 스크롤하면 다른 쪽도 따라갈지. |
| `header` | `boolean` | `true` | 각 문서의 이름을 위에 쓸지. |
| `navigation` | `boolean` | `true` | 변경 사이를 오가는 버튼을 그릴지. |
| `search` | `boolean` | `true` | 창 안에서 문서를 찾을 수 있게 할지. |
| `summary` | `boolean` | `true` | 아래쪽 상태 표시줄을 그릴지. |
| `virtualize` | `boolean` | `true` | 보이는 줄만 그릴지. |
| `showInvisibles` | `boolean` | `false` | 줄 안의 공백과 탭을 그릴지. |
| `language` | `string` | `'plain'` | 문서가 어떤 언어인지. 그 언어로 색을 입힙니다. |
| `defaultLanguage` | `string` | `'plain'` | 컴포넌트가 직접 관리할 때의 처음 언어. |
| `onLanguageChange` | `(language: string) => void` | — | 메뉴에서 언어를 골랐을 때. 에디터 전용. |
| `languageLabel` | `boolean` | `false` | 그 언어를 위쪽 줄 오른쪽 끝에 그릴지. |
| `tabSize` | `number` | `4` | 탭을 몇 칸으로 그릴지. |
| `colorScheme` | `'system' \| 'light' \| 'dark'` | `'system'` | 어떤 팔레트로 그릴지. |
| `font` | [`DiffineFont`](../types/diffine-font) | — | 문서를 그리는 글꼴. |
| `locale` | `'en' \| 'ko'` | `'en'` | 컴포넌트 자신이 쓰는 말의 언어. |
| `strings` | [`Partial<DiffineTextStrings>`](../types/diffine-strings) | — | 로케일 대신 쓸 단어. |
| `highlight` | [`DiffineHighlight`](../types/diffine-highlight) | — | `language` 대신 쓸, 애플리케이션 자신의 강조기. |
| `renderGutter` | [`DiffineRender`](../types/diffine-render) | — | 줄 옆 여백에 넣을, 애플리케이션 자신의 내용. |
| `renderWidget` | [`DiffineRender`](../types/diffine-render) | — | 줄 아래에 넣을, 애플리케이션 자신의 내용. |

`collapse`와 `context`는 `viewer`의 것입니다. 에디터는 입력란이 문서 전체를 들고 있어서 아무것도 접지 않습니다. `applyChanges`는 `editor`의 것입니다. 변경을 적용한다는 것은 문서를 쓴다는 뜻이고, 버튼은 `connectors`가 그리는 열에 놓입니다. `connectors`와 `syncScroll`은 두 창 사이의 이야기라서 `unified`에서는 무시됩니다. `languageLabel`은 `viewer`에서 언어 이름을, `editor`에서 그 이름을 고르는 메뉴를 그립니다. 그 선택을 누가 관리하는지는 `language`, `defaultLanguage`, `onLanguageChange`가 정합니다.

그 밖에 넘긴 것은 전부 엘리먼트로 그대로 갑니다. `id`, `className`, `style`, `aria-*`는 `<div>`에서와 똑같이 동작합니다.

:::

::: fw flutter

| 인자 | 타입 | 기본값 | 무엇을 정하는지 |
| --- | --- | --- | --- |
| `view` | `DiffineView` | `DiffineView.split` | 좌우로 나눌지, 한 줄로 볼지. |
| `lineNumbers` | `bool` | `true` | 각 줄에 번호를 붙일지. |
| `markers` | `bool` | `true` | 바뀐 줄에 `+`, `−`, `~`를 붙일지. |
| `wrap` | `bool` | `false` | 긴 줄을 접을지 옆으로 흘릴지. |
| `alignLines` | `bool` | `true` | 맞은편 줄과 높이를 맞출지. |
| `collapse` | `bool` | `false` | 변경에서 먼 그대로인 줄을 접을지. |
| `context` | `int` | `3` | 변경 앞뒤로 남길 그대로인 줄 수. |
| `connectors` | `bool` | `true` | 변경을 두 창 사이에 띠로 그릴지. |
| `applyChanges` | `bool` | `false` | 변경마다 반대편에 적용하는 버튼을 둘지. |
| `syncScroll` | `bool` | `true` | 한쪽을 스크롤하면 다른 쪽도 따라갈지. |
| `header` | `bool` | `true` | 각 문서의 이름을 위에 쓸지. |
| `navigation` | `bool` | `true` | 변경 사이를 오가는 버튼을 그릴지. |
| `search` | `bool` | `true` | 창 안에서 문서를 찾을 수 있게 할지. |
| `summary` | `bool` | `true` | 아래쪽 상태 표시줄을 그릴지. |
| `showInvisibles` | `bool` | `false` | 줄 안의 공백과 탭을 그릴지. |
| `language` | `String?` | — | 문서가 어떤 언어인지. 그 언어로 색을 입힙니다. |
| `defaultLanguage` | `String` | `'plain'` | 위젯이 직접 관리할 때의 처음 언어. |
| `onLanguageChanged` | `ValueChanged<String>?` | — | 메뉴에서 언어를 골랐을 때. 에디터 전용. |
| `languageLabel` | `bool` | `true` | 그 언어를 위쪽 줄 오른쪽 끝에 그릴지. |
| `colorScheme` | `DiffineColorScheme` | `.system` | 어떤 팔레트로 그릴지. |
| `theme` | [`DiffineTheme?`](../theme) | — | 팔레트 전체와 치수. |
| `font` | [`DiffineFont?`](../types/diffine-font) | — | 문서를 그리는 글꼴. |
| `height` | `double?` | — | 비교 전체의 높이. `double.infinity`면 감싼 위젯을 채웁니다. |
| `locale` | `DiffineLocale` | `DiffineLocale.en` | 위젯 자신이 쓰는 말의 언어. |
| `strings` | [`DiffineStrings?`](../types/diffine-strings) | — | 로케일 대신 쓸 낱말. |
| `highlight` | [`DiffineHighlight?`](../types/diffine-highlight) | — | `language` 대신 쓸, 애플리케이션 자신의 강조기. |
| `renderGutter` | [`DiffineRender?`](../types/diffine-render) | — | 줄 옆 여백에 넣을, 애플리케이션 자신의 내용. |
| `renderWidget` | [`DiffineRender?`](../types/diffine-render) | — | 줄 아래에 넣을, 애플리케이션 자신의 내용. |

`collapse`와 `context`는 뷰어의 것입니다. 에디터는 입력란이 문서 전체를 들고 있어서 아무것도 접지 않습니다. `applyChanges`는 에디터의 것입니다. 변경을 적용한다는 것은 문서를 쓴다는 뜻이고, 버튼은 `connectors`가 그리는 열에 놓입니다. `connectors`와 `syncScroll`은 두 창 사이의 이야기라서 `DiffineView.unified`에서는 무시됩니다. `languageLabel`은 뷰어에서 언어 이름을, 에디터에서 그 이름을 고르는 메뉴를 그립니다. 그 선택을 누가 관리하는지는 `language`, `defaultLanguage`, `onLanguageChanged`가 정합니다.

`virtualize`는 없습니다. 행은 언제나 닿는 대로 만들어집니다. `ListView`가 원래 그런 것이기 때문입니다. 그것을 끄는 것은 `renderWidget`이고, 인자 없이 스스로 끕니다. 애플리케이션이 줄 아래에 그린 것은 언제든 커질 수 있어서, 그런 행을 대신 세워 두면 엉뚱한 자리에 서기 때문입니다.

`tabSize`는 여기가 아니라 테마에 있습니다. 탭을 몇 칸으로 그리는지는 치수이고, 치수는 한곳에 모여 있습니다.

:::

## 입력

::: fw react

| prop            | 타입      | 기본값  | 무엇을 정하는지                             |
| --------------- | --------- | ------- | ------------------------------------------- |
| `indentWithTab` | `boolean` | `false` | Tab이 탭 문자를 넣을지, 다음 컨트롤로 갈지. |
| `spellCheck`    | `boolean` | `false` | 브라우저가 맞춤법 표시를 할지.              |

둘 다 `editor`의 것입니다. `indentWithTab`을 켜도 **Shift+Tab**은 이전 컨트롤로 가고 **Escape**는 다음 Tab을 브라우저에 넘깁니다. 키보드로 빠져나올 수 없는 입력란은 되지 않습니다.

:::

::: fw flutter

| 인자            | 타입   | 기본값  | 무엇을 정하는지                             |
| --------------- | ------ | ------- | ------------------------------------------- |
| `indentWithTab` | `bool` | `false` | Tab이 탭 문자를 넣을지, 다음 컨트롤로 갈지. |

에디터 전용입니다. 켜도 **Shift+Tab**은 이전 컨트롤로 가고 **Escape**는 다음 Tab을 프레임워크에 넘깁니다. 키보드로 빠져나올 수 없는 입력란은 되지 않습니다.

`spellCheck`는 없습니다. 맞춤법은 그것을 가진 플랫폼에서는 플랫폼의 몫이고 나머지에서는 아예 없는 기능이라, 절반에서만 동작하는 인자는 위젯이 지킬 수 없는 약속이 됩니다.

:::

## 지금 보고 있는 변경

::: fw react

| prop | 타입 | 기본값 | 무엇인지 |
| --- | --- | --- | --- |
| `selected` | `number` | — | 보고 있는 변경, 없으면 -1. |
| `defaultSelected` | `number` | `-1` | 처음에 선택할 변경. |
| `onSelectedChange` | `(selected: number, change: DiffChange \| null) => void` | — | 다른 변경으로 이동했을 때. |

`selected`는 `changes`의 인덱스입니다. 값을 주면 애플리케이션이 관리하는 것이 되고, 값을 바꾸면 버튼을 눌렀을 때와 똑같이 화면이 이동합니다. `onSelectedChange`는 누가 관리하든 호출됩니다.

:::

::: fw flutter

| 인자                | 타입                               | 기본값 | 무엇인지                   |
| ------------------- | ---------------------------------- | ------ | -------------------------- |
| `selected`          | `int?`                             | —      | 보고 있는 변경, 없으면 -1. |
| `defaultSelected`   | `int`                              | `-1`   | 처음에 선택할 변경.        |
| `onSelectedChanged` | `void Function(int, DiffChange?)?` | —      | 다른 변경으로 이동했을 때. |

`selected`는 `changes`의 인덱스입니다. 값을 주면 애플리케이션이 관리하는 것이 되고, 값을 바꾸면 버튼을 눌렀을 때와 똑같이 화면이 이동합니다. `onSelectedChanged`는 누가 관리하든 호출됩니다.

:::

## 창 안에서 찾기

창은 각자 찾습니다. 위쪽 막대의 버튼이 그 창 아래에 막대를 열고, **Ctrl+F**(맥에서는 **Cmd+F**)는 키보드가 놓인 창의 막대를 엽니다. 양쪽은 질의도 개수도 막대도 각자여서, 한쪽을 닫아도 다른 쪽은 그대로입니다.

입력하는 동안 찾은 자리가 표시되고 창은 지금 보고 있는 자리로 이동합니다. **Enter**와 **Shift+Enter**로 다음과 이전을 오갑니다. 입력란 안의 스위치 세 개는 각각 대소문자 구분, 단어 단위, 정규식입니다. **Escape**는 막대를 닫습니다.

에디터에는 바꾸기 줄이 하나 더 붙고 **Ctrl+H**가 막대와 함께 그 줄을 엽니다. 바꿀 내용은 적은 글자 그대로 들어갑니다. `$1`은 달러 기호와 숫자 1입니다. <Fw react="브라우저 자신의 편집 명령으로 넣기 때문에 Ctrl+Z로 되돌립니다." flutter="입력란 자신의 컨트롤러로 넣기 때문에 플랫폼의 되돌리기로 되돌립니다." /> `readOnly`인 쪽은 찾기만 되고 바꾸기는 되지 않습니다.

찾기를 연 창도 보이는 줄만 그립니다. 9000번째 줄에서 찾은 자리는 그리로 스크롤한 다음 그려집니다. <Fw react="`search={false}`" flutter="`search: false`" />는 버튼과 단축키를 함께 끕니다. 그 키를 <Fw react="페이지" flutter="화면" />의 다른 기능이 쓰고 있다면 이 값을 쓰세요.
