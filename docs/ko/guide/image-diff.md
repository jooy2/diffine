---
title: 이미지 비교
order: 3
---

# 이미지 비교

`ImageDiff`는 두 이미지를 픽셀 단위로 비교하고 찾아낸 것을 그립니다. 달라진 픽셀에는 양쪽 모두 색이 깔리고, 뭉쳐 있는 곳마다 상자가 둘리고, 확대와 이동은 두 창이 함께 움직입니다.

<DiffinePictures sample="retouched" height="24rem" />

위의 두 장은 같은 사진이고, 오른쪽은 창 부분에 자기 자신의 일부를 복제해 덮은 것입니다. 이미지 비교를 꺼내 드는 흔한 상황이 이것입니다. 어느 부분을 손봤는지가 질문입니다.

그 위에 그려지는 것은 세 가지이고, 이 페이지의 모든 예제에서 같습니다.

- **분홍**은 두 이미지가 모두 덮으면서 값이 다른 픽셀입니다. 창에 보이는 사각형이 그것입니다.
- **상자**는 그 픽셀이 뭉친 곳마다 둘립니다. 전체를 창에 맞춰 놓으면 세 픽셀짜리 변경은 보이지 않지만 상자는 남습니다. 두 색으로 그린 1픽셀 점선이라 아래 사진이 둘 중 어느 쪽과 비슷하든 나머지 한 색이 보입니다. 점선이 아니라 실선인 **파란** 상자는 막대의 버튼으로 지금 짚어 놓은 변경입니다.
- **초록과 빨강**은 두 이미지 중 한쪽만 덮는 픽셀입니다. 크기가 다르거나 위치가 어긋나면 남는 자리인데, 여기서는 두 장의 크기가 같아서 하나도 없습니다.

아래 막대가 그것을 셉니다. 변경된 곳 한 군데, 그리고 그것이 전체에서 차지하는 비율입니다.

::: fw react

이 페이지에 그림은 없습니다. 모든 예제는 페이지가 브라우저에서 내려받아 고친 파일을 컴포넌트가 직접 비교한 결과입니다.

:::

::: fw flutter

이 페이지의 예제는 React 패키지 쪽입니다. 글 옆에 그려지기 때문입니다. Flutter 위젯이 같은 이미지 네 쌍을 비교하는 모습은 [직접 써보기](./playground)에 있고, 아래에 나오는 옵션이 그 화면의 스위치로 놓여 있습니다.

:::

## 두 가지 모드

`mode`는 이미지를 보기만 할지 고르기도 할지를 정합니다.

::: fw react

```tsx
import { ImageDiff } from 'diffine-react/image-diff';
import 'diffine-react/styles.css';

<ImageDiff before={saved} after={rendered} />;
<ImageDiff mode="editor" />;
```

기본값 `viewer`는 받은 것을 그립니다. `editor`는 이미지를 넣는 방법을 모두 붙입니다. 빈 창을 누르면 파일 선택 창이 열리고, 채워진 창은 끌어다 놓은 이미지를 받고, 위쪽 막대에는 양쪽마다 버튼이 하나씩 있습니다. 두 이미지를 한 창에 그리는 보기에서는 비어 있는 쪽으로 가고, 양쪽 다 차 있으면 오른쪽으로 갑니다. 아래 두 창에 PNG를 끌어다 놓아 보세요.

:::

::: fw flutter

```dart
import 'package:diffine/diffine.dart';

ImageDiff(before: saved, after: rendered);
ImageDiff(mode: DiffineMode.editor, onChoose: chooseAPicture);
```

기본값 `DiffineMode.viewer`는 받은 것을 그립니다. `DiffineMode.editor`는 빈 창에 버튼을 놓고, 그 버튼이 하는 일이 `onChoose`입니다. 파일을 여는 데는 피커가 필요하고, 피커는 플러그인이고, 어떤 플러그인을 쓸지는 애플리케이션이 정할 일이기 때문입니다.

```dart
ImageDiff(
  mode: DiffineMode.editor,
  onChoose: (DiffineSide side) async {
    final XFile? file = await openFile();

    return file == null ? null : DiffineEncodedImage(await file.readAsBytes());
  },
);
```

:::

<DiffinePictures sample="badge" height="22rem" />

## 두 이미지 전달하기

::: fw react

