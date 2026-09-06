---
title: 에디터
order: 3
---

# 에디터

`DiffineEditor`는 두 창을 고칠 수 있게 만든 뷰어입니다. 같은 비교 결과, 같은 줄, 창 사이를 잇는 같은 띠를 쓰고, 각 창 위에 입력란이 하나씩 올라갑니다. 그래서 글자를 칠 때마다 비교가 다시 계산됩니다.

아래에서 양쪽 모두 직접 고쳐 보세요. 어디에도 저장되지 않고, 이 페이지가 곧 예제입니다.

<DiffineDemo component="editor" sample="code" height="22rem" />

## 화면에 실제로 놓인 것

한 창은 문서를 두 번 그립니다. 한 번은 눈에 보이는 줄로 그립니다. 바뀐 줄에는 색이 깔리고 움직인 단어에는 표시가 붙습니다. 그 위에 `<textarea>`가 한 장 덮여 있고, 이 입력란의 글자는 보이지 않지만 커서는 보입니다.

여기서 에디터가 갖춰야 할 두 가지를 다 얻는 방법은 이것뿐입니다. `<textarea>`는 자기 안의 단어에 색을 입히지 못하고, 색을 입힐 수 있는 것들은 되돌리기 기록도, 입력기도, 선택 영역도, 화면 낭독기가 이미 읽을 줄 아는 컨트롤도 아닙니다. 그래서 입력란은 입력란으로 두고, 읽는 사람이 보는 것은 전부 그 뒤에 그립니다.

대신 두 겹이 글자 하나하나의 위치까지 맞아야 합니다. 같은 글꼴, 줄마다 같은 높이, 여백 열 다음 같은 자리에서 시작하는 글자입니다. 이 약속은 재는 대신 스타일시트에 적어 두었습니다. 그래서 크기가 어떻든 유지되고, 창 크기가 바뀔 때 한 프레임 늦게 따라가지 않습니다. `--diffine-font`나 `--diffine-line-height`를 바꾸면 두 겹이 함께 움직입니다.

뒤에 그린 줄은 화면 낭독기에 노출하지 않습니다. 앞의 입력란이 같은 문서이고, 그쪽이 훑고 고칠 수 있는 쪽이기 때문입니다. 대신 읽히는 것은 창 아래의 집계와, 변경 사이를 옮길 때 지금 몇 번째인지입니다.

## 두 문서를 누가 들고 있는지

늘 쓰는 한 쌍입니다. `defaultBefore`와 `defaultAfter`를 주면 에디터가 문서를 직접 들고 있습니다.

```tsx
import { DiffineEditor } from 'diffine-react';
import 'diffine-react/styles.css';

<DiffineEditor defaultBefore={saved} defaultAfter={draft} />;
```

`before`와 `after`를 주면 문서는 애플리케이션의 것이 됩니다. 입력란은 받은 것을 보여 주고 입력된 내용을 알려 줄 뿐, 새 텍스트를 되돌려 주는 쪽은 애플리케이션입니다.

```tsx
const [draft, setDraft] = useState(saved);

<DiffineEditor before={saved} after={draft} onAfterChange={setDraft} readOnly="before" />;
```

`onBeforeChange`와 `onAfterChange`는 어느 쪽이든 호출됩니다. 관리하지 않는 문서도 지켜볼 수 있다는 뜻이고, 저장 버튼을 켜거나 사본을 따로 두는 데 쓰면 됩니다.

둘 중 어느 쪽인지는 첫 렌더에서 정해지고 그 뒤로 바뀌지 않습니다. 나중에 도착한 `before`는 쓰고 있던 문서를 도중에 빼앗는 것이고, 읽는 사람이 이미 친 내용을 어떻게 해야 하는지에는 정직한 답이 없습니다.

### 고칠 수 없는 쪽

`readOnly`는 한쪽을 받거나 `true`로 양쪽 모두를 받습니다. 흔한 경우는 왼쪽이 저장된 판본이고 오른쪽이 지금 쓰는 판본인 배치입니다.

```tsx
<DiffineEditor before={saved} defaultAfter={saved} readOnly="before" />
```

<DiffineDemo component="editor" sample="prose" readOnly="before" height="18rem" />

고칠 수 없는 입력란도 스크롤하고, 선택하고, 복사할 수 있습니다. 막은 것은 쓰기이지 읽기가 아닙니다.

### 비교 결과 지켜보기

`onDiff`는 비교를 다시 계산할 때마다 [`DiffResult`](./diff) 전체를 넘겨줍니다. 제목 옆의 건수라든가, 두 문서가 다를 때만 누를 만한 버튼에 쓰면 됩니다.

```tsx
<DiffineEditor
  defaultBefore={saved}
  defaultAfter={draft}
  onDiff={(result) => setChanges(result.changes.length)}
/>
```

## 양쪽 높이는 맞추지 않습니다

