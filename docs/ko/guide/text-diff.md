---
title: 텍스트 비교
order: 2
---

# 텍스트 비교

`TextDiff`는 두 문서와 그 사이에 일어난 일을 그립니다. 화면 요소가 전부 기본값을 가진 <Fw react="prop" flutter="인자" />이라, 연결선까지 갖춘 좌우 비교부터 좁은 패널에 줄만 나열한 화면까지 같은 <Fw react="컴포넌트" flutter="위젯" />으로 만듭니다.

이 문서는 두 패키지에 대해 같은 이야기를 합니다. 어느 쪽을 보여 줄지는 사이드바 메뉴 위의 전환기가 정합니다.

::: fw react

아래 예제 위의 스위치를 켜고 꺼 보세요. 그림이 아니라 컴포넌트가 실제로 도는 화면입니다.

:::

::: fw flutter

아래 예제는 실제 Flutter 빌드를 프레임에 넣은 것입니다. 그림이 아니라 웹으로 컴파일한 위젯이 실제로 도는 화면입니다.

:::

<DiffineDemo sample="code" controls height="22rem" flutter="text/basic" />

## 두 가지 모드

`mode`는 두 문서를 읽기만 할지 고쳐 쓸 수도 있게 할지 정합니다. 그 밖에는 두 모드가 같습니다. 비교도 줄도, 깔리는 색과 짚어 주는 단어도, 창 사이의 띠도 위쪽 버튼도 아래쪽 찾기 막대도 모두 같습니다.

::: fw react

```tsx
import { TextDiff } from 'diffine-react/text-diff';
import 'diffine-react/styles.css';

<TextDiff before={saved} after={draft} />;
<TextDiff mode="editor" defaultBefore={saved} defaultAfter={draft} />;
```

:::

::: fw flutter

```dart
import 'package:diffine/diffine.dart';

TextDiff(before: saved, after: draft);
TextDiff(mode: DiffineMode.editor, defaultBefore: saved, defaultAfter: draft);
```

:::

기본값은 <Fw react="`viewer`" flutter="`DiffineMode.viewer`" />입니다. <Fw react="`editor`" flutter="`DiffineMode.editor`" />는 창마다 입력란을 한 겹 덮어서, 글자를 칠 때마다 비교를 다시 계산합니다. 아래에서 양쪽 아무 데나 쳐 보세요. 어디에도 저장되지 않습니다.

<DiffineDemo mode="editor" sample="code" height="22rem" flutter="text/editor" />

`view`, `alignLines`, `result` 세 가지는 에디터에서 무시됩니다. 각각의 이유는 아래 해당 절에 있습니다.

### 화면 구조

에디터에서 한 창은 문서를 두 겹으로 그립니다. 아래층은 눈에 보이는 줄입니다. 바뀐 줄에는 색이 깔리고 움직인 단어에는 표시가 붙습니다. 위층은 <Fw react="`<textarea>`" flutter="`EditableText`" code />이고, 글자는 투명하지만 커서는 보입니다.

입력란은 자기 안의 단어에 색을 입히지 못합니다. 반대로 색을 입힐 수 있는 요소는 되돌리기 기록도, 입력기도, 선택 영역도, 스크린 리더가 이미 읽을 줄 아는 컨트롤도 아닙니다. 그래서 입력란은 입력란으로 두고 보이는 것은 전부 그 뒤에 그립니다.

::: fw react

대신 두 겹이 글자 하나하나의 위치까지 맞아야 합니다. 같은 글꼴, 줄마다 같은 높이, 여백 열 다음 같은 자리에서 시작하는 글자입니다. 이 값들은 재지 않고 스타일시트에 적어 두었습니다. 그래서 크기가 어떻든 유지되고, 창 크기가 바뀔 때 한 프레임 늦게 따라가지 않습니다. `--diffine-font`나 `--diffine-line-height`를 바꾸면 두 겹이 함께 움직입니다.

:::

::: fw flutter

대신 두 겹이 글자 하나하나의 위치까지 맞아야 합니다. 같은 글꼴, 줄마다 같은 높이, 여백 열 다음 같은 자리에서 시작하는 글자입니다. 아래층을 위젯이 아니라 그림으로 그리는 이유가 이것입니다. 입력란과 같은 `TextStyle`을 같은 폭에서 배치하니 두 겹이 같은 자리에서 꺾일 수밖에 없습니다. 테마의 `fontFamily`나 `lineHeight`를 바꾸면 두 겹이 함께 움직입니다.

:::

뒤에 그린 줄은 스크린 리더에 노출하지 않습니다. 앞의 입력란이 같은 문서이고, 그쪽이 훑고 고칠 수 있는 쪽이기 때문입니다. 대신 읽히는 것은 창 아래의 집계와, 변경 사이를 옮길 때 지금 몇 번째인지입니다.

## 두 문서 전달하기

`before`와 `after`가 두 문서입니다. 문자열만 주거나, 이름을 붙여서 줍니다.

::: fw react

```tsx
<TextDiff before={{ content: saved, label: 'v1.2' }} after={{ content: draft, label: '작업본' }} />
```

뷰어는 렌더할 때마다 prop에서 문서를 다시 읽습니다. `before={data?.text}`를 받은 뷰어는 데이터가 도착하는 순간 그것을 그립니다.

에디터는 제어 컴포넌트와 비제어 컴포넌트 양쪽을 지원합니다. `defaultBefore`와 `defaultAfter`를 주면 컴포넌트가 문서 상태를 관리합니다.

```tsx
<TextDiff mode="editor" defaultBefore={saved} defaultAfter={draft} />
```

`before`와 `after`를 주면 애플리케이션이 관리합니다. 입력란은 받은 것을 보여 주고 입력된 내용을 알려 줄 뿐, 새 텍스트를 돌려주는 쪽은 애플리케이션입니다.

```tsx
const [draft, setDraft] = useState(saved);

<TextDiff mode="editor" before={saved} after={draft} onAfterChange={setDraft} readOnly="before" />;
```

`onBeforeChange`와 `onAfterChange`는 어느 쪽이든 호출됩니다. 관리하지 않는 문서도 지켜볼 수 있다는 뜻이고, 저장 버튼을 켜거나 사본을 따로 두는 데 쓰면 됩니다.

:::

::: fw flutter

```dart
TextDiff(
  before: saved,
  beforeLabel: 'v1.2',
  after: draft,
  afterLabel: '작업본',
);
```

뷰어는 빌드할 때마다 인자에서 문서를 다시 읽습니다. `before: data?.text ?? ''`를 받은 뷰어는 데이터가 도착하는 순간 그것을 그립니다.

