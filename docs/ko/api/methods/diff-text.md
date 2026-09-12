---
title: diffText
order: 1
description: '두 문서를 줄 단위로 비교하고, 고쳐진 줄 짝 안에서 무엇이 달라졌는지 표시합니다.'
---

# `diffText`

::: fw react

```ts
diffText(before: string, after: string, options?: DiffOptions): DiffResult
```

:::

::: fw flutter

```dart
DiffResult diffText(String before, String after, [DiffOptions? options]);
```

:::

두 문서를 줄 단위로 비교하고, 고쳐진 줄 짝 안에서 무엇이 달라졌는지 표시합니다. 어떻게 비교할지는 [`DiffOptions`](../types/diff-options)이고, 돌아오는 값은 [`DiffResult`](../types/diff-result)입니다.