뷰어가 하는 일 중 에디터가 못 하는 하나입니다. 뷰어는 짝이 없는 줄 맞은편에 빈 칸을 넣어 두 문서를 나란히 붙들어 둡니다. 그런데 입력란 속 빈 칸은 커서를 놓을 수 있는 줄이고, 커서를 놓을 수 있는 줄은 그 사람의 문서에 속합니다.

그래서 양쪽은 각자의 길이대로 흐르고, 한쪽의 어느 부분이 다른 쪽의 어느 부분에 대응하는지는 창 사이의 열이 말해 줍니다. 뷰어의 `alignLines={false}`와 같고, 여기서는 끌 수 없습니다.

`connectors`로 그 띠를 지울 수는 있습니다. `syncScroll`도 그대로 있어서 두 창이 문서의 같은 대목을 보게 해 줍니다. 다만 줄 번호가 아니라 위에서부터의 비율을 따릅니다. 같은 번호로 맞추면 한쪽은 끝, 다른 쪽은 중간에 서게 되기 때문입니다.

## 줄 번호, 표시 기호, 줄 바꿈

뷰어가 받는 세 가지 prop이 여기서도 같은 일을 합니다. `lineNumbers`는 줄마다 번호를 붙이고, `markers`는 바뀐 줄 옆에 `+`, `−`, `~`를 놓고, `wrap`은 창보다 긴 줄을 어떻게 할지 정합니다.

```tsx
<DiffineEditor defaultBefore={saved} defaultAfter={draft} wrap />
```

<DiffineDemo component="editor" sample="prose" wrap height="18rem" />

줄 바꿈을 켜면 입력란과 그 뒤의 줄이 같은 자리에서 꺾여야 하고, 그러려면 폭이 같아야 합니다. 그래서 평소 가장 긴 줄 끝에 남겨 두는 여유가 이때는 없고, 아주 긴 줄도 픽셀 단위로 맞춥니다. 두 겹 모두 브라우저가 알아서 꺾는 것이라, 한쪽에서 꺾이면 다른 쪽에서도 꺾입니다.

## 변경 사이 이동

창 위쪽 막대의 버튼은 뷰어에서와 똑같이 변경을 하나씩 짚어 가고, 도착한 변경으로 양쪽 입력란을 스크롤합니다. `selected`와 `onSelectedChange`로 그 자리를 애플리케이션이 들고 있을 수 있습니다.

도착한 변경은 왼쪽 가장자리에 표시가 남고 띠는 강조색으로 그려집니다. 스크롤이 멈춘 뒤에도, 이어서 글자를 친 뒤에도 어디에 있었는지가 보입니다.

## Tab, 그리고 빠져나오기

`indentWithTab`은 Tab이 탭 문자를 넣을지 다음 컨트롤로 넘어갈지 정합니다. 기본값은 **꺼짐**입니다. 키보드로 빠져나올 수 없는 컨트롤은 곧 키보드로 빠져나올 수 없는 페이지이고, 에디터가 페이지에 혼자 있는 경우는 드뭅니다.

켜면 나가는 길이 두 개 있고 둘 다 사람이 먼저 시도할 법한 것입니다. **Shift+Tab**은 언제나 이전 컨트롤로 가고, **Escape**는 다음 Tab을 브라우저에 넘깁니다. 이 사실을 읽는 사람이 볼 자리에 적어 두면 갇히는 일은 없습니다.

```tsx
<DiffineEditor defaultBefore={saved} defaultAfter={draft} indentWithTab />
```

탭 문자는 브라우저 자신의 편집 명령으로 넣기 때문에 `Ctrl`/`Cmd`+`Z`가 나머지와 함께 되돌립니다. 이 컴포넌트는 되돌리기 기록을 따로 두지 않습니다. 입력란의 기록이 진짜이고, 그것을 빼앗지 않는 것이 되돌리기에 관해 하는 일의 거의 전부입니다.

## 얼마나 자세히 비교할지

`diff`는 뷰어와 `diffText`가 받는 것과 같은 옵션 객체입니다. 고쳐진 두 줄 안에서 단어로 볼지, 글자로 볼지, 아예 보지 않을지는 `inline`이 정합니다.

```tsx
<DiffineEditor defaultBefore={saved} defaultAfter={draft} diff={{ inline: 'character' }} />
```

비교는 잠시 기다렸다가가 아니라 글자를 칠 때마다 다시 돌립니다. 이미 한 번 비교한 문서에 가한 수정은 작은 수정이고, 작은 수정은 엔진에 싼 쪽입니다. 비용은 두 문서의 크기에 그 사이 편집 횟수를 곱한 것인데, 글자 하나로는 편집 횟수가 거의 늘지 않습니다. 반대쪽 경우를 막는 것은 `maxCost`입니다. [비교 결과](./diff)를 보세요.

## 글자에 색 입히기

