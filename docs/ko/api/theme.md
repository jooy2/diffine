---
title: 테마
order: 4
description: '두 화면이 그리는 데 쓰는 색과 치수 전부, 그리고 그중 하나를 바꾸는 방법.'
---

# 테마

::: fw react

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
| `--diffine-invisible`      | `#b6c0cf`   | `#4b5768`   |
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

이미지 비교가 칠하는 색과, 그 뒤에 깔리는 두 색입니다.

| 속성                      | 밝은 테마                | 어두운 테마               |
| ------------------------- | ------------------------ | ------------------------- |
| `--diffine-image-changed` | `rgb(232 62 140 / 0.55)` | `rgb(255 92 168 / 0.55)`  |
| `--diffine-image-added`   | `rgb(26 127 75 / 0.5)`   | `rgb(63 190 122 / 0.5)`   |
| `--diffine-image-removed` | `rgb(194 51 63 / 0.5)`   | `rgb(255 106 116 / 0.5)`  |
| `--diffine-image-outline` | `rgb(20 28 40 / 0.85)`   | `rgb(228 233 240 / 0.85)` |
| `--diffine-image-marker`  | `rgb(14 127 252 / 0.95)` | `rgb(76 157 255 / 0.95)`  |
| `--diffine-image-halo`    | `rgb(255 255 255 / 0.6)` | `rgb(6 10 16 / 0.6)`      |
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

:::

::: fw flutter

## 팔레트

`DiffineTheme`이 색과 치수 전부를 담은 값 하나입니다. 위젯이 쓰는 것은 `DiffineTheme.light`와 `DiffineTheme.dark`이고, 몇 개만 바꿀 때는 `copyWith`를 씁니다.

```dart
TextDiff(
  before: saved,
  after: draft,
  theme: DiffineTheme.light.copyWith(accent: const Color(0xff7c4dff), height: 640),
);
```

테마를 주면 `colorScheme`도 함께 정해집니다. 테마 자체가 어느 팔레트인지에 대한 결정이기 때문입니다.

### 색

| 필드            | 밝은 테마   | 어두운 테마 |
| --------------- | ----------- | ----------- |
| `surface`       | `#ffffff`   | `#1b222c`   |
| `text`          | `#1f2733`   | `#e4e9f0`   |
| `muted`         | `#6e798c`   | `#8d99ad`   |
| `border`        | `#d6dee9`   | `#2f3945`   |
| `gutter`        | `#f4f7fb`   | `#232b36`   |
| `accent`        | `#0e7ffc`   | `#4c9dff`   |
| `invisible`     | `#b6c0cf`   | `#4b5768`   |
| `insertLine`    | `#e7f8ee`   | `#12301f`   |
| `insertPiece`   | `#a5e9c1`   | `#206c42`   |
| `deleteLine`    | `#fdecee`   | `#351c20`   |
| `deletePiece`   | `#ffc3c8`   | `#7f303a`   |
| `insertText`    | `#1a7f4b`   | `#5fd08a`   |
| `deleteText`    | `#c2333f`   | `#ff8b95`   |
| `search`        | `#ffe9a8`   | `#5c4713`   |
| `searchCurrent` | `#ffbd3d`   | `#8a5c0f`   |
| `blank`         | `#f0f3f7`   | `#151b23`   |
| `selection`     | `#0e7ffc33` | `#4c9dff40` |

`Line` 쪽이 줄 전체에 옅게 깔리는 색이고, `Piece` 쪽이 그 위에서 바뀐 부분을 짚는 색입니다. `Text` 쪽은 같은 두 색을 글자로 읽을 만큼 진하게 만든 것으로, 뒤에 깔린 것이 여백뿐인 아래쪽 상태 표시줄의 집계에 씁니다. `search`와 `searchCurrent`는 찾기가 짚는 색입니다. 앞은 찾은 자리 전부, 뒤는 지금 보고 있는 자리입니다. 강조색 대신 세 번째 색을 쓰는 이유는, 찾은 자리가 이미 초록이나 빨강으로 물든 줄에 놓일 수 있고 그 세 바탕 모두에서 읽혀야 하기 때문입니다. `selection`은 에디터만 쓰고, 반투명해야 합니다. 선택 영역 아래의 글자는 입력란 뒤에 그려지기 때문입니다.

`code`는 강조기가 쓰는 여덟 색을 담은 `DiffineCodeColours`입니다. `keyword`, `string`, `comment`, `number`, `title`, `type`, `variable`, `meta`입니다. `image`는 이미지 비교가 칠하는 색과 그 뒤에 깔리는 두 색을 담은 `DiffineImageColours`입니다.

| `theme.image` | 밝은 테마     | 어두운 테마   |
| ------------- | ------------- | ------------- |
| `changed`     | `#e83e8c` 55% | `#ff5ca8` 55% |
| `added`       | `#1a7f4b` 50% | `#3fbe7a` 50% |
| `removed`     | `#c2333f` 50% | `#ff6a74` 50% |
| `outline`     | `#141c28` 40% | `#e4e9f0` 35% |
| `marker`      | `#0e7ffc` 95% | `#4c9dff` 95% |
| `ground`      | `#eaeef4`     | `#151b23`     |
| `chequer`     | `#dbe1ea`     | `#1e2530`     |

### 치수

| 필드                 | 기본값          | 무엇인지                             |
| -------------------- | --------------- | ------------------------------------ |
| `height`             | `384`           | 뷰어의 높이. 단위는 논리 픽셀입니다. |
| `radius`             | `8`             | 테두리의 모서리 반지름.              |
| `fontFamily`         | 고정폭 스택     | 문서를 그리는 서체.                  |
| `fontFamilyFallback` | `['monospace']` | 글리프가 없을 때 대신 쓸 서체.       |
| `fontSize`           | `13`            | 그 크기.                             |
| `lineHeight`         | `24`            | 접히지 않은 줄 하나의 높이.          |
| `letterSpacing`      | —               | 자간.                                |
| `linksWidth`         | `48`            | 두 창 사이 열의 너비.                |
| `tabSize`            | `4`             | 탭을 몇 칸으로 그릴지.               |

`height`는 `TextDiff(height:)`가 비교 하나에 대해 덮어쓰는 값이고, 어느 쪽이든 `double.infinity`면 감싼 위젯을 채웁니다. `lineHeight`는 배수가 아니라 길이입니다. 줄에 글자가 있든 없든 행의 높이가 그만큼이고, 에디터의 입력란이 그 행 위에 겹쳐지며, 아직 만들지 않은 행도 정확히 그만큼의 높이로 대신하기 때문입니다.

:::