에디터는 문서를 직접 들고 있거나 애플리케이션에 맡깁니다. `defaultBefore`와 `defaultAfter`를 주면 위젯이 들고 있습니다.

```dart
TextDiff(mode: DiffineMode.editor, defaultBefore: saved, defaultAfter: draft);
```

`before`와 `after`를 주면 애플리케이션이 관리합니다. 입력란은 받은 것을 보여 주고 입력된 내용을 알려 줄 뿐, 새 텍스트를 돌려주는 쪽은 애플리케이션입니다.

```dart
TextDiff(
  mode: DiffineMode.editor,
  before: saved,
  after: draft,
  onAfterChanged: (String value) => setState(() => draft = value),
  readOnly: DiffineSide.before,
);
```

`onBeforeChanged`와 `onAfterChanged`는 어느 쪽이든 호출됩니다. 관리하지 않는 문서도 지켜볼 수 있다는 뜻이고, 저장 버튼을 켜거나 사본을 따로 두는 데 쓰면 됩니다.

:::

어느 쪽인지는 첫 <Fw react="렌더" flutter="빌드" />에서 정해지고 그 뒤로 바뀌지 않습니다. 나중에 도착한 `before`는 쓰고 있던 문서를 도중에 교체하게 되고, 그때 이미 친 내용을 어떻게 해야 할지 정할 방법이 없기 때문입니다. 같은 자리에서 뷰어를 에디터로 바꾸려면 <Fw react="`key`를 준 새 엘리먼트" flutter="`Key`를 준 새 위젯" />로 두세요.

### 고칠 수 없는 쪽

`readOnly`는 고칠 수 없는 쪽을 받습니다. 흔한 경우는 왼쪽이 저장된 판본이고 오른쪽이 지금 쓰는 판본인 배치입니다.

::: fw react

```tsx
<TextDiff mode="editor" before={saved} defaultAfter={saved} readOnly="before" />
```

`true`를 주면 양쪽 모두입니다.

:::

::: fw flutter

```dart
TextDiff(
  mode: DiffineMode.editor,
  before: saved,
  defaultAfter: saved,
  readOnly: DiffineSide.before,
);
```

:::

<DiffineDemo mode="editor" sample="prose" readOnly="before" height="18rem" flutter="text/editor" />

고칠 수 없는 입력란도 스크롤하고, 선택하고, 복사할 수 있습니다. 막은 것은 쓰기뿐입니다.

### 비교 결과 지켜보기

`onDiff`는 비교를 다시 계산할 때마다 [`DiffResult`](./diff) 전체를 넘겨줍니다. 제목 옆의 건수라든가, 두 문서가 다를 때만 누를 만한 버튼에 쓰면 됩니다.

::: fw react

```tsx
<TextDiff
  mode="editor"
  defaultBefore={saved}
  defaultAfter={draft}
  onDiff={(result) => setChanges(result.changes.length)}
/>
```

:::

::: fw flutter

```dart
TextDiff(
  mode: DiffineMode.editor,
  defaultBefore: saved,
  defaultAfter: draft,
  onDiff: (DiffResult result) => setState(() => changes = result.changes.length),
);
```

:::

## 좌우 비교와 한 줄로 보기

`view`가 두 문서를 나란히 놓을지 위아래로 놓을지 정합니다.

`split`에서는 짝이 맞는 줄끼리 높이를 맞추고, 짝이 없는 줄 맞은편에는 빈 칸이 들어갑니다. `unified`에서는 변경 하나를 "빠진 줄들 다음에 들어온 줄들"로 쓰고 양쪽 줄 번호를 함께 보여 줍니다. 패치 파일과 같은 모양입니다.

::: fw react

```tsx
<TextDiff before={saved} after={draft} view="unified" />
```

:::

::: fw flutter

```dart
TextDiff(before: saved, after: draft, view: DiffineView.unified);
```

:::

<DiffineDemo sample="code" view="unified" height="20rem" flutter="text/unified" />

비교를 두 번 하는 것이 아니라 같은 비교를 다르게 그리는 것입니다. 줄 안에서 짚어 주는 단어도 엔진이 이미 찾아 둔 그것입니다.

에디터는 무엇을 받든 좌우 비교입니다. 한 열에 두 문서의 줄이 섞이면, 경계에 새 줄을 넣었을 때 그 줄이 어느 문서의 것인지 판단할 수 없습니다.

## 줄 번호와 표시 기호

`lineNumbers`는 각 줄에 자기 번호를 붙입니다. `markers`는 바뀐 줄 옆에 `+`, `−`, `~`를 붙입니다.

::: fw react

긴 줄을 가로로 스크롤해도 이 두 열은 왼쪽에 붙어 있습니다.

:::

::: fw flutter

긴 줄을 가로로 스크롤하면 이 두 열도 함께 밀립니다. 두 패키지의 겉모습이 다른 유일한 지점이고, `wrap`을 켜면 해결됩니다.

:::

표시 기호는 켜 두는 편이 좋습니다. 빨강과 초록을 구분하지 못하는 사람에게 색 대신 무슨 일이 있었는지 알려 주기 때문입니다.

::: fw react

```tsx
<TextDiff before={saved} after={draft} lineNumbers={false} markers={false} />
```

:::

::: fw flutter

```dart
TextDiff(before: saved, after: draft, lineNumbers: false, markers: false);
```

:::

<DiffineDemo sample="code" :lineNumbers="false" :markers="false" height="18rem" flutter="text/plain" />

둘 다 꺼도 스크린 리더가 읽는 내용은 그대로입니다. 바뀐 줄에는 무슨 일이 있었는지가 단어로 붙어 있습니다. 화면에는 안 보이고 복사에도 딸려오지 않는 자리에 들어가며, 이것은 끌 수 없습니다.

## 줄 바꿈

`wrap`은 창보다 긴 줄을 어떻게 할지 정합니다. 끄면 오른쪽으로 흘러나가고 창이 가로로 스크롤되며, 켜면 줄을 바꿉니다.

줄 바꿈은 이 컴포넌트에서 무언가를 실제로 재야 하는 유일한 경우입니다. 세 번 접힌 줄은 세 줄 높이인데 맞은편은 한 줄이면 거기서부터 두 문서가 어긋나기 때문입니다. 그래서 화면을 다시 그리거나 크기가 바뀔 때마다 짝을 재서 낮은 쪽에 높은 쪽의 높이를 줍니다.

::: fw react

```tsx
<TextDiff before={saved} after={draft} wrap />
```

:::

::: fw flutter

```dart
TextDiff(before: saved, after: draft, wrap: true);
```

:::

<DiffineDemo sample="prose" wrap height="18rem" flutter="text/wrap" />