`language`를 주면 두 문서를 그 언어로 칠하고, 에디터는 언어 목록을 위쪽 줄 오른쪽 끝에 메뉴로 그립니다. 두 컴포넌트가 여기서 갈리는 지점입니다. 뷰어는 애플리케이션에서 문서를 받으니 그게 무엇인지 알고 있지만, 에디터가 받는 것은 누군가 붙여 넣은 문서입니다.

```tsx
<DiffineEditor defaultBefore={saved} defaultAfter={draft} defaultLanguage="python" />
```

`language`, `defaultLanguage`, `onLanguageChange`는 늘 쓰는 한 쌍이고 알려 주는 방식도 같습니다. `language`를 주면 애플리케이션이 들고 있고, `defaultLanguage`를 주면 에디터가 들고 있습니다. 언어를 다른 데서 정하는 페이지라면 `languagePicker`로 메뉴를 뺄 수 있습니다.

`plain`이 아닌 언어를 고르기 전에는 아무것도 내려받지 않습니다. 고른 뒤에 무엇이 오는지와, 색을 정하는 커스텀 속성 여덟 개는 [뷰어](./viewer#글자에-색-입히기)에 있습니다.

`highlight`가 여기서도 되는 이유는 색이 깔리는 이유와 같습니다. 읽는 사람이 보는 글자는 입력란 뒤의 줄이 그리고, 강조기는 거기에 닿을 수 있습니다. 이것은 `language`에 더해지는 것이 아니라 `language`를 대신하므로, `highlight`를 넘기는 에디터는 보통 `languagePicker`도 함께 끕니다.

```tsx
<DiffineEditor
  defaultBefore={saved}
  defaultAfter={draft}
  highlight={(line) =>
    tokenize(line.text).map((token) => ({
      length: token.content.length,
      className: `token ${token.type}`
    }))
  }
/>
```

<DiffineDemo component="editor" sample="code" colour height="18rem" />

줄을 그릴 때마다 호출되므로, 줄을 잘라 그리는 동안에는 화면에 있는 줄에 대해서만 불립니다. 반환한 구간을 비교 결과와 어떻게 겹치는지는 [뷰어](./viewer#글자에-색-입히기)에 있습니다.

뷰어에는 없는 제약이 하나 있습니다. 구간은 글자의 **모양**은 바꿔도 **너비**는 바꾸면 안 됩니다. 색, 굵기, 기울임, 배경은 괜찮습니다. 기본으로 딸려 오는 고정폭 글꼴에서는 굵은 키워드가 보통 키워드와 같은 자리를 차지합니다. 글자 크기나 다른 글꼴, 자간은 안 됩니다. 그 안에 있어야 할 커서에서 글자가 밀려납니다.

## 긴 문서

`virtualize`는 읽는 사람이 볼 수 있는 줄만 그리고 나머지는 높이로만 둡니다. 문서 전체는 어느 쪽이든 입력란이 들고 있습니다. 그건 브라우저 몫이고, 여기서 줄이는 것은 그 아래 요소로 그려지는 줄입니다.

모든 줄의 높이가 같아야 하므로 `wrap`을 켜면 꺼지고, 짧은 문서는 건드리지 않습니다.

## 언어와 문구, 그리고 색

`locale`은 에디터가 쓰는 말을 영어와 한국어 중에서 고르고, `strings`는 그중 어떤 문구든 바꿉니다. 색과 치수는 전부 요소에 선언된 `--diffine-*` 커스텀 속성입니다. 에디터는 뷰어의 목록에 하나를 더합니다. `--diffine-selection`이고, 반투명해야 합니다. 선택 영역 아래의 글자는 입력란 뒤의 줄이 그리기 때문에, 불투명한 색을 깔면 골라 낸 글자가 있던 자리에 파란 사각형만 남습니다.

```tsx
<DiffineEditor
  defaultBefore={saved}
  defaultAfter={draft}
  locale="ko"
  strings={{ placeholder: '여기에 붙여 넣으세요.' }}
/>
```

## 하지 않는 것

- **한 줄로 보기는 없습니다.** 두 문서의 줄이 한 열에 섞인 화면은 읽는 것이지 쓰는 것이 아닙니다. 경계에 새 줄을 넣었을 때 그 줄이 어느 문서의 것인지에 답이 없습니다.
- **한쪽으로 옮기는 화살표는 없습니다.** 변경을 반대쪽으로 옮기는 것은 한 문서를 고치는 일이 아니라 두 문서에 대한 결정이고, 아직 여기에 없습니다.
- **문법은 모릅니다.** `highlight`는 애플리케이션의 토크나이저가 찾아낸 것에 색을 입힐 뿐, 이 패키지에는 언어를 해석하는 코드가 없습니다.

[직접 써보기](./playground)에는 에디터와 뷰어가 같은 두 문서를 놓고 나란히 있고, 이 페이지의 스위치가 그 위에 있습니다.
