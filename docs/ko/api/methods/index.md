---
title: 메서드
order: 2
description: 'Diffine이 내보내는 비교 함수들. 화면은 하나도 섞이지 않았습니다.'
---

# 메서드

<Fw react="컴포넌트" flutter="위젯" />가 섞이지 않은 엔진입니다. 두 문서를 넣으면 무엇이 달라졌는지, 두 이미지를 넣으면 무엇이 달라졌는지가 나오고, 패치는 읽고 쓸 수 있습니다.

| 문서                                      | 무엇을 하나                                          |
| ----------------------------------------- | ---------------------------------------------------- |
| [`diffText`](./diff-text)                 | 두 문서를 줄 단위로, 바뀐 줄 안에서 다시 비교합니다. |
| [`diffWords`](./diff-words)               | 두 줄을 단어 단위로 비교합니다.                      |
| [`diffCharacters`](./diff-characters)     | 같은 비교를 글자 단위로 합니다.                      |
| [`diffSequence`](./diff-sequence)         | 무엇이든 토큰 두 벌을 비교합니다.                    |
| [`formatPatch`](./format-patch)           | 비교 결과를 유니파이드 diff로 씁니다.                |
| [`parsePatch`](./parse-patch)             | 유니파이드 diff를 비교 결과로 읽습니다.              |
| [`diffImage`](./diff-image)               | 두 이미지를 픽셀 단위로 비교합니다.                  |
| [`diffImages`](./diff-images)             | 여러 장을 한 번에 기준 한 장과 비교합니다.           |
| [`imageSimilarity`](./image-similarity)   | 두 이미지가 얼마나 닮았는지 숫자 하나로 말합니다.    |
| [`imagesSimilarity`](./images-similarity) | 여러 장이 얼마나 닮았는지와, 어느 것이 유별난지.     |
| [`paintDiffImage`](./paint-diff-image)    | 비교 마스크를 그림 한 장으로 만듭니다.               |
| [`paintDiffImages`](./paint-diff-images)  | 여러 장을 비교한 마스크도 같은 방식으로.             |
