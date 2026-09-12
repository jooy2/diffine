---
title: 언어 목록
order: 15
description: '구문 강조가 받는 언어 전부와, 문법을 언제 내려받는지.'
---

# 언어 목록

::: fw react

```ts
interface DiffineLanguageOption {
  id: string;
  name: string;
}

const DIFFINE_LANGUAGES: readonly DiffineLanguageOption[];
```

`language`에 넣을 수 있는 언어 전부입니다. `plain`이 맨 앞이고 그 뒤로 highlight.js 식별자 서른네 개가 알파벳순으로 옵니다. `id`가 `language`에 넣는 값이고, `name`이 창 위에 쓰이는 이름입니다. 로케일과 상관없이 영어로 씁니다. `TypeScript`는 어느 언어에서나 `TypeScript`이기 때문입니다. 이름만 들어 있습니다. 문법은 각각 `import()` 뒤에 있어서, 이 목록으로 메뉴를 만들어도 목록 크기만 듭니다.

에디터의 메뉴가 이 목록으로 만들어집니다. 다른 곳에 메뉴를 따로 만든다면 목록을 복사해 두지 말고 이 값에서 만드세요. 언어가 늘어나도 따라옵니다.

`highlight.js`와 문법 하나하나가 `import()` 뒤에 있습니다. `plain`이 아닌 언어를 요청하기 전까지는 아무것도 내려받지 않고, 요청하면 그 언어의 문법만 내려받습니다. 문법이 도착한 다음 프레임에 색이 입혀지고, 그 전까지는 문서 그대로 그려집니다.

:::

::: fw flutter

```dart
class DiffineLanguageOption {
  final String id;
  final String name;
}

const List<DiffineLanguageOption> kDiffineLanguages;

DiffineHighlight? diffineHighlighterFor(String? language, List<String> before, List<String> after);
```

`language`에 넣을 수 있는 언어 전부입니다. `plain`이 맨 앞이고 그 뒤로 식별자 서른네 개가 알파벳순으로 옵니다. React 패키지가 받는 것과 같은 식별자라, 문서 옆에 언어를 저장해 두는 서비스는 양쪽에 같은 문자열을 씁니다. `id`가 `language`에 넣는 값이고, `name`이 창 위에 쓰이는 이름입니다. 로케일과 상관없이 영어로 씁니다.

에디터의 메뉴가 이 목록으로 만들어집니다. 다른 곳에 메뉴를 따로 만든다면 목록을 복사해 두지 말고 이 값에서 만드세요.

문법은 내려받지 않고 패키지 안에 있습니다. 앱 번들에는 미룰 네트워크가 없기 때문입니다. 같은 이유로 문법은 근사치입니다. 서른네 개 언어의 정확한 파서는 비교 뷰어 옆에 둘 물건이 아닙니다. `diffineHighlighterFor`는 `language` 뒤에서 도는 바로 그 강조기이고, 같은 규칙으로 다른 것을 칠하려는 애플리케이션을 위해 열어 뒀습니다.

:::