에디터에서는 입력란과 그 뒤의 줄이 같은 자리에서 꺾여야 하고, 그러려면 폭이 같아야 합니다. 두 겹 모두 같은 텍스트 엔진이 같은 폭에서 배치하므로, 한쪽에서 꺾이면 다른 쪽에서도 꺾입니다.

<DiffineDemo mode="editor" sample="prose" wrap height="18rem" flutter="text/editor-wrap" />

## 양쪽 높이 맞추기

`alignLines`는 기본으로 켜져 있고, 짝이 없는 줄 맞은편에 빈 칸을 넣습니다. 두 문서가 아래까지 계속 나란히 갑니다.

끄면 각 창이 자기 줄만 자기 문서 끝까지 그립니다. 높이는 더 이상 맞지 않고, 어느 쪽이 어느 쪽에 대응하는지는 가운데 열이 보여 줍니다.

<DiffineDemo sample="code" :alignLines="false" height="18rem" flutter="text/unaligned" />

에디터는 높이를 맞추지 않고, 이것은 끌 수 없습니다. 입력란 속 빈 칸은 커서를 놓을 수 있는 줄이고, 커서를 놓을 수 있는 줄은 사용자의 문서에 속하기 때문입니다. 그래서 양쪽이 각자의 길이대로 흐릅니다. 뷰어에서 `alignLines={false}`를 준 것과 같은 결과입니다.

## 두 창 사이의 열

`connectors`는 변경 하나하나를 "빠져나간 자리에서 도착한 자리까지"의 띠로 그립니다. 높이를 맞춰 두면 띠가 반듯하게 놓입니다. 맞추지 않으면 띠가 휘고, 그 줄들이 어디로 갔는지 알려 주는 유일한 표시가 됩니다. 모든 에디터가 여기에 해당합니다.

줄이 빠져나가기만 한 띠는 삭제 색으로, 들어오기만 한 띠는 추가 색으로 그립니다. 고쳐 쓴 자리의 띠는 열을 가로지르며 한 색에서 다른 색으로 넘어갑니다. 고쳐 쓴다는 것이 한쪽에서 빠져나가 다른 쪽으로 들어가는 일이기 때문입니다.

좌표는 화면을 그릴 때 한 번 재서 들고 있습니다. 스크롤할 때는 이미 잰 모양을 옮길 뿐, 매 프레임 다시 재지 않습니다.

`syncScroll`은 두 창이 두 문서의 같은 부분을 보게 합니다. 줄 높이가 맞으면 스크롤 위치를 그대로 공유하고, 맞지 않으면 비율로 따라갑니다. 길이가 다른 두 문서에 같은 좌표를 쓰면 한쪽은 끝인데 다른 쪽은 중간이 되기 때문입니다.

## 변경 사이 이동

창 위 막대의 버튼 두 개가 변경을 하나씩 짚어 나가고, 그 사이의 숫자가 지금 몇 번째인지 알려 줍니다. 마지막 변경 다음은 처음으로 돌아갑니다. 화면은 `4 / 4`에서 `1 / 4`로 바뀌므로 한 바퀴 돌았다는 것을 알 수 있습니다.

도착한 변경은 왼쪽 가장자리에 선으로 표시되고, 두 창 사이의 띠는 선이 굵어집니다. 스크롤이 멈춘 뒤에도, 이어서 글자를 친 뒤에도 어디에 있었는지가 보입니다.

<DiffineDemo sample="code" height="18rem" flutter="text/basic" />

어느 변경인지를 애플리케이션이 관리해도 됩니다.

::: fw react

```tsx
const [index, setIndex] = useState(-1);

<TextDiff
  before={saved}
  after={draft}
  selected={index}
  onSelectedChange={(next, change) => setIndex(next)}
/>;
```

:::

::: fw flutter

```dart
TextDiff(
  before: saved,
  after: draft,
  selected: index,
  onSelectedChanged: (int next, DiffChange? change) => setState(() => index = next),
);
```

:::

`selected`를 바꾸면 버튼을 눌렀을 때와 똑같이 화면이 그리로 이동합니다. 비교 화면 옆에 변경 목록을 따로 두고 거기서 조종해도 됩니다. `-1`은 아무것도 선택하지 않은 상태입니다. <Fw react="`onSelectedChange`" flutter="`onSelectedChanged`" />는 누가 관리하든 호출되므로, 값을 넘기지 않고 지켜보기만 할 수도 있습니다.

`navigation`으로 버튼을 끕니다. 버튼이 놓이는 막대는 `header`가 꺼져 있어도 그려지므로, 이름 없이 버튼만 둘 수 있습니다.

## 변경을 반대편에 적용하기

저장된 판본과 초안을 비교할 때 묻는 것은 대개 하나입니다. 이대로 둘 것인가, 아니면 예전 것을 되돌릴 것인가. `applyChanges`를 켜면 변경마다 두 창 사이 열에 화살표 한 쌍이 생깁니다. 왼쪽을 가리키는 쪽은 오른쪽 판본을 왼쪽에 쓰고, 오른쪽을 가리키는 쪽은 그 반대입니다.

::: fw react

```tsx
<TextDiff
  mode="editor"
  before={saved}
  after={draft}
  readOnly="before"
  applyChanges
  onAfterChange={setDraft}
/>
```

:::

::: fw flutter

```dart
TextDiff(
  mode: DiffineMode.editor,
  before: saved,
  after: draft,
  readOnly: DiffineSide.before,
  applyChanges: true,
  onAfterChanged: (String value) => setState(() => draft = value),
);
```

:::

`readOnly`인 쪽에는 쓰지 않습니다. 그래서 위처럼 왼쪽에 저장본, 오른쪽에 초안을 두면 화살표는 하나만 남습니다.

쓰기는 입력란을 거칩니다. 그래서 <Fw react="`onBeforeChange`나 `onAfterChange`" flutter="`onBeforeChanged`나 `onAfterChanged`" />도 타이핑과 똑같이 알려 줍니다.

변경을 적용한다는 것은 문서를 쓴다는 뜻이라 에디터의 기능입니다. 버튼은 두 창 사이 열에 놓이므로 <Fw react="`connectors={false}`" flutter="`connectors: false`" />로 그 열을 없애면 버튼도 함께 사라집니다.

## 찾기와 바꾸기

창마다 찾기가 따로 있습니다. 창 위 막대의 버튼이 그 창 아래에 찾기 막대를 열고, **Ctrl+F**(맥에서는 **Cmd+F**)는 키보드가 놓인 창의 막대를 엽니다.

컴포넌트마다가 아니라 창마다인 것은 비교가 문서 두 개를 다루기 때문입니다. 왼쪽 버전에서 찾는 이름과 오른쪽 버전에서 찾는 이름은 대개 다릅니다. 양쪽은 질의도 개수도 막대도 각자여서, 한쪽을 닫아도 다른 쪽은 그대로 남습니다.

