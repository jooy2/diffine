---
title: DiffStats
order: 5
description: '그대로인 줄과 바뀐 줄, 늘어난 줄과 지워진 줄이 각각 몇 줄인지.'
---

# `DiffStats`

::: fw react

```ts
interface DiffStats {
  unchanged: number;
  changed: number;
  inserted: number;
  deleted: number;
}
```

:::

::: fw flutter

```dart
class DiffStats {
  final int unchanged;
  final int changed;
  final int inserted;
  final int deleted;
}
```

:::

`changed`는 마주 보면서 서로 다른 줄 짝의 개수입니다. 그래서 고쳐진 줄 하나는 `inserted` 하나에 `deleted` 하나가 아니라 `changed` 하나로 셉니다.
