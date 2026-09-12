---
title: DiffineHighlight
order: 17
description: "An application's own highlighter in place of a language — the runs it returns, and how the line is cut at them."
---

# `DiffineHighlight`

::: fw react

```ts
type DiffineHighlight = (
  line: DiffLine,
  side: 'before' | 'after'
) => readonly DiffineToken[] | null | undefined;

interface DiffineToken {
  /** How many characters of the line this run covers. */
  length: number;
  className?: string;
  style?: React.CSSProperties;
}
```

Called for each line the component draws, with the whole line. The runs come back in order; a gap between two of them is drawn plain, and `null` leaves the line alone. `length` counts the same units `String.prototype.slice` does.

:::

::: fw flutter

```dart
typedef DiffineHighlight = List<DiffineToken>? Function(DiffLine line, DiffineSide side);

class DiffineToken {
  const DiffineToken({required this.length, this.kind, this.style});

  /// How many characters of the line this run covers.
  final int length;
  final DiffineTokenKind? kind;
  final TextStyle? style;
}
```

Called for each line the widget draws, with the whole line. The runs come back in order; a gap between two of them is drawn plain, and `null` leaves the line alone. `length` counts UTF-16 code units, which is what `String.substring` counts.

`kind` is one of `keyword`, `string`, `comment`, `number`, `title`, `type`, `variable` and `meta`, and the theme turns it into a colour — which is what lets a highlighter of the application's own follow the palette a reader chose. `style` is for one that has already decided, and a run carrying it ignores `kind`.

:::

The line is cut at the boundaries of both these runs and the comparison's, so a changed word that is half a string literal is drawn as exactly that.

Passing this replaces `language` rather than adding to it. A line has one set of runs, and two highlighters cutting it at once is not a question with an answer.