`before`와 `after`는 `Blob`, `ImageBitmap`, 그리고 `ImageData` 모양의 픽셀 버퍼를 받습니다. 그대로 주거나 이름을 붙여서 줍니다.

```tsx
<ImageDiff
  before={{ content: saved, label: 'baseline.png' }}
  after={{ content: rendered, label: 'run 4821' }}
/>
```

보통은 `Blob`입니다. 파일 입력이 넘겨주는 것도, `fetch`로 받아 오는 것도 그것입니다.

```tsx
<input type="file" accept="image/*" onChange={(event) => setAfter(event.target.files[0])} />
```

목록에 URL은 없고, 빠뜨린 것이 아니라 뺀 것입니다. 컴포넌트가 직접 받아 오면 애플리케이션이 한 번도 확인하지 못한 바이트를 해석하게 됩니다. 받아 오는 코드는 한 줄이고, 그 한 줄은 애플리케이션이 쥐고 있는 편이 낫습니다.

```tsx
const response = await fetch('/baseline.png');

setBefore(await response.blob());
```

`editor`는 제어 컴포넌트와 비제어 컴포넌트 양쪽을 지원합니다. `defaultBefore`와 `defaultAfter`를 주면 컴포넌트가 상태를 관리하고, `before`와 `after`를 주면 애플리케이션이 관리하며 고른 결과는 `onBeforeChange`와 `onAfterChange`로 알려 줍니다. 어느 쪽인지는 첫 렌더에서 정해집니다. 나중에 도착한 이미지는 비교하던 사람의 이미지를 도중에 교체하게 되기 때문입니다.

:::

::: fw flutter

`before`와 `after`는 파일의 바이트, 이미 디코딩한 이미지, 픽셀 버퍼 셋 중 하나를 받습니다. `DiffineImageContent`의 세 가지 모양이고, 헤더에 쓸 이름은 따로 받습니다.

```dart
ImageDiff(
  before: DiffineEncodedImage(saved),
  beforeLabel: 'baseline.png',
  after: DiffineEncodedImage(rendered),
  afterLabel: 'run 4821',
);
```

보통은 `DiffineEncodedImage`입니다. 파일 피커도 에셋도 응답도 전부 바이트를 넘겨주기 때문입니다.

```dart
final ByteData bytes = await rootBundle.load('assets/baseline.png');

setState(() => before = DiffineEncodedImage(bytes.buffer.asUint8List()));
```

나머지 둘은 애플리케이션이 이미 들고 있는 `ui.Image`를 위한 `DiffineDecodedImage`와, 어디서 왔든 픽셀 버퍼를 받는 `DiffinePixelImage`입니다.

목록에 URL은 없고, 빠뜨린 것이 아니라 뺀 것입니다. 위젯이 직접 받아 오면 애플리케이션이 한 번도 확인하지 못한 바이트를 해석하게 됩니다. 받아 오는 코드는 한 줄이고, 그 한 줄은 애플리케이션이 쥐고 있는 편이 낫습니다.

:::

## 네 가지 보기

`view`는 두 장을 어떻게 놓을지 정합니다. 하나로는 모든 질문에 답할 수 없어서 네 가지입니다.

`split`은 좌우로 놓습니다. 각 이미지가 무엇인지 보여 주고, 기본값입니다.

`overlay`는 위아래로 겹치고, 막대의 슬라이더로 둘 사이를 흐리게 넘깁니다. 몇 픽셀 옮겨 간 레이아웃 두 판본은 좌우로 놓으면 비교하기 어렵고 여기서는 쉽습니다.

<DiffinePictures sample="retouched" view="overlay" height="22rem" />

`wipe`는 둘을 가르는 선을 긋고 그 선을 끌고 다니게 합니다. 한쪽 경계를 다른 쪽 경계에 대 보는 방식입니다.

<DiffinePictures sample="retouched" view="wipe" height="22rem" />

`mask`는 두 이미지를 모두 치우고 달라진 것만 남깁니다. 아무것도 없는 자리를 뜻하는 격자 위에 표시만 뜹니다. 나머지 셋에서 어디를 봐야 할지 알려 주는 보기입니다.

<DiffinePictures sample="badge" view="mask" height="20rem" />

## 무엇을 어떤 색으로 표시하는지

`marks`는 달라진 픽셀에 색을 깝니다. `outlines`는 뭉친 덩어리마다 상자를 두릅니다. 바뀐 글자가 세 픽셀로 줄어들 만큼 축소했을 때 남는 것은 상자 쪽입니다. 둘 다 기본으로 켜져 있는 boolean입니다.

