---
layout: home

title: Diffine
titleTemplate: 비교 엔진과 뷰어를 한 패키지에
description: 두 버전을 비교해 무엇이 달라졌는지 보여줍니다. 비교 엔진과 나란히 보는 뷰어가 한 패키지에 들어 있고, 둘 다 다른 라이브러리를 깔고 앉지 않습니다.

hero:
  name: Diffine
  text: 무엇이, 어디서 달라졌는지
  tagline: Diffine은 두 버전 사이에서 무엇이 달라졌는지 계산해 화면에 그립니다. 양쪽을 나란히 놓고, 짝이 맞는 줄끼리 높이를 맞추고, 실제로 바뀐 단어를 그 줄 안에서 짚어 줍니다.
  image:
    src: /256x256.png
    alt: Diffine
    width: 200
    height: 200
  actions:
    - theme: brand
      text: 시작하기
      link: /ko/guide/getting-started
    - theme: alt
      text: 뷰어
      link: /ko/guide/viewer
    - theme: alt
      text: API
      link: /ko/api/
    - theme: alt
      text: GitHub
      link: https://github.com/jooy2/diffine

features:
  - title: 한 번에 두 단계로 본다
    details: 먼저 줄을 맞춰 어디가 바뀌었는지 찾고, 바뀐 줄 짝 안에서 다시 단어를 맞춰 무엇이 바뀌었는지 찾습니다. "이 줄이 다르다"와 "이 단어가 다르다"는 다른 이야기이고, 읽는 사람에게 필요한 쪽은 뒤엣것입니다.
    link: /ko/guide/diff
    linkText: 비교 결과
  - title: 결과는 그림이 아니라 값이다
    details: 비교 결과로 행과 변경 목록과 집계를 돌려줍니다. React도 DOM도 섞이지 않은 평범한 객체라 뷰어로 그려도 되고, 다른 곳에 출력해도 되고, 워커에서 미리 계산해 넘겨도 됩니다. 뷰어는 그 값을 쓰는 여러 방법 중 하나입니다.
    link: /ko/guide/diff
    linkText: 비교 결과
  - title: 화면 요소는 전부 옵션이다
    details: 줄 번호, 줄 바꿈, 양쪽 높이 맞추기, 가운데 연결선, 한 줄로 보기. 각각이 기본값을 가진 prop이라 스타일시트를 건드리지 않고도 연결선까지 갖춘 좌우 비교부터 줄만 나열한 화면까지 갑니다.
    link: /ko/guide/viewer
    linkText: 뷰어
  - title: 아래에 깔린 것이 없다
    details: 비교 엔진도, 높이를 맞추는 계산도, 뷰어도 직접 만들었습니다. 비교 라이브러리도, 에디터 컴포넌트도, CSS 프레임워크도 없습니다. 패키지 하나와 React뿐입니다.
    link: /ko/guide/getting-started
    linkText: 시작하기
---

## 지금 상태

Diffine은 `0.0.1`입니다. 비교 엔진과 뷰어를 만들고 테스트해 [`diffine-react`](https://www.npmjs.com/package/diffine-react)로 npm에 올렸습니다. 이 사이트의 예제는 전부 그 패키지가 실제로 돌아가는 화면이고, 설치했을 때와 같은 소스를 그립니다.

이름은 아직 확정이 아닙니다. `1.0.0` 전까지는 어떤 export든 모양이 바뀔 수 있다고 보시고, 무엇이 바뀌었는지는 [변경 기록](./changelog)에서 확인하세요.

패키지를 따로 폴더에 둔 이유는 다른 언어로도 낼 계획이기 때문입니다. 각 패키지는 자기 매니페스트 옆에 자기 변경 기록을 두고 따로 버전을 매기므로, 한쪽의 릴리스가 다른 쪽의 릴리스는 아닙니다.

<DiffineDemo sample="code" controls height="24rem" />

[시작하기](./guide/getting-started)에 지금 있는 기능이 다 정리돼 있습니다.
