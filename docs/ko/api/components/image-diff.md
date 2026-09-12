---
title: ImageDiff
order: 2
description: '두 이미지 또는 여러 장을 나란히, 겹쳐서, 갈라서, 표시만으로 봅니다. 설정과 타입과 기본값 전부.'
---

# `ImageDiff`

::: fw react

```tsx
<ImageDiff before={saved} after={rendered} />
<ImageDiff mode="editor" view="wipe" />
```

:::

::: fw flutter

```dart
ImageDiff(before: DiffineEncodedImage(saved), after: DiffineEncodedImage(rendered));
ImageDiff(mode: DiffineMode.editor, view: DiffineImageView.wipe, onChoose: pick);
```

:::

## 이미지

::: fw react

| prop | 타입 | 기본값 | 무엇인지 |
| --- | --- | --- | --- |
| `mode` | `'viewer' \| 'editor'` | `'viewer'` | 이미지를 보기만 할지 고르기도 할지. |
| `before` | `DiffineImageInput` | — | 왼쪽 이미지. |
| `after` | `DiffineImageInput` | — | 오른쪽 이미지. |
| `pictures` | `readonly DiffineImageInput[]` | — | 두 장 대신 여러 장. 목록 모드를 켭니다. |
| `baseline` | `number` | `0` | 나머지를 무엇에 견줄지. |
| `picturesResult` | [`DiffImagesResult`](../types/diff-images-result) | — | 이미 구해 둔 목록 비교 결과. |
| `onPicturesDiff` | `(result: DiffImagesResult \| null) => void` | — | 목록 비교 결과. |
| `defaultBefore` | `DiffineImageInput` | — | 왼쪽이 처음에 보여 줄 이미지. 에디터 전용. |
| `defaultAfter` | `DiffineImageInput` | — | 오른쪽이 처음에 보여 줄 이미지. 에디터 전용. |
| `onBeforeChange` | `(value: File) => void` | — | 왼쪽에 이미지를 골랐을 때. |
| `onAfterChange` | `(value: File) => void` | — | 오른쪽에 이미지를 골랐을 때. |
| `onDiff` | `(result: DiffImageResult \| null) => void` | — | 비교를 다시 할 때마다 그 결과. |
| `result` | [`DiffImageResult`](../types/diff-image-result) | — | 이미 계산해 둔 비교. 이미지는 그래도 그립니다. |
| `diff` | [`DiffImageOptions`](../types/diff-image-options) | — | 어떻게 비교할지. [`diffImage`](../methods/diff-image) 참고. |
| `maxPixels` | `number` | `4000000` | 이미지를 몇 픽셀까지 해석할지. |

`DiffineImageInput`은 이미지 자체이거나 이름을 붙인 이미지입니다. `Blob | ImageBitmap | DiffPixels`, 또는 그중 하나를 감싼 `{ content, label }`입니다. URL은 받지 않습니다. 받아 오는 일은 애플리케이션의 몫입니다.

`editor`도 제어 컴포넌트와 비제어 컴포넌트 양쪽을 지원합니다. `defaultBefore`와 `defaultAfter`는 컴포넌트에 맡기고, `before`와 `after`는 애플리케이션이 관리합니다. `onBeforeChange`와 `onAfterChange`는 누가 관리하든 호출됩니다.

:::

::: fw flutter