분홍은 바뀐 픽셀입니다. 초록과 빨강은 두 이미지 중 한쪽만 덮는 픽셀, 곧 크기가 다르거나 위치가 어긋나서 남은 자리입니다. 줄이 새로 생기거나 사라졌을 때 쓰는 초록과 빨강이 그대로 옵니다.

상자는 같은 굵기로 두 번 그립니다. `halo` 색 실선 위에 `outline` 색 점선. 한 가지 색으로는 모든 이미지에서 보이지 않습니다. 이미지는 어떤 색이든 될 수 있고, 사진의 어두운 쪽에 놓인 어두운 상자는 아무도 찾지 못하는데 변경은 대개 바로 거기에 있습니다. 두 색이면 언제나 보이는 얇은 점선 하나가 됩니다. 지금 짚고 있는 변경은 점선이 아니라 `marker` 색 실선입니다. 더 굵게 하지 않고도 나머지와 구분됩니다.

::: fw react

이 가운데 prop은 하나도 없습니다. 색은 모두 엘리먼트의 커스텀 속성입니다.

```css
.diffine-image {
  --diffine-image-changed: rgb(232 62 140 / 0.55);
  --diffine-image-added: rgb(26 127 75 / 0.5);
  --diffine-image-removed: rgb(194 51 63 / 0.5);
  --diffine-image-outline: rgb(20 28 40 / 0.85);
  --diffine-image-marker: rgb(14 127 252 / 0.95);
  --diffine-image-halo: rgb(255 255 255 / 0.6);
}
```

색은 모두 투명도를 품고 있습니다. 설명하려는 이미지 위에 얹히기 때문입니다. 캔버스에는 스타일을 입힐 수 없어서 이 값들은 엘리먼트에서 읽어 픽셀에 직접 칠합니다. Diffine에서 커스텀 속성을 읽어 가는 곳은 여기뿐이고, 팔레트가 바뀌면 표시를 다시 칠하는 이유도 이것입니다.

:::

::: fw flutter

이 가운데 인자는 하나도 없습니다. 색은 테마의 `image` 아래에 있습니다.

```dart
ImageDiff(
  before: DiffineEncodedImage(saved),
  after: DiffineEncodedImage(rendered),
  theme: DiffineTheme.light.copyWith(
    image: const DiffineImageColours(
      changed: Color(0x8ce83e8c),
      added: Color(0x801a7f4b),
      removed: Color(0x80c2333f),
      outline: Color(0xd9141c28),
      marker: Color(0xf20e7ffc),
      halo: Color(0x99ffffff),
      ground: Color(0xffeaeef4),
      chequer: Color(0xffdbe1ea),
    ),
  ),
);
```

모두 투명도를 품고 있습니다. 설명하려는 이미지 위에 얹히기 때문입니다. 표시는 스타일이 아니라 픽셀로 칠하므로, 팔레트가 바뀌면 다시 칠합니다.

:::

## 나머지 부분을 어떻게 할지

`marks`와 `outlines`는 달라진 픽셀을 어떻게 할지 정하고, `unchanged`는 달라지지 않은 픽셀을 어떻게 할지 정합니다. 서로 다른 질문이라 네 가지 보기 모두에 함께 걸립니다.

`keep`이 기본값이고 아무것도 하지 않습니다. 두 이미지를 그대로 그리고 그 위에 변경을 칠합니다.

`dim`은 나머지를 흐리게 그리고 달라진 부분은 원래대로 그립니다. 눈이 가는 곳은 변경이 되고, 흐린 나머지는 그 변경이 이미지의 어디였는지를 말해 줍니다. 마스크만 보는 것으로는 알 수 없는 부분입니다.

<Fw react="`marks={false}`" flutter="`marks: false`" />와 함께 씁니다. 달라진 부분을 이미 원래 모습으로 보여 주고 있으면, 같은 픽셀을 분홍으로 덮는 것은 답 위에 답을 겹치는 일입니다.

<DiffinePictures sample="retouched" unchanged="dim" :marks="false" height="22rem" />

`hide`는 달라진 부분만 평평한 바탕 위에 그립니다. 변경을 표시가 아니라 그림으로 읽는 보기입니다. 저 사각형 안에 왼쪽에는 무엇이 있었고 오른쪽에는 무엇이 있는지만 남습니다.

