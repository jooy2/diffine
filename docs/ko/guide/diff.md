---
title: 비교 결과
order: 4
---

# 비교 결과

`diffText`는 두 문서 사이에서 무엇이 달라졌는지 계산해 돌려줍니다. React도 DOM도 건드리지 않기 때문에 진입점도 따로 있습니다. 요약 한 줄, 배지의 숫자, 워커에서 돌리는 계산에는 화면이 아니라 값이 필요하기 때문입니다.

```ts
import { diffText } from 'diffine-react/diff';

const result = diffText(saved, draft);

result.changes.length; // 3
result.stats; // { unchanged: 41, changed: 5, inserted: 2, deleted: 1 }
```

## 돌려주는 것

| 필드              | 무엇인지                                           |
| ----------------- | -------------------------------------------------- |
| `before`, `after` | 각 문서를 줄 단위로 자른 것. 줄바꿈 문자는 뺍니다. |
| `rows`            | 두 문서의 처음부터 한 행씩 늘어놓은 비교 결과.     |
| `changes`         | 변경 목록. 나타나는 순서대로 들어 있습니다.        |
| `stats`           | 어느 쪽에 얼마나 들어갔는지 집계.                  |
| `complete`        | 최소 편집을 찾았는지, 도중에 포기했는지.           |

### 행

한 행은 줄이 있는 쪽만 채워집니다. `equal`은 양쪽 다, `insert`는 `after`만, `delete`는 `before`만 있고, `replace`는 마주 보는 두 줄이 서로 다른 경우입니다.

```ts
for (const row of result.rows) {
  if (row.kind === 'equal') {
    continue;
  }

  console.log(row.kind, row.before?.text ?? '', row.after?.text ?? '');
}
```

좌우 비교 화면은 그 `null` 자리에 빈 칸을 그립니다. 화면이 아닌 곳에서 읽는다면 그냥 건너뛰면 됩니다.

줄에는 자기 문서에서 몇 번째 줄인지 나타내는 `index`(0부터), 쓰인 그대로의 `text`, 그리고 `segments`가 있습니다.

### 조각

`segments`는 한 줄을 바뀐 부분과 안 바뀐 부분으로 쪼갠 것입니다. 그 줄이 속한 쪽의 조각만 들어 있어서, 이어 붙이면 원래 줄이 나옵니다.

```ts
const [row] = diffText('the quick fox', 'the slow fox').rows;

row.before.segments;
// [{ kind: 'equal', text: 'the ' }, { kind: 'delete', text: 'quick' }, { kind: 'equal', text: ' fox' }]
row.after.segments;
// [{ kind: 'equal', text: 'the ' }, { kind: 'insert', text: 'slow' }, { kind: 'equal', text: ' fox' }]
```

빈 배열이면 비교할 상대가 없었거나, 짝이 너무 안 닮아서 짚어 줄 가치가 없다고 판단한 경우입니다. 어느 쪽이든 그 줄은 행이 말하는 그대로 처음부터 끝까지 하나입니다.

### 변경

변경 하나는 함께 바뀐 줄들의 묶음입니다. "변경이 몇 건이냐"를 셀 때의 단위가 이것입니다. 안 바뀐 줄들은 목록에 없고, 변경과 변경 사이의 빈 자리가 그것입니다.

각 항목은 양쪽에서 어느 줄들을 덮는지와 어느 행을 차지하는지를 갖고 있습니다.

```ts
for (const change of result.changes) {
  console.log(`${change.kind}: before ${change.beforeStart + 1}~${change.beforeEnd}줄`);
}
```

`rowStart`와 `rowEnd`는 다음 변경으로 건너뛰거나 여백에 띠를 그릴 때 쓰는 값입니다.

## 비교 방식

두 번째 인자가 정합니다. 빠뜨린 항목은 기본값을 쓰므로 옵션 하나만 줘도 됩니다.

### `inline`

통째로 바뀐 게 아니라 고쳐진 줄 짝 안에서 무엇을 비교할지 정합니다.

기본값 `word`가 대개 원하는 결과입니다. 원래 있던 단어와 글자 몇 개가 겹친다고 그것까지 짚는 대신 옮겨간 단어를 짚습니다. `character`는 한 단계 더 내려가 자소 하나씩 비교하므로 숫자 가운데 한 자리가 바뀐 경우에 알맞습니다. `none`은 바뀐 줄을 바뀐 줄로만 두고 더 말하지 않습니다.

<DiffineDemo sample="prose" inline="character" height="16rem" />

### `whitespace`