| 인자 | 타입 | 기본값 | 무엇인지 |
| --- | --- | --- | --- |
| `mode` | `DiffineMode` | `DiffineMode.viewer` | 이미지를 보기만 할지 고르기도 할지. |
| `before` | `DiffineImageContent?` | — | 왼쪽 이미지. |
| `after` | `DiffineImageContent?` | — | 오른쪽 이미지. |
| `beforeLabel` | `String?` | — | 헤더가 왼쪽을 부르는 이름. |
| `afterLabel` | `String?` | — | 오른쪽을 부르는 이름. |
| `pictures` | `List<DiffineImageContent>?` | — | 두 장 대신 여러 장. 목록 모드를 켭니다. |
| `pictureLabels` | `List<String>?` | — | 각 이미지의 이름. |
| `baseline` | `int` | `0` | 나머지를 무엇에 견줄지. |
| `picturesResult` | [`DiffImagesResult?`](../types/diff-images-result) | — | 이미 구해 둔 목록 비교 결과. |
| `onPicturesDiff` | `ValueChanged<DiffImagesResult?>?` | — | 목록 비교 결과. |
| `onChoose` | `Future<DiffineImageContent?> Function(DiffineSide)?` | — | 이미지를 골라 달라고 할 때. 에디터 전용. |
| `onDiff` | `ValueChanged<DiffImageResult?>?` | — | 비교를 다시 할 때마다 그 결과. |
| `result` | [`DiffImageResult?`](../types/diff-image-result) | — | 이미 계산해 둔 비교. 이미지는 그래도 그립니다. |
| `diff` | [`DiffImageOptions`](../types/diff-image-options) | `kDiffineImageDefaults` | 어떻게 비교할지. [`diffImage`](../methods/diff-image) 참고. |
| `maxPixels` | `int` | `4000000` | 이미지를 몇 픽셀까지 해석할지. |

`DiffineImageContent`는 sealed 클래스이고 모양이 셋입니다. 파일 바이트를 감싼 `DiffineEncodedImage`, 이미 해석한 `ui.Image`를 감싼 `DiffineDecodedImage`, `DiffPixels`를 감싼 `DiffinePixelImage`입니다. URL은 없습니다. 받아 오는 일은 애플리케이션의 몫이고, 여기에는 이미 손에 든 것만 옵니다.

`onChoose`가 에디터의 전부입니다. 위젯이 한쪽에 넣을 이미지를 달라고 하면 애플리케이션이 하나를 주거나, 마음을 바꾼 사람을 위해 `null`을 줍니다. 파일 선택기는 플러그인이고 권한이며, 둘 다 비교 뷰어 안에 들어갈 것이 아닙니다.

:::

## 화면

::: fw react

| prop | 타입 | 기본값 | 무엇을 정하는지 |
| --- | --- | --- | --- |
| `view` | `'split' \| 'overlay' \| 'wipe' \| 'mask'` | `'split'` | 두 장을 어떻게 놓을지. |
| `unchanged` | `'keep' \| 'dim' \| 'hide'` | `'keep'` | 달라지지 않은 부분을 어떻게 할지. |
| `wheel` | `'zoom' \| 'pan'` | `'zoom'` | 창 위에서 휠이 하는 일. |
| `loupe` | `boolean` | `true` | 포인터 아래 픽셀을 확대해 보여 줄지. |
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
| `strings` | [`Partial<DiffineImageStrings>`](../types/diffine-strings) | — | 로케일 대신 쓸 낱말. |