<DiffinePictures sample="retouched" unchanged="hide" :marks="false" height="22rem" />

::: fw react

```tsx
<ImageDiff before={saved} after={rendered} unchanged="dim" marks={false} />
```

:::

::: fw flutter

```dart
ImageDiff(
  before: DiffineEncodedImage(saved),
  after: DiffineEncodedImage(rendered),
  unchanged: DiffineImageUnchanged.dim,
  marks: false,
);
```

:::

## 이미지가 셋 이상일 때

두 장이 늘 질문인 것은 아닙니다. 같은 화면을 기기 셋에서 그린 것, 같은 자산을 네 가지로 내보낸 것, 저장본과 최근 다섯 번의 실행. 이럴 때 필요한 것은 모든 불일치가 한 프레임에 올라온 화면인데, 창 두 개에는 세 번째가 들어갈 자리가 없습니다.

`pictures`는 쌍이 아니라 목록이고, 이것을 넘기는 것이 목록 모드를 켜는 방법입니다. 그러면 `before`와 `after`는 무시됩니다.

::: fw react

```tsx
<ImageDiff pictures={[saved, chrome, firefox]} />
```

:::

::: fw flutter

```dart
ImageDiff(
  pictures: <DiffineImageContent>[saved, chrome, firefox],
  pictureLabels: <String>['saved', 'chrome', 'firefox'],
);
```

:::

각 이미지는 자기 창을 가지고, 그 창에는 **그 이미지가** 기준과 다른 자리만 표시됩니다. 기준 이미지의 창에는 누구든 다른 자리가 모두 표시됩니다. 기준은 자기 자신과 다를 수 없고, 아무것도 표시되지 않은 창은 아무도 안 본 창처럼 보이기 때문입니다.

<DiffinePictures sample="retouched" several height="22rem" />

위의 첫 번째가 기준이고, 나머지 둘은 같은 사진에 사각형을 서로 다른 자리에 복제해 붙인 것입니다. 첫 번째 창에는 두 표시가 다 있고, 나머지 창에는 각자의 것만 있습니다.

`baseline`은 나머지를 무엇에 견줄지 정하며 기본값은 첫 번째입니다. 특별히 정할 기준이 없다면 질문은 "이것들이 어디서 갈리는가"이고, 그 답은 누구를 기준으로 삼든 같습니다. 모두가 같은 픽셀은 어느 창에도 표시되지 않습니다.

`overlay`와 `wipe`는 두 장에 대한 질문입니다. 이 둘 중 어느 쪽이 아래인가, 하나가 어디서 끝나고 다른 하나가 어디서 시작하는가. 셋 이상인 목록에는 답이 없어서 `split`으로 돌아갑니다. `mask`는 모든 불일치를 한 바탕에 그리므로 장수와 무관하게 동작합니다.