공백을 얼마나 따질지 정합니다. 기본은 `exact`이고 `trailing`, `surrounding`, `amount`, `all` 순으로 점점 더 무시합니다.

무시한 공백도 화면에는 그대로 그립니다. 어떤 줄을 같다고 볼지만 바뀌고 읽는 사람이 보는 것은 그대로입니다. 들여쓰기만 다시 한 파일에 `surrounding`이 쓸모 있는 이유입니다.

<DiffineDemo sample="whitespace" whitespace="surrounding" height="10rem" summary />

### `ignoreCase`

`Title`과 `title`을 같은 줄로 볼지 정합니다. 기본은 끔입니다.

켜면 엔진이 같다고 판단한 구간이 실제로는 서로 다른 두 문자열일 수 있습니다. 조각을 한 목록이 아니라 양쪽으로 나눠 돌려주는 이유가 이것입니다. 목록이 하나라면 `Title`과 `title` 중 하나만 담을 수 있고, 담기지 않은 쪽 문서에는 없는 글자를 보여 주게 됩니다.

### `inlineThreshold`

줄 안의 단어를 짚어 줄 만큼 두 줄이 닮았는지 판단하는 기준입니다. 0에서 1 사이이고 기본은 `0.3`입니다.

고쳐진 두 줄은 단어 대부분이 겹칩니다. 그냥 마주 보게 된 두 줄은 쉼표 하나와 모음 몇 개가 겹칠 뿐이고, 그것까지 짚으면 의미 없는 조각이 줄 곳곳에 흩어집니다. 기준 아래로 내려가면 양쪽 모두 그냥 바뀐 줄 하나로 그립니다.

### `maxCost`

포기하기 전까지 감당할 차이의 크기입니다. 기본은 `5000`입니다.

최소 편집을 찾는 비용은 대략 두 문서의 크기 곱하기 그 사이 편집 횟수입니다. 그래서 공통점이 없는 큰 문서 둘이 가장 비싼 경우인데, 이 경우의 답은 "전부 바뀌었다"이고 그걸 기다릴 이유가 없습니다. 한도를 넘으면 그 구간은 통째로 교체된 것으로 돌아오고 `complete`가 `false`가 됩니다.

## 더 작은 단위

`diffWords`와 `diffCharacters`는 문서 없이 두 줄만 비교합니다. 제목, 이름, 표의 한 칸 같은 것들입니다.

```ts
import { diffWords } from 'diffine-react/diff';

const { before, after, similarity } = diffWords('the quick fox', 'the slow fox');
```

`similarity`는 짝지을 수 있었던 비율을 글자 수로 센 값입니다. `inlineThreshold`가 재는 대상이 이 값입니다.

`diffSequence`는 엔진 그 자체입니다. 비교 단위가 줄도 단어도 아닌 경우에 쓰세요.

```ts
import { diffSequence } from 'diffine-react/diff';

diffSequence(['a', 'b', 'c'], ['a', 'c']);
// [
//   { kind: 'equal',  beforeStart: 0, beforeEnd: 1, afterStart: 0, afterEnd: 1 },
//   { kind: 'delete', beforeStart: 1, beforeEnd: 2, afterStart: 1, afterEnd: 1 },
//   { kind: 'equal',  beforeStart: 2, beforeEnd: 3, afterStart: 1, afterEnd: 2 }
// ]
```

양쪽 다 문자열로 비교하므로, 토큰이 무엇이든 그것을 식별하는 문자열로 넘기면 됩니다. 돌아온 편집 목록은 두 배열을 순서대로 빠짐없이 한 번씩 덮습니다.

## 동작 방식

Eugene Myers가 1986년에 발표한 방법을 그 논문 후반부의 형태로 구현했습니다. 편집 그래프를 앞에서부터, 그리고 뒤에서부터 동시에 걸어가다가 둘이 만나는 지점에서 멈추고, 그 지점의 일치 구간을 기준으로 양옆을 다시 같은 방법으로 나눕니다. 한 걸음마다 두 문서를 한 번씩 훑고 그래프 전체가 아니라 한 줄만 들고 있기 때문에 큰 파일도 열립니다.

그 위에 두 가지가 얹혀 있습니다. 줄이 빠지고 들어온 구간 안에서는 위에서부터 차례로 짝을 짓지 않고 닮은 줄끼리 짝을 짓습니다. 그러지 않으면 줄을 고치면서 동시에 끼워 넣은 구간에서 끼워 넣은 줄 아래가 전부 어긋납니다. 그리고 짝지어진 두 줄 안에서 같은 탐색이 단어나 자소 단위로 한 번 더 돕니다.