입력하는 동안 찾은 자리가 바로 표시되고, 창은 지금 보고 있는 자리로 이동합니다. **Enter**는 다음, **Shift+Enter**는 이전으로 가고, 변경 사이를 오가는 버튼과 마찬가지로 끝에서 처음으로 돌아갑니다. **Escape**는 막대를 닫고 초점을 창으로 돌려놓습니다.

입력란 안의 스위치 세 개가 질의를 어떻게 읽을지 정합니다. `Aa`는 `Title`과 `title`을 구분하고, `ab`는 단어 단위로만 맞추고, `.*`는 찾을 글자 대신 정규식으로 읽습니다. 쓰다 만 정규식은 오류가 아닙니다. 결과가 없다고만 표시하고, 식을 마치는 순간 결과가 나옵니다.

에디터에서는 **Ctrl+H**가 바꾸기 줄까지 함께 엽니다. 커서는 찾기를 따라갑니다. 이동한 자리가 곧 입력란의 선택 영역이라서, **Escape**로 막대를 닫으면 커서는 방금 보던 자리에 남고 거기서 이어 칠 수 있습니다.

**바꾸기**는 지금 보고 있는 자리를 덮어쓰고 그다음 자리로 옮겨 갑니다. 계속 누르면 문서를 따라 내려갑니다. **모두 바꾸기**는 찾은 자리를 한 번에 덮어씁니다. 바꿀 내용은 적은 글자 그대로 들어가서, `$1`은 달러 기호와 숫자 1입니다. 브라우저의 편집 명령으로 넣기 때문에 `Ctrl`/`Cmd`+`Z`가 직접 친 글자와 함께 되돌립니다.

`readOnly`인 쪽에는 바꾸기 줄 없이 찾기만 놓입니다. `search={false}`는 막대와 단축키를 함께 끕니다.

## Tab 키

`indentWithTab`은 Tab이 탭 문자를 넣을지 다음 컨트롤로 넘어갈지 정합니다. 기본값은 **꺼짐**입니다. 키보드로 빠져나올 수 없는 컨트롤은 페이지 전체를 막아 버리고, 에디터가 페이지에 혼자 있는 경우는 드뭅니다.

켜면 빠져나오는 방법이 두 가지입니다. **Shift+Tab**은 언제나 이전 컨트롤로 가고, **Escape**는 다음 Tab을 브라우저에 넘깁니다. 이 사실을 화면 어딘가에 적어 두면 갇히는 일은 없습니다.

::: fw react

```tsx
<TextDiff mode="editor" defaultBefore={saved} defaultAfter={draft} indentWithTab />
```

:::

::: fw flutter

```dart
TextDiff(
  mode: DiffineMode.editor,
  defaultBefore: saved,
  defaultAfter: draft,
  indentWithTab: true,
);
```

:::

탭 문자도 입력란의 되돌리기 기록에 남습니다. 이 <Fw react="컴포넌트" flutter="위젯" />는 되돌리기 기록을 따로 두지 않습니다. 입력란의 기록을 그대로 쓰는 것이 되돌리기에 관해 하는 일의 전부입니다.

## 얼마나 자세히 비교할지

`diff`는 `diffText`가 받는 것과 같은 옵션 객체입니다. 고쳐진 두 줄 안에서 단어로 볼지, 글자로 볼지, 아예 보지 않을지는 `inline`이 정합니다.

::: fw react

```tsx
<TextDiff before={saved} after={draft} diff={{ inline: 'character' }} />
```

:::

::: fw flutter

```dart
TextDiff(
  before: saved,
  after: draft,
  diff: const DiffOptions(inline: DiffInlineMode.character),
);
```

:::

에디터에서는 입력이 멈추기를 기다리지 않고 글자를 칠 때마다 비교를 다시 돌립니다. 비용은 두 문서의 크기에 그 사이 편집 횟수를 곱한 것인데, 글자 하나로는 편집 횟수가 거의 늘지 않기 때문입니다. 반대쪽 경우를 막는 것은 `maxCost`입니다. [비교 결과](./diff)를 보세요.

## 바뀌지 않은 부분 접기

파일의 두 판본은 대부분 아무도 손대지 않은 부분입니다. `collapse`를 켜면 그대로인 줄의 구간마다 몇 줄인지 적힌 띠 하나가 대신 그려지고, 변경 앞뒤로는 `context`만큼 남습니다. 그래야 각 변경이 파일 속 한 자리로 읽힙니다.

::: fw react

```tsx
<TextDiff before={saved} after={draft} collapse context={3} />
```

:::

::: fw flutter

```dart
TextDiff(before: saved, after: draft, collapse: true, context: 3);
```

:::

띠를 누르면 그 줄들이 돌아오고, 비교가 바뀌기 전까지 그대로 남습니다. 앞뒤 세 줄은 `diff`와 `git`이 쓰는 값입니다. 문서의 맨 위와 맨 아래에는 감쌀 변경이 없으므로 아무것도 남기지 않습니다.

두 창이 같은 구간을 접으므로 좌우 비교의 높이는 어긋나지 않습니다. 띠 하나의 높이는 정확히 한 줄이고, 그래서 화면에 보이는 줄만 그리는 창과 함께 쓸 수 있습니다.

찾기는 그려진 부분이 아니라 문서 전체를 훑습니다. 그래서 찾기 막대를 열면 접힌 구간이 도로 펼쳐지고, 막대를 닫으면 다시 접힙니다.

