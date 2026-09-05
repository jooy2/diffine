---
title: 뷰어
order: 2
---

# 뷰어

`DiffineViewer`는 두 문서와 그 사이에 일어난 일을 그립니다. 그리는 방식은 전부 기본값을 가진 prop이라, 연결선까지 갖춘 좌우 비교와 좁은 패널에 줄만 나열한 화면을 같은 컴포넌트가 담당합니다.

아래 예제 위의 스위치를 직접 켜고 꺼 보세요. 그림이 아니라 컴포넌트 자체입니다.

<DiffineDemo sample="code" controls height="22rem" />

## 좌우 비교와 한 줄로 보기

`view`가 두 문서를 나란히 놓을지 위아래로 놓을지 정합니다.

`split`에서는 짝이 맞는 줄끼리 높이를 맞추고, 짝이 없는 줄 맞은편에는 빈 칸이 들어갑니다. `unified`에서는 변경 하나를 "빠진 줄들 다음에 들어온 줄들"로 쓰고 양쪽 줄 번호를 함께 보여 줍니다. 패치 파일의 모양입니다.

```tsx
<DiffineViewer before={saved} after={draft} view="unified" />
```

<DiffineDemo sample="code" view="unified" height="20rem" />

비교를 두 번 하는 것이 아니라 같은 비교를 다르게 읽는 것입니다. 줄 안에서 짚어 주는 단어도 엔진이 이미 찾아 둔 그것입니다.

## 줄 번호와 표시 기호

`lineNumbers`는 각 줄에 자기 번호를 붙입니다. 긴 줄을 가로로 스크롤해도 번호는 왼쪽에 붙어 있습니다. `markers`는 바뀐 줄 옆에 `+`, `−`, `~`를 붙입니다.

표시 기호는 켜 두는 편이 좋습니다. 색이 하는 말과 같은 말을, 빨강과 초록을 구분하지 못하는 사람에게도 하기 때문입니다.

```tsx
<DiffineViewer before={saved} after={draft} lineNumbers={false} markers={false} />
```

<DiffineDemo sample="code" :lineNumbers="false" :markers="false" height="18rem" />

둘 다 스크린 리더가 읽는 것은 아닙니다. 바뀐 줄에는 무슨 일이 있었는지가 단어로 붙어 있습니다. 화면에는 안 보이고 복사에도 안 딸려오는 자리에 들어가며, 이건 끌 수 없습니다.

## 줄 바꿈

`wrap`은 창보다 긴 줄을 어떻게 할지 정합니다. 끄면 오른쪽으로 흘러나가고 창이 가로로 스크롤되며, 켜면 줄을 바꿉니다.

둘 중 그리기 까다로운 쪽이 줄 바꿈이고, 뷰어가 무언가를 재는 유일한 이유이기도 합니다. 세 번 접힌 줄은 세 줄 높이인데 맞은편은 한 줄이면 거기서부터 두 문서가 어긋나기 때문입니다. 그래서 화면을 다시 그리거나 크기가 바뀔 때마다 짝을 재서 낮은 쪽에 높은 쪽의 높이를 줍니다.

```tsx
<DiffineViewer before={saved} after={draft} wrap />
```

<DiffineDemo sample="prose" wrap height="18rem" />

## 양쪽 높이 맞추기

`alignLines`는 기본으로 켜져 있고, 짝이 없는 줄 맞은편에 빈 칸을 넣는 역할을 합니다. 두 문서가 아래까지 계속 나란히 갑니다.

끄면 각 창이 자기 줄만 자기 문서 끝까지 그립니다. 높이는 더 이상 맞지 않고, 어느 쪽이 어느 쪽에 대응하는지는 가운데 열이 말해 줍니다.

<DiffineDemo sample="code" :alignLines="false" height="18rem" />

## 두 창 사이의 열

`connectors`는 변경 하나하나를 "빠져나간 자리에서 도착한 자리까지"의 띠로 그립니다. 높이를 맞춰 두면 띠는 반듯하고, 정렬이 이미 한 일을 조용히 확인해 줍니다. 맞추지 않으면 띠가 휘고, 그 줄들이 어디로 갔는지 말해 주는 유일한 표시가 됩니다.

좌표는 화면을 그릴 때 한 번 재서 들고 있습니다. 스크롤할 때는 이미 잰 모양을 옮길 뿐, 매 프레임 다시 재지 않습니다.

`syncScroll`은 두 창이 두 문서의 같은 부분을 보게 합니다. 줄 높이가 맞으면 스크롤 위치를 그대로 공유하고, 맞지 않으면 비율로 따라갑니다. 길이가 다른 두 문서에 같은 숫자를 쓰면 한쪽은 끝인데 다른 쪽은 중간이기 때문입니다.

## 바깥 틀

`header`는 각 문서의 이름을 위에 쓰고, `summary`는 집계를 아래에 씁니다. 둘 다 기본으로 켜져 있고, 뷰어가 페이지의 일부일 뿐일 때는 둘 다 끄면 됩니다.

```tsx
<DiffineViewer before={saved} after={draft} header={false} summary={false} />
```

<DiffineDemo sample="prose" :header="false" :summary="false" height="14rem" />

두 문서가 같으면 집계 자리에 0을 늘어놓는 대신 같다고 씁니다.

## 색과 언어

`colorScheme`의 기본값은 `system`이고, 읽는 사람의 설정을 따릅니다. 애플리케이션이 이미 정해 두었다면 `light`나 `dark`를 주세요.

`locale`은 문서의 언어가 아니라 뷰어 자신이 쓰는 말의 언어입니다. 헤더, 집계, 스크린 리더가 읽는 문구가 여기에 해당합니다. 영어와 한국어가 들어 있고, `strings`로 어느 쪽이든 단어를 바꿀 수 있습니다. 제3의 언어도 이렇게 넣습니다.

```tsx
<DiffineViewer
  before={saved}
  after={draft}
  locale="ko"
  strings={{ before: '저장본', after: '작업본' }}
/>
```

## 스타일

색과 치수는 전부 `.diffine` 엘리먼트의 커스텀 속성입니다. 자기 팔레트가 있는 애플리케이션은 패키지의 규칙을 이겨야 하는 규칙을 쓰는 대신 속성만 덮어쓰면 됩니다.

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

전체 목록은 [API](../api/#커스텀-속성)에 있습니다. 컴포넌트가 자기 prop 말고 받은 것은 전부 엘리먼트로 그대로 넘어가므로 `id`, `className`, `style`, `aria-*`는 `<div>`에서와 똑같이 동작합니다.

## 미리 계산한 비교 결과

`result`는 문서 두 개 대신 이미 계산된 비교 결과를 받습니다. 워커나 서버에서 계산했거나, 목록 전체를 위해 한 번만 계산한 경우에 쓰세요.

```tsx
import { diffText } from 'diffine-react/diff';

const result = diffText(saved, draft);

<DiffineViewer result={result} />;
```

그 값이 무엇인지는 [비교 결과](./diff)에 있습니다.
