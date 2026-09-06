---
layout: home

title: Diffine
titleTemplate: 비교 엔진과 뷰어를 한 패키지에
description: 두 버전을 비교해 무엇이 달라졌는지 보여줍니다. 비교 엔진과 나란히 보는 뷰어가 한 패키지에 들어 있고, 구문 강조는 언어를 고를 때만 내려받습니다.

hero:
  name: Diffine
  text: 달라진 곳을 보여줍니다
  tagline: 비교 엔진과 나란히 보는 뷰어를 한 패키지에 담은 React 라이브러리입니다. 텍스트와 이미지를, 읽기와 고쳐 쓰기를 모두 지원합니다.
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
  - title: 결과는 평범한 객체
    details: 엔진은 행과 변경 목록과 집계를 돌려줍니다. React도 DOM도 섞이지 않은 평범한 객체입니다.
    link: /ko/guide/diff
    linkText: 비교 결과
  - title: 화면 요소는 전부 prop
    details: 줄 번호, 줄 바꿈, 높이 맞추기, 연결선, 한 줄로 보기. 각각 기본값이 있고 스타일시트를 건드릴 일이 없습니다.
    link: /ko/guide/text-diff
    linkText: 텍스트 비교
  - title: 의존성은 하나
    details: highlight.js 하나뿐이고 import() 뒤에 있습니다. 색을 입히지 않는 페이지는 아무것도 내려받지 않습니다.
    link: /ko/guide/getting-started
    linkText: 시작하기
---

## 무엇을 할 수 있나

- 두 문서를 줄 단위로 비교하고, 바뀐 줄 안에서 다시 단어나 글자 단위로 비교
- 두 이미지를 픽셀 단위로 비교. 허용 오차, 경계 보정, 어긋남 보정 지원
- 텍스트는 좌우 비교와 한 줄로 보기, 이미지는 좌우·겹쳐 보기·나눠 보기·마스크
- 브라우저의 되돌리기와 입력기와 선택 영역을 그대로 쓰는 에디터 모드
- 창마다 따로 도는 찾기와 바꾸기
- 34개 언어 구문 강조. 직접 만든 강조기도 연결 가능
- 2만 줄짜리 문서도 끊김 없이 스크롤
- 밝은 테마와 어두운 테마, 영어와 한국어, 키보드와 스크린 리더 지원
- TypeScript 타입 선언 포함

## 두 문서 비교

<DiffineDemo sample="code" controls colour height="24rem" />

## 두 이미지 비교

<DiffinePictures sample="retouched" height="24rem" />

둘 다 npm에 올라간 패키지가 이 페이지에서 실제로 도는 화면입니다. 설치와 첫 컴포넌트는 [시작하기](./guide/getting-started)에 있습니다.