`split`은 창을 둘 그리고 나머지 셋은 하나를 그리며, 그 위에 두 이름을 함께 씁니다. 표시하는 색은 prop이 아니라 [커스텀 속성](../theme#색)입니다. 캔버스에는 스타일을 입힐 수 없어서 값을 읽어 직접 칠하기 때문입니다.

:::

::: fw flutter

| 인자 | 타입 | 기본값 | 무엇을 정하는지 |
| --- | --- | --- | --- |
| `view` | `DiffineImageView` | `DiffineImageView.split` | 두 장을 어떻게 놓을지. |
| `unchanged` | `DiffineImageUnchanged` | `.keep` | 달라지지 않은 부분을 어떻게 할지. |
| `wheel` | `DiffineImageWheel` | `.zoom` | 창 위에서 휠이 하는 일. |
| `loupe` | `bool` | `true` | 포인터 아래 픽셀을 확대해 보여 줄지. |
| `fade` | `double?` | `0.5` | 두 번째 이미지를 얼마나 비칠지. overlay 전용. |
| `onFadeChanged` | `ValueChanged<double>?` | — | 겹침 정도가 바뀌었을 때. |
| `wipe` | `double?` | `0.5` | 두 장을 가르는 선의 위치. 0에서 1. wipe 전용. |
| `onWipeChanged` | `ValueChanged<double>?` | — | 그 선이 움직였을 때. |
| `marks` | `bool` | `true` | 달라진 픽셀에 색을 깔지. |
| `outlines` | `bool` | `true` | 변경마다 상자를 두를지. |
| `header` | `bool` | `true` | 각 창 위에 이름을 쓸지. |
| `navigation` | `bool` | `true` | 변경 사이를 오가는 버튼을 그릴지. |
| `zoom` | `bool` | `true` | 확대 버튼을 그릴지. |
| `summary` | `bool` | `true` | 창 아래 막대를 그릴지. |
| `colorScheme` | `DiffineColorScheme` | `.system` | 어느 팔레트로 그릴지. |
| `theme` | [`DiffineTheme?`](../theme) | — | 팔레트 전체와 치수. |
| `height` | `double?` | — | 비교 전체의 높이. |
| `locale` | `DiffineLocale` | `DiffineLocale.en` | 위젯이 쓰는 말의 언어. |
| `strings` | [`DiffineStrings?`](../types/diffine-strings) | — | 로케일 대신 쓸 낱말. |

`split`은 창을 둘 그리고 나머지 셋은 하나를 그리며, 그 위에 두 이름을 함께 씁니다. 표시하는 색은 [팔레트](../theme#팔레트)의 `theme.image` 일곱 개입니다.

:::

## 움직이기

::: fw react

| prop | 타입 | 기본값 | 무엇을 정하는지 |
| --- | --- | --- | --- |
| `viewport` | `DiffineImageViewport \| 'fit'` | — | 지금 보고 있는 자리. |
| `defaultViewport` | `DiffineImageViewport \| 'fit'` | `'fit'` | 처음 보여 줄 자리. |
| `onViewportChange` | `(viewport: DiffineImageViewport) => void` | — | 옮기거나 확대했을 때. |
| `selected` | `number` | — | 몇 번째 변경으로 옮겨 갔는지. 없으면 -1. |
| `defaultSelected` | `number` | `-1` | 어느 변경에서 시작할지. |
| `onSelectedChange` | `(selected: number, region: DiffImageRegion \| null) => void` | — | 변경으로 옮겨 갔을 때. |

`DiffineImageViewport`는 `{ scale, x, y }`입니다. 프레임의 한 픽셀을 화면 몇 픽셀로 그리는지, 그리고 창 한가운데가 보고 있는 프레임 위의 점입니다. 두 창에 같은 값을 주기 때문에 좌우 보기가 함께 움직입니다.

:::

::: fw flutter

| 인자 | 타입 | 기본값 | 무엇을 정하는지 |
| --- | --- | --- | --- |
| `viewport` | `DiffineImageViewport?` | — | 지금 보고 있는 자리. `null`이면 창에 맞춥니다. |
| `onViewportChanged` | `ValueChanged<DiffineImageViewport>?` | — | 옮기거나 확대했을 때. |
| `selected` | `int?` | — | 몇 번째 변경으로 옮겨 갔는지. 없으면 -1. |
| `defaultSelected` | `int` | `-1` | 어느 변경에서 시작할지. |
| `onSelectedChanged` | `void Function(int, DiffImageRegion?)?` | — | 변경으로 옮겨 갔을 때. |

`DiffineImageViewport`는 `{ scale, x, y }`입니다. 프레임의 한 픽셀을 논리 픽셀 몇 개로 그리는지, 그리고 창 한가운데가 보고 있는 프레임 위의 점입니다. 두 창에 같은 값을 주기 때문에 좌우 보기가 함께 움직입니다. `defaultViewport`는 없습니다. `null`이 창에 맞춘 상태이고, 값을 주지 않은 창이 시작하는 자리도 그것입니다.

:::
