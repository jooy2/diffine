---
layout: home

title: Diffine
titleTemplate: 비교 엔진과 뷰어를 한 패키지에
description: 두 버전을 비교해 무엇이 달라졌는지 보여줍니다. 비교 엔진과 나란히 보는 뷰어를 한 패키지에 담았고, React와 Flutter를 모두 지원합니다.

hero:
  name: Diffine
  text: 달라진 곳을 보여줍니다
  tagline: 비교 엔진과 나란히 보는 뷰어를 한 패키지에 담았습니다. React와 Flutter 모두에서, 텍스트와 이미지를, 읽기와 고쳐 쓰기를 지원합니다.
  image:
    src: /hero.png
    alt: Diffine
    width: 300
    height: 300
  actions:
    - theme: brand
      text: 시작하기
      link: /ko/guide/getting-started
    - theme: alt
      text: 직접 써보기
      link: /ko/guide/playground
    - theme: alt
      text: API
      link: /ko/api/
    - theme: alt
      text: GitHub
      link: https://github.com/jooy2/diffine

features:
  - title: 줄과 단어를 함께
    details: 먼저 줄을 맞추고, 고쳐진 줄 짝 안에서 단어를 한 번 더 맞춥니다.
    link: /ko/guide/diff
    linkText: 비교 결과
  - title: 결과는 평범한 값
    details: 엔진은 행과 변경 목록과 집계를 돌려줍니다. 컴포넌트도 위젯도 섞이지 않은 평범한 값입니다.
    link: /ko/guide/diff
    linkText: 비교 결과
  - title: 화면 요소는 전부 설정 하나
    details: 줄 번호, 줄 바꿈, 높이 맞추기, 연결선, 한 줄로 보기. 각각 기본값이 있고, 켜고 끄는 데 한 줄이면 됩니다.
    link: /ko/guide/text-diff
    linkText: 텍스트 비교
  - title: 의존성은 하나
    details: React는 import() 뒤에 있는 highlight.js 하나, Flutter는 Dart 팀이 만든 characters 하나. 그 밖에 딸려 오는 것은 없습니다.
    link: /ko/guide/getting-started
    linkText: 시작하기
---

## 무엇을 할 수 있나

::: cards

- **줄 먼저, 그다음 단어**

  두 문서를 줄 단위로 비교하고, 바뀐 줄 안에서 다시 단어나 글자 단위로 비교합니다.

- **픽셀 단위로**

  두 이미지를 픽셀 단위로 비교합니다. 허용 오차, 경계 보정, 어긋남 보정을 지원합니다.

- **보는 방식**

  텍스트는 좌우 비교와 한 줄로 보기, 이미지는 좌우와 겹쳐 보기와 나눠 보기와 마스크.

- **에디터 모드**

  같은 비교 위에서 <Fw react="브라우저의" flutter="플랫폼의" /> 되돌리기와 입력기와 선택 영역을 그대로 씁니다.

- **찾기와 바꾸기**

  창마다 따로 돌고, 에디터에서는 바꾸기까지 됩니다.

- **34개 언어**

  어느 언어든 구문 강조가 들어가고, 직접 만든 강조기를 대신 연결해도 됩니다.

- **2만 줄**

  그만한 문서도 끊김 없이 스크롤됩니다.

- **밝게, 어둡게, 두 언어로**

  영어와 한국어를 지원하고, 둘 다에서 키보드와 스크린 리더가 동작합니다.

- **<Fw react="타입 선언 포함" flutter="Material도 Cupertino도 없이" />**

  <Fw react="TypeScript 타입 선언이 패키지에 함께 들어 있어, prop에 타입을 적는 애플리케이션이 그대로 가져다 씁니다." flutter="둘 중 어느 쪽도 부르지 않아서 어떤 앱에나 들어갑니다." />

:::

## 두 문서 비교

<DiffineDemo sample="code" controls colour height="24rem" :flutter="false" />

## 두 이미지 비교

<DiffinePictures sample="retouched" height="24rem" />

둘 다 React 패키지가 이 페이지에서 실제로 도는 화면입니다. 웹 페이지라서 그렇습니다. Flutter 위젯도 같은 엔진으로 같은 비교를 그리고, 가이드의 모든 페이지에 양쪽이 함께 있습니다. 설치와 첫 줄은 [시작하기](./guide/getting-started)에 있습니다.