숨긴 것이 아니라 애초에 없는 줄 자리에도 띠가 놓입니다. [패치](diff#패치)에서 한 헝크와 다음 헝크 사이가 그렇습니다. 이 띠는 `collapse`와 무관하게 그려지고, 누를 수 없습니다. 대신할 줄을 아무도 보내지 않았기 때문입니다.

## 줄 끝과 공백

줄 끝 문자는 무엇이든 줄을 끝냅니다. 그래서 윈도우에서 쓰고 맥에서 고친 파일이 전 줄이 바뀐 파일로 보이지 않습니다. 대신 치르는 값은, 눈에 보이지 않는 차이밖에 없는 파일이 아무 차이도 없는 것처럼 보인다는 점입니다. 같은 내용을 다른 편집기로 저장한 경우가 그렇습니다.

그래서 이 정보는 비교와 나란히 따로 구합니다. `result.format`은 각 문서가 줄을 무엇으로 끝내는지, 마지막 줄에 줄 끝 문자가 있는지, 문서가 바이트 순서 표시로 시작하는지를 담습니다. 두 문서가 다르면 창 아래 막대에 적힙니다.

::: fw react

```ts
diffText('a\nb\n', 'a\r\nb').format;
// {
//   before: { ending: 'lf',   finalNewline: true,  byteOrderMark: false },
//   after:  { ending: 'crlf', finalNewline: false, byteOrderMark: false }
// }
```

:::

::: fw flutter

```dart
diffText('a\nb\n', 'a\r\nb').format;
// before: ending lf,   finalNewline true,  byteOrderMark false
// after:  ending crlf, finalNewline false, byteOrderMark false
```

:::

`ending`은 <Fw react="`lf`, `crlf`, `cr`" flutter="`DiffLineEnding.lf`, `.crlf`, `.cr`" />이고, 여러 종류가 섞여 있으면 <Fw react="`mixed`" flutter="`.mixed`" />, 줄 끝 문자가 하나도 없으면 <Fw react="`none`" flutter="`.none`" />입니다. [패치](diff#패치)에서 읽어 온 비교 결과에는 `format`이 없습니다. 패치는 두 파일을 본 적이 없기 때문입니다.

`showInvisibles`는 줄 안의 공백을 그립니다. 공백은 자기 칸 한가운데의 점으로, 탭은 그 길이만큼의 밑줄로 나옵니다.

::: fw react

```tsx
<TextDiff before={saved} after={draft} showInvisibles />
```

글자 자체는 건드리지 않습니다. 표시는 글자를 감싼 요소에 그려지므로, 복사하면 원래 쓰인 그대로 나옵니다. 색은 `--diffine-invisible`입니다.

:::

::: fw flutter

```dart
TextDiff(before: saved, after: draft, showInvisibles: true);
```

글자 자체는 건드리지 않습니다. 표시는 같은 배치가 알려 준 상자를 따라 글자 뒤에 그리므로 접힌 줄도 따라가고, 복사하면 원래 쓰인 그대로 나옵니다. 색은 `DiffineTheme.invisible`입니다.

:::

## 긴 문서

2만 줄짜리 비교는 2만 개 행인데 화면에 보이는 건 마흔 줄입니다. 나머지는 높이로만 남겨 둡니다.

화면에서 달라지는 것은 없습니다. 스크롤 막대는 문서 전체 길이만큼이고, 가로 스크롤 폭은 가장 긴 줄에 맞고, 두 창 사이의 띠도 제자리에 있습니다. 그리지 않은 행에서 좌표를 읽는 대신 행 높이 표에서 구하기 때문입니다.

<DiffineDemo sample="code" :lines="3000" height="18rem" flutter="text/collapse" />

::: fw react

`virtualize`는 기본으로 켜져 있고, 그 일을 하는 것이 이것입니다. 에디터에서 문서 전체는 어느 쪽이든 입력란이 들고 있습니다. 여기서 줄이는 것은 그 뒤에 요소로 그려지는 줄입니다.

위 예제는 3천 줄짜리입니다. 스크롤하거나 버튼을 눌러 보고, 개발자 도구에서 행이 몇 개나 있는지 세어 보세요.

`wrap`을 켜면 행 높이가 제각각이라 위치를 계산이 아니라 측정으로 구합니다. 이미 그려 본 행의 높이는 기억해 두고, 나머지는 그 평균 높이에 세워 둡니다. 그리고 측정값이 추측을 대신할 때 창 위쪽 끝에 있던 행이 움직인 만큼 스크롤을 따라 옮깁니다. 그래서 접힌 문서도 잘라서 그리고, 읽고 있던 자리는 그대로 있습니다.

이 기능을 끄는 경우는 둘입니다. 하나는 `renderWidget`입니다. 애플리케이션이 줄 아래에 그린 것은 여기서 알 길이 없는 이유로 언제든 커질 수 있고, 그런 행을 대신 세워 두면 엉뚱한 자리에 서게 됩니다. 다른 하나는 줄 바꿈을 켠 에디터입니다. 줄은 문서 전체를 들고 있는 입력란 뒤에 그려지고 둘이 같은 자리에서 접혀야 하는데, 그리지 않은 행을 대신 세워 둔 높이는 뒤의 글자와 비슷할 수는 있어도 같지는 않습니다. 짧은 문서도 그냥 둡니다. 아껴지는 행보다 계산 비용이 더 크기 때문입니다.

브라우저 자체의 찾기 기능이 스크롤 밖의 글자까지 닿아야 하는 페이지라면 `virtualize={false}`로 끄세요. 그리지 않은 것은 찾을 수 없습니다. 창에 들어 있는 찾기가 같은 문제의 다른 해법이고 보통은 이쪽이 낫습니다. 페이지가 아니라 문서를 읽으므로 9000번째 줄에 있는 글자도 찾아서 그 자리로 스크롤합니다.

:::

::: fw flutter

켤 것이 없습니다. 창이 리스트라서 보이는 행만 만들어지고, 그래서 `virtualize` 인자도 없습니다. 끌 것이 남아 있지 않기 때문입니다. 에디터에서도 문서 전체는 입력란이 들고 있고 뒤의 줄은 위젯이 아니라 그림이라, 화면에 보이는 줄만 배치됩니다.

`wrap`을 켜면 행 높이가 제각각입니다. 행마다 양쪽을 재서 높은 쪽 높이를 주므로 두 창이 서로를 재지 않고도 같은 높이가 되고, 두 리스트 모두 각 행의 높이를 추측이 아니라 값으로 받습니다.

창에 들어 있는 찾기는 화면이 아니라 문서를 읽습니다. 9000번째 줄에 있는 글자도 찾아서 그 자리로 스크롤합니다.

:::

## 복사와 내보내기

창에서 복사하면 화면이 아니라 문서가 나옵니다. 옆의 줄 번호와 기호는 선택에서 빠지고, 양쪽 높이를 맞추려고 넣은 빈 칸도 빠집니다. 그러지 않으면 반대쪽이 더 긴 자리마다 빈 줄이 섞여 나옵니다.

반대 방향으로는 `formatPatch`가 비교 결과를 유니파이드 패치로 씁니다. [비교 결과](diff#패치) 문서를 보세요. 빌드나 리뷰 도구, CI 실행에 첨부하는 파일이 읽는 형식입니다.

::: fw react

```ts
import { formatPatch } from 'diffine-react/patch';

const patch = formatPatch(result, { before: 'a/src/index.ts', after: 'b/src/index.ts' });
```

이미지 쪽은 `paintDiffImage`가 마스크를 그림 한 장으로 바꿉니다. 바뀐 부분만 남고 나머지는 투명합니다.

```ts
import { diffImage, paintDiffImage } from 'diffine-react/image';

const picture = paintDiffImage(diffImage(before, after));
const canvas = new OffscreenCanvas(picture.width, picture.height);

canvas.getContext('2d')?.putImageData(new ImageData(picture.data, picture.width), 0, 0);

const png = await canvas.convertToBlob();
```

:::

::: fw flutter

```dart
final String patch = formatPatch(
  result,
  const DiffPatchOptions(before: 'a/lib/main.dart', after: 'b/lib/main.dart'),
);
```

이미지 쪽은 `paintDiffImage`가 마스크를 그림 한 장으로 바꿉니다. 바뀐 부분만 남고 나머지는 투명합니다.

```dart
final DiffPixels picture = paintDiffImage(diffImage(before, after));

ui.decodeImageFromPixels(
  picture.data,
  picture.width,
  picture.height,
  ui.PixelFormat.rgba8888,
  (ui.Image image) async {
    final ByteData? png = await image.toByteData(format: ui.ImageByteFormat.png);
  },
);
```

:::

파일로 쓰는 일은 애플리케이션의 몫입니다. 파일을 읽는 일이 그러한 것과 같은 이유입니다. 화면과 아이솔레이트와 서버가 각각 자기 방식이 있고, 그중 무엇도 비교 엔진이 참견할 일이 아닙니다. `changed`, `added`, `removed`, `unchanged`에 색을 넘기면 원하는 대로 칠할 수 있습니다.

## 바깥 틀

`header`는 각 문서의 이름을 위에 쓰고, `summary`는 아래쪽 상태 표시줄을 그립니다. 둘 다 기본으로 켜져 있고, 컴포넌트가 페이지의 작은 일부일 때는 둘 다 끄면 됩니다.

이 표시줄은 헤더와 같은 격자 위에 놓입니다. 왼쪽 절반이 왼쪽 창 아래, 오른쪽 절반이 오른쪽 창 아래에 오므로, 어느 쪽 것인지 적지 않아도 각 문서의 크기를 쓸 수 있습니다. 여기에는 글자 수와 바이트 수가 들어가고, 맨 오른쪽에는 `~`, `+`, `−` 뒤에 수를 붙인 집계가 옵니다. 줄 옆의 여백에 붙는 것과 같은 세 기호입니다. 스크린 리더에는 기호 대신 문장을 읽어 주고, 실시간으로 읽히는 것은 그 문장뿐입니다. 크기는 에디터에서 한 글자 칠 때마다 바뀌므로, 그것까지 읽어 주면 쓸 수 없게 됩니다.

::: fw react

```tsx
<TextDiff before={saved} after={draft} header={false} summary={false} />
```

:::

::: fw flutter

```dart
TextDiff(before: saved, after: draft, header: false, summary: false);
```

:::

<DiffineDemo sample="prose" :header="false" :summary="false" height="14rem" flutter="text/bare" />

두 문서가 같으면 집계 자리에 0을 늘어놓는 대신 체크 표시 하나만 남습니다.

## 색과 언어

`colorScheme`의 기본값은 <Fw react="`system`" flutter="`DiffineColorScheme.system`" />이고, <Fw react="읽는 사람의 설정" flutter="감싸고 있는 화면의 밝기" />을 따릅니다. 애플리케이션이 이미 정해 두었다면 <Fw react="`light`나 `dark`" flutter="`.light`나 `.dark`" />를 주세요.

`locale`은 문서의 언어가 아니라 <Fw react="컴포넌트" flutter="위젯" /> 자신이 쓰는 말의 언어입니다. 헤더, 집계, 찾기 막대, 스크린 리더가 읽는 문구가 여기에 해당합니다. 영어와 한국어가 들어 있고, 기본값은 <Fw react="`en`" flutter="`DiffineLocale.en`" />입니다.

`strings`는 그중 아무 낱말이나 바꿉니다. 목록에 없는 언어도 이렇게 넣습니다.

::: fw react

```tsx
<TextDiff
  before={saved}
  after={draft}
  strings={{ before: 'Vorher', after: 'Nachher', identical: 'Beide sind gleich.' }}
/>
```

:::

::: fw flutter

```dart
TextDiff(
  before: saved,
  after: draft,
  strings: baseStringsFor(DiffineLocale.en).copyWith(
    before: 'Vorher',
    after: 'Nachher',
    identical: 'Beide sind gleich.',
  ),
);
```

각 언어의 낱말은 `baseStringsFor`에서 나옵니다. 그래서 세 개만 바꿀 때 마흔네 개를 다 적지 않고 `copyWith`로 끝납니다.

:::

## 글자에 색 입히기

`language`에 두 문서가 어떤 언어인지 적으면 그 언어로 색을 입힙니다.

::: fw react

```tsx
<TextDiff before={saved} after={draft} language="typescript" />
```

:::

::: fw flutter

```dart
TextDiff(before: saved, after: draft, language: 'dart');
```

:::

highlight.js 식별자를 넣거나, 코드가 아닌 문서라면 `plain`을 넣습니다. <Fw react="`DIFFINE_LANGUAGES`" flutter="`kDiffineLanguages`" code />가 언어 전부와 그 옆에 쓸 이름을 담은 목록이고, 창 위쪽 줄의 오른쪽 끝에 그 이름이 나옵니다. <Fw react="이것을 그리는 값이 `languageLabel`이고, 요청하지 않으면 꺼져 있습니다. 이름과 메뉴는 import가 아니라 켤 때 내려받으므로, 끄고 쓰는 페이지는 둘 다 받지 않습니다." flutter="`languageLabel`로 끌 수 있습니다." />

에디터에서는 같은 자리가 목록을 여는 메뉴가 됩니다. 두 모드가 서로 다른 컨트롤을 그리는 유일한 지점입니다. 뷰어는 애플리케이션에서 문서를 받으니 그게 무엇인지 알고 있지만, 에디터가 받는 것은 누군가 붙여 넣은 문서이기 때문입니다.

::: fw react

```tsx
<TextDiff mode="editor" defaultBefore={saved} defaultAfter={draft} defaultLanguage="python" />
```

:::

::: fw flutter

```dart
TextDiff(
  mode: DiffineMode.editor,
  defaultBefore: saved,
  defaultAfter: draft,
  defaultLanguage: 'python',
);
```

:::

`language`, `defaultLanguage`, <Fw react="`onLanguageChange`" flutter="`onLanguageChanged`" />도 문서와 같은 방식입니다. `language`를 주면 애플리케이션이 관리하고, `defaultLanguage`를 주면 <Fw react="컴포넌트" flutter="위젯" />가 관리합니다.

::: fw react

`plain`이 아닌 언어를 요청하기 전에는 아무것도 내려받지 않습니다. 라이브러리도 문법도 `import()` 뒤에 있어서, 전부 `plain`인 페이지는 하나도 내려받지 않고 파이썬을 요청한 페이지는 파이썬만 내려받습니다. 문법이 도착한 다음 프레임에 색이 입혀지고, 그 전까지는 문서 그대로 나옵니다.

긴 문서에 문법을 돌리는 것이 에디터에서 한 글자를 칠 때 드는 비용의 대부분입니다. 5천 줄 기준으로 비교가 0.7밀리초일 때 색을 입히는 데는 48밀리초가 듭니다. 그래서 색은 뒤로 미룹니다. 방금 친 글자는 직전에 만들어 둔 색으로 그리고, 새 색은 다음 키가 눌리면 중단할 수 있는 단계에서 도착합니다.

색은 `--diffine-code-keyword`, `--diffine-code-string`처럼 커스텀 속성 여덟 개로 정합니다. highlight.js가 내놓는 클래스가 전부 이 여덟 개 중 하나로 이어집니다. 팔레트를 따로 쓰는 애플리케이션은 이 여덟 개만 덮어쓰면 됩니다.

:::

::: fw flutter

문법은 내려받지 않고 패키지에 들어 있습니다. 앱 번들에는 미뤄 둘 네트워크가 없기 때문이고, 같은 이유로 이 문법들은 **근사치**입니다. 언어 서른네 개를 정확히 파싱하는 파서를 비교 뷰어 옆에 둘 수는 없습니다. 중괄호가 들어간 템플릿 리터럴이나 나눗셈처럼 읽히는 정규식은 조금씩 틀리게 나옵니다.

대신 문서를 바꾸지는 않습니다. 각 구간은 받은 글자에서 잘라 낸 것이고 길이의 합이 다시 그 줄이 되므로, 여기서 틀린다는 것은 색이 어긋난다는 뜻이지 줄이 다른 말을 한다는 뜻이 아닙니다. 40만 자가 넘는 문서는 그냥 그립니다. 누군가 붙여 넣은 압축된 번들에는 그편이 충분한 그림입니다.

색은 `DiffineTheme.code`의 필드 여덟 개, `keyword`, `string`, `comment`, `number`, `title`, `type`, `variable`, `meta`로 정합니다. 문법이 내놓는 토큰이 전부 이 여덟 개 중 하나로 이어집니다.

:::

강조기를 이미 갖고 있다면 `highlight`가 그 통로입니다. 줄 하나를 통째로 받아서 다르게 그리고 싶은 구간을 돌려주고, `language`에 더해지는 것이 아니라 `language`를 대신합니다.

::: fw react

```tsx
<TextDiff
  before={saved}
  after={draft}
  highlight={(line) =>
    tokenize(line.text).map((token) => ({
      length: token.content.length,
      className: `token ${token.type}`
    }))
  }
/>
```

:::

::: fw flutter

```dart
TextDiff(
  before: saved,
  after: draft,
  highlight: (DiffLine line, DiffineSide side) => tokenize(line.text)
      .map((Token token) => DiffineToken(length: token.length, style: token.style))
      .toList(),
);
```

:::

<DiffineDemo sample="code" colour height="18rem" flutter="text/basic" />

조각이 아니라 줄 전체를 넘기는 데는 이유가 있습니다. 문법은 문자열 리터럴의 절반에 적용해서는 제대로 나오지 않는데, 비교가 만들어 내는 게 정확히 그 절반이기 때문입니다. 그래서 애플리케이션은 줄을 받고, <Fw react="컴포넌트" flutter="위젯" />가 양쪽 경계를 모두 반영해 자릅니다. 문자열의 절반인 바뀐 단어는 문자열의 절반인 바뀐 단어로 그려집니다.

`length`는 <Fw react="`String.prototype.slice`" flutter="`String.substring`" code />와 같은 단위로 셉니다. 토크나이저가 이미 돌려주는 값을 그대로 쓰면 됩니다. 구간은 순서대로 읽고 사이에 빈 곳은 그냥 그리므로, 키워드만 표시하는 강조기라면 키워드와 그 사이의 빈 구간만 돌려주면 됩니다. 할 말이 없는 줄에는 `null`을 돌려주세요.

<Fw react="클래스 대신 색을 돌려주는 강조기를 위해 `className` 옆에 `style`도 있습니다." flutter="구간이 무엇인지만 이름 붙이고 색은 테마에 맡기고 싶다면 `style` 옆에 `kind`도 있습니다." />

이 함수는 그리는 줄마다 호출됩니다. 문서 전체가 아니라 화면에 보이는 줄에 대해서만 호출됩니다.

에디터에는 제약이 하나 붙습니다. 구간은 글자의 **모양**은 바꿔도 **너비**는 바꾸면 안 됩니다. 색, 굵기, 기울임, 배경은 괜찮습니다. 기본으로 딸려 오는 고정폭 글꼴에서는 굵은 키워드가 보통 키워드와 같은 자리를 차지합니다. 글자 크기나 다른 글꼴, 자간은 안 됩니다. 그 안에 있어야 할 커서에서 글자가 밀려납니다.

## 줄에 직접 그려 넣기

비교 결과는 무엇이 바뀌었는지만 압니다. 리뷰를 이루는 나머지, 그러니까 댓글과 스레드, 커버리지 막대, 린트 경고, 그것을 다는 버튼은 애플리케이션의 것입니다. 그 자리가 이 두 prop입니다.

`renderGutter`는 줄 옆 여백에 열을 하나 더합니다. `renderWidget`은 줄 아래에 상자를 놓습니다. 둘 다 줄과 그 줄이 있는 쪽을 받고, 아무것도 놓지 않을 줄에는 `null`을 돌려주면 됩니다. 대개는 그쪽이 대부분입니다.

::: fw react

```tsx
<TextDiff
  before={saved}
  after={draft}
  renderGutter={(line, side) => (side === 'after' ? <AddComment line={line.index} /> : null)}
  renderWidget={(line, side) =>
    side === 'after' && threads[line.index] ? <Thread of={threads[line.index]} /> : null
  }
/>
```

:::

::: fw flutter

```dart
TextDiff(
  before: saved,
  after: draft,
  renderGutter: (DiffLine line, DiffineSide side) =>
      side == DiffineSide.after ? AddComment(line: line.index) : null,
  renderWidget: (DiffLine line, DiffineSide side) =>
      side == DiffineSide.after && threads[line.index] != null
      ? Thread(of: threads[line.index]!)
      : null,
);
```

:::

여백의 이 열은 한 줄에서 스크린 리더가 읽어야 할 유일한 부분입니다. 옆의 줄 번호와 기호는 색이 말하는 것을 한 번 더 말할 뿐이라 스크린 리더에서 감춰져 있습니다. 모든 줄에서 폭을 같게 유지하세요. 그러지 않으면 여백이 어긋납니다.

::: fw react

위젯의 높이는 내용에 따라 달라지고, 여기서 두 가지가 따라옵니다. 애플리케이션이 그린 것은 언제든 커질 수 있고 그런 행을 대신 세워 두면 엉뚱한 자리에 서게 되므로 `virtualize`가 스스로 꺼집니다. 그리고 좌우 비교에서는 맞은편 줄에 같은 높이를 줘서 양쪽을 맞춥니다. 그 측정은 함수가 바뀔 때마다 돌기 때문에, 비교가 길다면 메모이즈한 함수를 넘기는 편이 좋습니다.

:::

::: fw flutter

위젯의 높이는 내용에 따라 달라지므로, 맞은편 줄에 같은 높이를 줘서 양쪽을 맞춥니다. 위젯은 그려진 다음 자기 높이를 알려 주는데, 이것이 여기서 스스로 계산할 수 없는 유일한 값입니다.

:::

둘 다 <Fw react="`viewer`" flutter="`DiffineMode.viewer`" />의 것입니다. 에디터는 줄 위에 입력란을 덮어 두고 둘이 줄 단위로 맞아떨어져야 하는데, 폭을 모르는 열이나 높이를 모르는 상자가 끼면 커서가 엉뚱한 곳에 놓입니다.

<Fw react="꾸미는 자리는 `.diffine-slot`과 `.diffine-widget`입니다. 이 두 클래스에는 돌려준 내용 주위의 여백밖에 들어 있지 않습니다." flutter="돌려준 것을 그대로 그리고, 그 주위의 여백만 더합니다." />

## 스타일

::: fw react

색과 치수는 전부 `.diffine` 엘리먼트의 커스텀 속성입니다. 자기 팔레트가 있는 애플리케이션은 패키지의 규칙과 우선순위를 다투는 대신 속성만 덮어쓰면 됩니다.

```css
.diffine {
  --diffine-height: 40rem;
  --diffine-font-size: 0.875rem;
  --diffine-insert-line: #eaffea;
  --diffine-insert-piece: #a6f3a6;
  --diffine-delete-line: #ffecec;
  --diffine-delete-piece: #f8b9b9;
}
```

전체 목록은 [API](../api/theme#커스텀-속성)에 있습니다. 그중 하나는 에디터만 씁니다. `--diffine-selection`은 반투명해야 합니다. 선택 영역 아래의 글자는 입력란 뒤의 줄이 그리기 때문에, 불투명한 색을 깔면 골라 낸 글자가 있던 자리에 사각형만 남습니다.

컴포넌트가 자기 prop 말고 받은 것은 전부 엘리먼트로 그대로 넘어가므로 `id`, `className`, `style`, `aria-*`는 `<div>`에서와 똑같이 동작합니다.

글꼴을 CSS가 아니라 자기 상태로 관리하는 애플리케이션에는 `font`가 있습니다. 위와 같은 커스텀 속성 네 개를 대신 씁니다.

```tsx
<TextDiff
  before={saved}
  after={draft}
  font={{
    family: "'Iosevka', monospace",
    size: 15,
    lineHeight: '1.65rem',
    letterSpacing: '0.01em'
  }}
/>
```

빠뜨린 값은 스타일시트의 값을 그대로 씁니다. `{ size: 15 }`만 줘도 됩니다. 수는 픽셀이고 문자열은 CSS가 읽는 대로입니다.

:::

::: fw flutter

커스텀 속성을 선언할 캐스케이드가 없으므로 팔레트가 값으로 옵니다. 이름도 색도 같은 것이 객체 하나에 들어 있습니다.

```dart
TextDiff(
  before: saved,
  after: draft,
  theme: DiffineTheme.light.copyWith(
    height: 640,
    fontSize: 14,
    insertLine: const Color(0xffeaffea),
    insertPiece: const Color(0xffa6f3a6),
    deleteLine: const Color(0xffffecec),
    deletePiece: const Color(0xfff8b9b9),
  ),
);
```

전체 목록은 [API](../api/theme#팔레트)에 있습니다. 테마를 주면 `colorScheme`도 함께 정해집니다. 테마 자체가 어느 팔레트인지에 대한 결정이기 때문입니다. 그중 한 필드는 에디터만 씁니다. `selection`은 반투명해야 합니다. 선택 영역 아래의 글자는 입력란 뒤에 그려지므로, 불투명한 색을 깔면 골라 낸 글자가 있던 자리에 사각형만 남습니다.

색은 그대로 두고 글꼴만 바꾸는 애플리케이션에는 `font`가 있습니다.

```dart
TextDiff(
  before: saved,
  after: draft,
  font: const DiffineFont(
    family: 'Iosevka',
    size: 15,
    lineHeight: 26,
    letterSpacing: 0.1,
  ),
);
```

빠뜨린 값은 테마의 값을 그대로 씁니다. `DiffineFont(size: 15)`만 줘도 됩니다.

:::

넣을 값에 조건이 둘 있습니다. 글꼴은 고정폭이어야 합니다. 아니면 여백 열과 본문의 칸이 어긋납니다. 그리고 `lineHeight`는 배수가 아니라 길이여야 합니다. 줄에 글자가 있든 없든 행의 높이가 그만큼이고, 긴 비교에서 그리지 않는 줄도 정확히 그만큼의 높이로 대신하기 때문입니다.

## 미리 계산한 비교 결과

`result`는 문서 두 개 대신 이미 계산된 비교 결과를 받습니다. 워커나 서버에서 계산했거나, 목록 전체를 위해 한 번만 계산한 경우에 쓰세요.

::: fw react

```tsx
import { diffText } from 'diffine-react/diff';

const result = diffText(saved, draft);

<TextDiff result={result} />;
```

:::

::: fw flutter

```dart
final DiffResult result = diffText(saved, draft);

TextDiff(result: result);
```

:::

그 값이 무엇인지는 [비교 결과](./diff)에 있습니다. 에디터는 이 값을 무시합니다. 다른 데서 계산한 비교는 아직 아무도 손대지 않은 문서의 비교이기 때문입니다.

## 하지 않는 것

- **에디터에서 한 줄로 보기는 없습니다.** [좌우 비교와 한 줄로 보기](#좌우-비교와-한-줄로-보기)를 보세요.
- **문법을 이해하지는 않습니다.** `highlight`는 애플리케이션의 토크나이저가 찾은 것에 색을 입힐 뿐입니다. 이 패키지에는 언어를 파싱하는 코드가 없습니다.

[직접 써보기](./playground)에 같은 문서 한 쌍으로 두 모드를 다 올려 두었습니다. 이 페이지의 스위치가 그 위에 있습니다.
