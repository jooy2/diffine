---
title: API
order: 1
description: 'Diffine이 내보내는 것마다 문서 하나. 두 화면과 그 뒤의 엔진, 오가는 값, 그리고 테마.'
---

# API

<Fw react="`diffine-react`가 내보내는 것마다 문서 하나입니다." flutter="`diffine`이 내보내는 것마다 문서 하나입니다." /> 각각이 무엇인지는 [가이드](../guide/getting-started)에 있고, 이 문서는 하나를 찾아볼 때 보는 곳입니다.

## 진입점

::: fw react

| import | 무엇이 들어 있는지 | 그리기 전까지 |
| --- | --- | --- |
| `diffine-react` | 비교 전부. 텍스트와 이미지와 패치, 그리고 타입. | 2.6 kB |
| `diffine-react/diff` | 텍스트 비교 엔진만. | 2.9 kB |
| `diffine-react/image` | 이미지 비교 엔진만. | 2.6 kB |
| `diffine-react/patch` | 유니파이드 패치 읽기와 쓰기. | 3.3 kB |
| `diffine-react/text-diff` | `TextDiff`와 `DIFFINE_LANGUAGES`. | 17.6 kB |
| `diffine-react/image-diff` | `ImageDiff`. | 10.5 kB |
| `diffine-react/types` | 타입만. prop에 타입 이름을 쓰려는 애플리케이션을 위한 것. | 0 kB |
| `diffine-react/styles.css` | 스타일시트. 두 컴포넌트가 함께 씁니다. | 4.3 kB |

요청하지 않은 것은 번들에 들어가지 않습니다. 루트는 함수와 타입뿐이라 변경 개수만 세는 페이지는 React도 스타일시트도 받지 않고, 뷰는 각자 진입점이라 하나만 쓰는 페이지는 하나만 받습니다. 크기는 gzip 기준이고 React는 뺐으며, 페이지가 무언가를 그리기 전에 내려받는 양입니다. 문법 파일은 여기에 없습니다. `TextDiff`는 `language`를 받았을 때만 문법을 요청합니다.

:::

::: fw flutter

```dart
import 'package:diffine/diffine.dart';
```

이 하나에 전부 들어 있습니다. 위젯 둘, 엔진, 엔진이 돌려주는 값, 테마. 엔진만 따로 들여오는 진입점은 없습니다. 그것으로 아낄 것이 없기 때문입니다. `diffText`만 부르는 프로그램에는 위젯을 가리키는 곳이 없고, 아무도 가리키지 않는 코드는 컴파일러가 버립니다.

:::

## 무엇이 있나

| 묶음 | 무엇이 들어 있나 |
| --- | --- |
| [컴포넌트](./components/) | <Fw react="컴포넌트" flutter="위젯" /> 둘과 각각이 받는 <Fw react="프로퍼티" flutter="인자" /> 전부. |
| [메서드](./methods/) | 엔진. 비교하는 함수와 패치를 읽고 쓰는 함수. |
| [타입](./types/) | 그 함수들이 돌려주는 값과 받는 값. |
| [테마](./theme) | <Fw react="스타일시트가 선언하는 커스텀 속성." flutter="색과 치수 전부를 한 값으로." /> |

항목 하나에 문서 하나입니다. 문서의 주소가 곧 그 항목의 이름입니다.
