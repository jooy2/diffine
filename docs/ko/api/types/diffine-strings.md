---
title: DiffineStrings
order: 13
description: '두 화면이 화면에 쓰는 낱말 전부와, 각각의 영어 기본값.'
---

# `DiffineStrings`

두 화면이 함께 쓰는 낱말입니다. <Fw react="React에서는 `DiffineCommonStrings`이고, 아래 두 묶음이 이것을 확장합니다." flutter="Flutter는 낱말 묶음이 하나이고, 두 위젯이 함께 읽는 부분이 이것입니다." />

| 키               | 한국어 기본값                      |
| ---------------- | ---------------------------------- |
| `before`         | `이전`                             |
| `after`          | `이후`                             |
| `empty`          | `아직 비교할 내용이 없습니다.`     |
| `identical`      | `두 문서가 같습니다.`              |
| `previousChange` | `이전 변경`                        |
| `nextChange`     | `다음 변경`                        |
| `changePosition` | `변경 {total}건 중 {position}번째` |

문서 비교가 더하는 낱말입니다. <Fw react="`DiffineTextStrings`이 `TextDiff`가 받는 타입입니다." flutter="`TextDiff`가 읽습니다." />

| 키               | 한국어 기본값                                           |
| ---------------- | ------------------------------------------------------- |
| `placeholder`    | `여기에 문서를 입력하거나 붙여 넣으세요.`               |
| `added`          | `추가됨`                                                |
| `removed`        | `삭제됨`                                                |
| `changed`        | `변경됨`                                                |
| `folded`         | `변경 없는 {lines}줄`                                   |
| `expand`         | `변경 없는 {lines}줄 펼치기`                            |
| `applyChange`    | `이 변경을 {label}에 적용`                              |
| `format`         | `{before} → {after}`                                    |
| `mixedEndings`   | `혼용`                                                  |
| `noFinalNewline` | `끝 개행 없음`                                          |
| `language`       | `구문 강조`                                             |
| `summary`        | `변경 {changes}건, {inserted}줄 추가, {deleted}줄 삭제` |
| `documentSize`   | `{label}: {characters}자, {size}`                       |
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

이미지 비교가 더하는 낱말입니다. <Fw react="`DiffineImageStrings`이 `ImageDiff`가 받는 타입입니다. 두 묶음을 한 곳에 두고 싶다면 둘을 합친 `DiffineStrings`을 쓰세요." flutter="`ImageDiff`가 읽습니다." />

| 키             | 한국어 기본값                         |
| -------------- | ------------------------------------- |
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
| `at`           | `좌표`                                |
| `loupeMove`    | `끌어서 확대 창 옮기기`               |
| `loupeSize`    | `끌어서 더 넓은 범위 보기`            |

`added`, `removed`, `changed`, `summary`, `documentSize`, `changePosition`, `searchPosition`, `searchEmpty`, `imageSummary`는 화면에 나오지 않고 스크린 리더가 읽습니다. `language`는 에디터의 언어 메뉴 이름으로 읽힙니다.

자리 표시자는 이렇게 채워집니다. `searchIn`과 `chooseIn`의 `{label}` 자리에는 그 버튼이 맡은 쪽의 이름이 들어갑니다. 한 <Fw react="컴포넌트에" flutter="위젯에" /> 같은 버튼이 둘씩 놓이므로 이것으로 구분합니다. `summary`의 `{changes}`, `{inserted}`, `{deleted}` 자리에는 집계가 들어갑니다. `documentSize`의 `{label}` 자리에는 한쪽의 이름이, `{characters}`와 `{size}` 자리에는 읽는 사람의 언어로 이미 써 둔 수가 들어가고, `imageSize`의 `{width}`, `{height}`, `{size}`도 마찬가지입니다. `imageSummary`는 `{regions}`와 `{percent}`를, `zoomLevel`은 `{percent}`를 받습니다. `at`은 확대한 픽셀 아래 좌표 앞에 붙는 말이고, `loupeMove`와 `loupeSize`는 그 패널을 옮기는 손잡이와 더 넓은 범위를 보는 모서리의 이름입니다. `placeholder`는 에디터의 빈 입력란에 나오는 문구입니다.

::: fw react

`strings`는 일부만 담는 타입입니다. 한 낱말만 바꾸려면 한 낱말만 넘기면 됩니다. `TextDiff`는 `Partial<DiffineTextStrings>`을, `ImageDiff`는 `Partial<DiffineImageStrings>`을 받습니다.

:::

::: fw flutter

`strings`는 일부가 아니라 `DiffineStrings` 전부입니다. Dart에는 일부만 담는 타입이 없기 때문입니다. 로케일의 기본값에서 시작해 바꿀 것만 바꾸세요.

```dart
TextDiff(
  before: saved,
  after: draft,
  strings: baseStringsFor(DiffineLocale.ko).copyWith(before: '저장본', after: '작업본'),
);
```

:::