최대 여덟 장입니다. 비교가 담을 수 있는 수이고, 아래 [`diffImages`](#여러-장을-한-번에-비교하기)를 보세요.

## 움직이기

두 창은 하나의 뷰포트를 함께 씁니다. 맞출 것이 애초에 없습니다. 끌든 굴리든 버튼을 누르든 두 장이 같이 움직입니다.

- 창 안 아무 데나 끌면 이동합니다.
- 휠을 굴리면 포인터를 기준으로 한 칸씩 확대·축소합니다. Shift를 누른 채 굴리면 대신 이미지가 움직입니다.
- 막대의 버튼은 가운데를 기준으로 확대하고, 마지막 버튼은 전체를 창에 맞춥니다.
- 키보드에서는 화살표로 옮기고 `+`와 `−`로 확대하며, Shift를 누르면 화살표가 더 크게 움직입니다.

이 가운데 한 번 더 생각해 볼 것은 `wheel`입니다. 기본값 `zoom`은 이미지 뷰어가 하는 동작이고, 비교 화면이 곧 페이지인 경우에 맞습니다. 대신 포인터가 창 위에 있는 동안에는 페이지가 스크롤되지 않습니다. 글 중간에 놓인 비교라면 반대쪽이 맞습니다. 지나가며 스크롤하는 사람은 그대로 지나갈 수 있어야 하니까요.

::: fw react

```tsx
<ImageDiff before={saved} after={rendered} wheel="pan" />
```

:::

::: fw flutter

```dart
ImageDiff(
  before: DiffineEncodedImage(saved),
  after: DiffineEncodedImage(rendered),
  wheel: DiffineImageWheel.pan,
);
```

:::

`pan`은 창보다 큰 이미지를 움직이고, 전체가 다 보이면 페이지를 스크롤하게 두며, Ctrl이나 Cmd를 누른 채 굴리면 확대합니다.

원래 크기보다 크게 볼 때는 부드럽게 펴지 않고 픽셀을 그대로 그립니다. 400%까지 확대한 화면에서는 픽셀 하나하나가 봐야 할 대상이고, 보간은 그것을 뭉개기 때문입니다.

## 픽셀 자체를 볼 때

400%로 키운 두 창은 "이 두 픽셀이 다르다"까지만 말하고 멈춥니다. 그다음에 묻게 되는 것은 그 둘이 정확히 무엇이냐입니다. 같은 회색이 한 단계 어두워진 것인지, 아예 다른 색인지. `loupe`가 그 답입니다. 포인터를 어느 창에든 올리면 그 주변 픽셀이 확대되어 양쪽이 나란히 그려지고, 가운데 픽셀의 색과 프레임 위 좌표가 함께 적힙니다.

포인터가 어느 창에 있든 양쪽을 다 보여 줍니다. 나란히 보기에서는 창마다 이미지가 하나씩이고, 이 배율에서 묻는 질문은 한쪽에 대한 것이 아니기 때문입니다. 손가락이 아니라 포인터를 따라가므로 터치 화면에서는 나타나지 않습니다.

패널은 놓인 자리에 머뭅니다. 처음에는 읽고 있는 창의 반대쪽 가장자리에 붙고, 창이 하나뿐이면 왼쪽에 붙습니다. 포인터를 피해 모서리에서 모서리로 옮겨 다니는 패널은 결국 읽는 사람이 이미지 대신 쳐다보게 되는 물건이기 때문입니다. 막대의 손잡이를 끌면 비교 영역 안 아무 데로나 옮길 수 있고, 모서리를 끌면 한 번에 더 넓은 범위를 봅니다. 타일 크기는 그대로 두고 개수를 늘리며, 한 변에 최대 마흔한 개까지 갑니다.

기본으로 켜져 있습니다. <Fw react="`loupe={false}`" flutter="`loupe: false`" />로 끕니다.

`navigation`은 변경 사이를 오가는 버튼을 그립니다. 하나로 옮기면 그 자리로 화면을 옮기고 볼 수 있을 만큼 당깁니다. 이미 적당한 크기로 보이고 있다면 맞춰 둔 배율은 그대로 둡니다.

<Fw react="`viewport`와 `defaultViewport`도 문서와 같은 방식이고 `'fit'`이나 `{ scale, x, y }`를 받습니다. 읽는 사람이 옮긴 자리는 `onViewportChange`로 알려 줍니다." flutter="`viewport`는 `DiffineImageViewport`를 받고, 전체를 창에 맞추려면 `null`로 둡니다. 읽는 사람이 옮긴 자리는 `onViewportChanged`로 알려 줍니다." /> `x`와 `y`는 창 한가운데가 보고 있는 프레임 위의 점입니다. 확대할 때 제자리에 남는 것이 모서리가 아니라 가운데이기 때문입니다.

## 어떻게 비교하는지

`diff`는 엔진이 읽는 옵션을 받고, 빠뜨린 값은 기본값을 씁니다.

### tolerance

두 픽셀이 얼마나 달라야 차이로 셀지, 0에서 1 사이로 정합니다. 기본값은 `0.05`입니다.

::: fw flutter

```dart
ImageDiff(
  before: DiffineEncodedImage(saved),
  after: DiffineEncodedImage(rendered),
  diff: const DiffImageOptions(tolerance: 0.02, align: DiffImageAlign.shift),
);
```

:::

0은 완전히 같아야 한다는 뜻이고, 그걸 원하는 경우는 드뭅니다. 같은 인코더로 두 번 저장한 사진도 파일이 완전히 같지는 않습니다. 아래는 사진 한 장과 그것을 형편없이 다시 인코딩한 것을 0으로 비교한 결과입니다. 바뀐 것은 없는데 3분의 1이 차이로 잡힙니다.

<DiffinePictures sample="saved" :tolerance="0" height="22rem" />

기본값 `0.05`로 같은 쌍을 비교하면 조용해집니다. 인코더가 그러데이션에서 포기한 자리 몇십 곳만 남습니다. 결과가 지저분하면 값을 올리고, 놓치는 것 같으면 내리면 됩니다.

### ignoreAntialiasing

경계를 부드럽게 그린 탓에만 달라진 픽셀을 뺄지 정합니다. 기본으로 켜져 있습니다.

글자와 사선은 선이 실제로 지나는 자리 양옆 픽셀에 색을 나눠 담아 그립니다. 얼마씩 담을지는 렌더러가 알아서 계산하므로, 같은 화면을 브라우저 둘이 그리면 글자마다 값이 다르면서 보이는 것은 같습니다.

**같은 경계**가 두 이미지 모두에 지나고, 변화의 크기가 두 단차 중 약한 쪽을 넘지 않을 때 보정으로 봅니다. 경계란 한 픽셀 안쪽에 평평한 자리가 있는 밝기 단차입니다. 똑같은 색 픽셀이 둘 이상 붙어 있는 곳이 있어야 하고, 그 픽셀이 둘 중 적어도 한쪽에서는 자기 색이 아니라 주변의 섞임이어야 합니다. 흰 바탕 한가운데서 검게 바뀐 픽셀은 애초에 어떤 경계 위에도 있지 않습니다.

두 이미지 모두, 그리고 약한 쪽. 이것이 두 번 그려진 경계와 새로 생긴 경계를 가릅니다. 사진의 평평한 부분에 조각을 붙이면 그 조각이 경계를 함께 가져오는데, 반대쪽 이미지에는 거기에 맞설 경계가 없습니다. 강한 쪽을 택하면 그 경계가 자기 자신의 등장을 변명하게 됩니다. 이 문서 맨 위 사진에 복제해 붙인 조각의 경계선 절반이 예전에는 "변하지 않은 픽셀"로 잡혔습니다.

평평한 자리 조건이 사진을 정직하게 만듭니다. 빗방울 맺힌 창이나 뜨개 담요는 거의 모든 픽셀이 주변 값 사이에 놓이고 질감의 밝기 폭은 거의 전체 범위라, 그 조건이 없으면 허용치가 실제 변경까지 삼킬 만큼 넓어집니다.

공짜는 아닙니다. 달라진 픽셀마다 주변 픽셀을 다시 읽습니다.

### align

비교하기 전에 두 이미지 사이의 어긋남을 먼저 찾을지 정합니다. <Fw react="기본은 `'none'`이고 `'shift'`로 찾습니다." flutter="기본은 `DiffImageAlign.none`이고 `.shift`로 찾습니다." />

아래 쌍은 사진의 한 부분과, 같은 부분을 1픽셀 옆에서 잘라낸 것입니다. 바뀐 것은 없고 모든 경계가 달라졌습니다. 스위치를 켜면 어긋난 만큼을 먼저 찾고, 남는 것은 한쪽이 더 이상 닿지 않는 테두리 한 줄입니다.

<DiffinePictures sample="moved" :smoothing="false" controls height="22rem" />

`alignRadius`는 그 탐색이 얼마나 멀리까지 가는지이고 기본은 `16`픽셀입니다. 넓힐수록 시간이 들고, 어느 선을 넘으면 결과를 믿기 어려워집니다. 한 이미지를 다른 이미지 위로 충분히 미끄러뜨리면 언젠가는 우연히 맞아떨어지는 자리가 나오기 때문입니다.

### blockSize와 maxRegions

`blockSize`는 달라진 픽셀을 묶는 격자가 얼마나 성긴지를 픽셀로 정하고, `maxRegions`는 그렇게 묶인 덩어리를 몇 개까지 돌려줄지 정합니다. 격자가 촘촘하면 한 변경이 여럿으로 쪼개지고, 성기면 상관없는 변경이 한 덩어리가 됩니다. `maxRegions`를 넘으면 큰 것부터 남기고 나머지는 마스크에만 남으며, 결과가 목록이 전부는 아니라고 알려 줍니다.

## 큰 이미지

`maxPixels`는 이미지를 몇 픽셀까지 해석할지 정하고 기본값은 400만입니다.

요즘 카메라 사진 한 장이 2400만 픽셀입니다. 두 장을 이미지와 버퍼로 들고 있으면 비교를 시작하기도 전에 1기가바이트에 가까워집니다. 한도를 넘으면 이미지를 작게 해석합니다. 크게 확대했을 때 조금 무른 대신 <Fw react="페이지" flutter="앱" />가 멈추지 않습니다. 이미지가 화면의 본론이면 올리고, 마흔 장을 늘어놓는 화면이라면 내리면 됩니다.

비교 자체는 수백만 번의 연산이라, 그 일을 화면을 그리는 스레드에서 빼고 싶다면 다른 곳에서 계산해 결과만 넘기면 됩니다.

::: fw react

```tsx
const result = await compareInAWorker(before, after);

<ImageDiff before={before} after={after} result={result} />;
```

:::

::: fw flutter

```dart
final DiffImageResult result = await Isolate.run(() => diffImage(before, after));

ImageDiff(
  before: DiffinePixelImage(before),
  after: DiffinePixelImage(after),
  result: result,
);
```

:::

이미지는 그래도 필요합니다. 결과에는 픽셀마다 무슨 일이 있었는지가 들어 있을 뿐, 픽셀 자체는 없습니다.

## 엔진만 쓰기

`diffImage`가 엔진이고, <Fw react="React도 DOM도" flutter="위젯이" /> 들어 있지 않습니다.

::: fw react

```ts
import { diffImage } from 'diffine-react/image';

const result = diffImage(before, after, { align: 'shift' });

console.log(`${result.regions.length}곳, ${Math.round(result.stats.ratio * 100)}%`);
```

:::

::: fw flutter

```dart
final DiffImageResult result = diffImage(
  before,
  after,
  const DiffImageOptions(align: DiffImageAlign.shift),
);

debugPrint('${result.regions.length}곳, ${(result.stats.ratio * 100).round()}%');
```

:::

양쪽 모두 <Fw react="`ImageData`이거나 같은 모양이면 됩니다. `{ data, width, height }`에" flutter="`DiffPixels`입니다. `data`, `width`, `height`에" /> 픽셀당 4바이트, 왼쪽 위부터 한 줄씩입니다. 돌아오는 것은 두 이미지를 비교한 프레임, 그 안에서 각자가 놓인 자리, 픽셀마다 한 바이트씩의 결과, 사각형으로 묶인 변경, 그리고 집계입니다. 파일을 여는 일은 여기 없습니다. 해석은 디코더의 몫입니다.

전체는 [API 문서](../api/#diffimage)에 있습니다.

## 여러 장을 한 번에 비교하기

`diffImages`가 `pictures` 뒤에서 도는 엔진이고, `diffImage`와 같은 약속을 지킵니다.

::: fw react

```ts
import { diffImages, imagesSimilarity } from 'diffine-react/image';

const result = diffImages([saved, chrome, firefox]);
const { similarity, each } = imagesSimilarity([saved, chrome, firefox]);
```

:::

::: fw flutter

```dart
final DiffImagesResult result = diffImages(<DiffPixels>[saved, chrome, firefox]);
final DiffImagesSimilarity alike = imagesSimilarity(<DiffPixels>[saved, chrome, firefox]);
```

:::

모든 쌍을 `diffImage`가 비교하듯 그대로 비교하므로 옵션의 뜻도 쌍에서와 같습니다. 두 장짜리 목록은 같은 답을 다른 모양으로 돌려줍니다.

그 모양이 마스크입니다. 종류가 아니라 이미지당 비트 하나입니다. `i`번째 비트는 `i`번째 이미지가 기준과 다른 자리에 켜지므로, `mask[pixel] != 0`은 "여기서 뭔가 갈리는가"이고 `mask[pixel] & (1 << i)`는 "이 이미지가 갈리는가"입니다. 각 창에 모두의 표시가 아니라 자기 표시만 그릴 수 있는 이유가 이것입니다. `added`와 `removed`는 여기 들어갈 자리가 없습니다. 어떤 픽셀이 누구의 등장인지는 어느 이미지를 두고 묻느냐에 달렸고, 목록에 대한 답은 "갈린다"뿐입니다.

`stats`는 쌍에서와 같은 방식으로 프레임을 세고, `apart`가 각 이미지가 기준과 다른 픽셀 수를 말합니다. `imagesSimilarity`는 그것을 비율로 바꿉니다. 전체에 대한 숫자 하나와, 어느 것이 유별난지 짚어 주는 `each`입니다. 숫자 하나만으로는 유별난 것이 있다는 사실까지만 알 수 있습니다.

`paintDiffImages`는 마스크를 이미지로 내보냅니다. 전부를 한 장에 그리거나, 하나씩 따로 그립니다. 네 장이면 네 파일이고, 각각이 어디서 유별난지를 그림으로 말합니다.

바이트 하나는 비트 여덟 개이므로 한 번에 비교할 수 있는 것은 여덟 장까지입니다. <Fw react="`MOST_PICTURES`" flutter="`kMostPictures`" />가 그 수이고, 각 이미지가 기준과 이루는 쌍은 여전히 제한이 없는 `diffImage`입니다.

## 두 이미지가 얼마나 닮았는지

`diffImage`는 "어디가 달라졌는지"에 답합니다. 두 이미지를 들여다보는 사람이 묻는 질문이 그것입니다. 기준선을 둔 빌드, 스크린샷 백 장을 줄 세우는 보고서, 화면 한쪽의 배지는 더 짧은 질문을 합니다. `imageSimilarity`가 그 짧은 질문입니다.

::: fw react

```ts
import { imageSimilarity } from 'diffine-react/image';

const { similarity, changed, distance } = imageSimilarity(before, after);

if (similarity < 0.995) {
  throw new Error(`${changed} pixels moved — ${(similarity * 100).toFixed(2)}% alike`);
}
```

:::

::: fw flutter

```dart
final DiffImageSimilarity alike = imageSimilarity(before, after);

if (alike.similarity < 0.995) {
  throw StateError('${alike.changed} pixels moved — '
      '${(alike.similarity * 100).toStringAsFixed(2)}% alike');
}
```

:::

`similarity`는 두 이미지 가운데 하나라도 덮는 픽셀을 기준으로 한 비율입니다. 한쪽만 덮는 픽셀은 깎이는 쪽으로 세므로 크기가 다른 두 이미지는 1이 될 수 없습니다. 옆에는 그 비율이 나온 `matched`, `changed`, `added`, `removed`와 각 이미지의 크기가 함께 옵니다. 크기가 다르면 비율만으로는 말이 부족하기 때문입니다.

`distance`가 나머지 절반입니다. `similarity`는 달라진 픽셀을 세고 `distance`는 얼마나 달라졌는지를 재며, 척도는 `tolerance`와 같습니다. 나쁜 인코더로 다시 저장한 사진은 거의 모든 픽셀이 다르면서 어느 픽셀도 멀지 않고, 패널 하나를 덮어 그린 스크린샷은 그 반대입니다. 한 숫자로는 둘 다 말할 수 없습니다.

안에서 비교 전체가 돌아가므로 옵션의 뜻은 위와 같고, 이미 결과를 들고 있다면 다시 돌릴 필요가 없습니다. `1 - result.stats.ratio`가 같은 값입니다.

여기서도 인자는 픽셀입니다. 파일을 픽셀로 바꾸는 일은 <Fw react="`createImageBitmap`과 캔버스" flutter="`decodeImageFromList`와 `toByteData`" />가 하며, `diffImage`와 마찬가지로 애플리케이션의 몫입니다.

::: fw react

```ts
async function pixelsOf(file: Blob): Promise<ImageData> {
  const bitmap = await createImageBitmap(file);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const context = canvas.getContext('2d');

  context.drawImage(bitmap, 0, 0);

  return context.getImageData(0, 0, bitmap.width, bitmap.height);
}

const alike = imageSimilarity(await pixelsOf(saved), await pixelsOf(rendered));
```

:::

::: fw flutter

```dart
Future<DiffPixels> pixelsOf(Uint8List file) async {
  final ui.Image image = await decodeImageFromList(file);
  final ByteData? bytes = await image.toByteData(format: ui.ImageByteFormat.rawRgba);

  return DiffPixels(
    data: bytes!.buffer.asUint8List(),
    width: image.width,
    height: image.height,
  );
}

final DiffImageSimilarity alike = imageSimilarity(
  await pixelsOf(saved),
  await pixelsOf(rendered),
);
```

:::

## 나머지

`header`, `navigation`, `zoom`, `summary`는 각각 창 위의 이름, 변경 사이를 오가는 버튼, 확대 버튼, 그리고 이미지 크기와 달라진 비율이 적힌 아래 막대를 끕니다.

`colorScheme`, `locale`, `strings`, <Fw react="커스텀 속성" flutter="`theme`" />은 [`TextDiff`](./text-diff)와 똑같이 동작합니다.
