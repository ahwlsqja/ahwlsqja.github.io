# 시나리오 스테퍼 사용법

한 장의 SVG 도식에서 시나리오(정상 흐름, 장애 케이스)를 탭으로 바꿔 끼우고, 단계마다 켤 요소와 캡션을 바꾸는 컴포넌트입니다. 스타일은 `site.css`, 동작은 `site.js`(6번 섹션)에 있고 외부 라이브러리는 없습니다. 기존 `figure.dg[data-steps]` 도식과는 독립이라 서로 영향이 없습니다. 동작 예시는 `scenario-demo.html`입니다.

## 최소 예제

```html
<figure class="dg scn" id="scn-a" data-scenarios='[
  {"id":"normal","label":"정상 흐름","steps":[
    {"ok":["n-a","e-ab"],"t":["지금 일어나는 일입니다.","왜 이렇게 설계했는지입니다.","실패하면 어떻게 되는지입니다."]},
    {"ok":["n-b"],"t":"한 문장 캡션도 됩니다."}
  ]},
  {"id":"cut","label":"연결 끊김","steps":[
    {"ok":["n-a","e-ab","n-b"],"t":"먼저 정상 상태를 보입니다."},
    {"fail":["e-ab"],"t":"연결이 끊깁니다."},
    {"recover":["n-c","e-bc"],"t":"보상 경로로 되돌립니다."}
  ]}
]'>
  <figcaption><span class="n">그림 1</span>제목</figcaption>
  <div class="dg__canvas">
    <svg viewBox="0 0 728 160" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="scn-a-ah" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8"
                markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path class="ah" d="M0 0L8 4L0 8z"/></marker>
      </defs>
      <g id="n-a"><rect class="box" x="24" y="50" width="170" height="60" rx="8"/><text class="t" x="38" y="76">노드 A</text><text class="s" x="38" y="96">설명</text></g>
      <g id="n-b"><rect class="box" x="279" y="50" width="170" height="60" rx="8"/><text class="t" x="293" y="76">노드 B</text></g>
      <g id="n-c" data-scn="cut"><rect class="box" x="534" y="50" width="170" height="60" rx="8"/><text class="t" x="548" y="76">노드 C</text></g>
      <path id="e-ab" class="edge" d="M194 80H273" marker-end="url(#scn-a-ah)"/>
      <path id="e-bc" class="edge" data-scn="cut" d="M449 80H528" marker-end="url(#scn-a-ah)"/>
    </svg>
  </div>
</figure>
```

탭, 이전/다음 버튼, 캡션 영역, 단계 목록은 `site.js`가 만듭니다. 직접 쓰지 않습니다.

## 데이터 형식 (`data-scenarios`)

시나리오 배열입니다.

| 필드 | 뜻 |
|---|---|
| `id` | 시나리오 이름. `data-scn`과 짝입니다 |
| `label` | 탭 글자 |
| `steps` | 단계 배열 (1개 이상) |

단계 한 칸:

| 필드 | 뜻 |
|---|---|
| `on` | 켤 SVG 요소 id 목록, 중립 표시 |
| `ok` | 정상 흐름으로 켤 id 목록 |
| `fail` | 실패 또는 격리로 켤 id 목록 (점선) |
| `recover` | 복구 또는 보상으로 켤 id 목록 |
| `t` | 캡션. 문자열 하나, 또는 3문장 배열 ["지금 일어나는 일", "왜 이렇게 설계했나", "실패하면 어떻게 되나"] |
| `d` | 이 단계만의 표시 시간(ms). 선택 |

- 요소 id는 페이지 안에서 겹치지 않아야 합니다. figure 안에 있는 요소만 찾습니다.
- 단계 표시: 현재 단계에서 켠 요소는 선명, 이전 단계에서 켠 요소는 옅게, 아직 켜지 않은 요소는 희미하게 보입니다. 시나리오에서 언급하지 않은 요소는 기본 상태 그대로입니다.
- `data-scn="id1 id2"`를 붙인 요소(라벨 `text` 포함)는 그 시나리오에서만 보입니다.
- 상태 칩(진행/정상/실패/복구)은 단계에 `recover`가 있으면 복구, 없고 `fail`이 있으면 실패, 없고 `ok`가 있으면 정상, 그 외는 진행으로 자동 정해집니다.

## 클래스

런타임이 요소에 붙입니다. SVG에는 `box`, `t`, `s`, `edge`, `ah` 같은 기존 `dg` 클래스만 씁니다.

| 클래스 | 뜻 |
|---|---|
| `sc-neutral` | 중립 (구조 색) |
| `sc-ok` | 정상 흐름 (강조색) |
| `sc-fail` | 실패 (경고색, 점선 2px) |
| `sc-recover` | 복구 (복구색, 실선) |
| `sc-now` / `sc-past` / `sc-dim` | 현재 / 지난 단계 / 아직 안 켜짐 |
| `sc-idle` | 시나리오에서 언급 안 한 요소 |
| `sc-hide` | 다른 시나리오 전용 요소 (숨김) |
| `edge--fail` | 정지 상태에서도 점선으로 그릴 실패 경로 (작성자가 직접 씀) |

선 굵기는 구조선 1.5px, 켜진 흐름 3px, 실패 점선 2px입니다. 화살촉은 `<marker>` 하나를 쓰고 `path.ah`로 두면 선 색을 따라갑니다.

## 조작

- 탭, 처음/이전/다음, 재생/정지 버튼. 기본은 정지이고 자동 재생하지 않습니다.
- 좌우 화살표: 탭에 포커스가 있으면 시나리오 전환, 그 밖에서는 단계 이동. Home/End는 처음/끝 단계, Esc는 정지.
- `prefers-reduced-motion: reduce`이면 재생 버튼이 비활성화되고 전환 애니메이션이 꺼집니다. 도식에 단계 번호 배지가 붙고, 단계 목록과 "다음" 버튼으로 읽습니다.
- 캡션은 `aria-live="polite"`입니다.

## 속성

| 속성 | 뜻 |
|---|---|
| `data-step-ms` | 단계 기본 표시 시간(ms). 기본 1400 |
| `--dg-min` | 좁은 화면에서 도식 최소 폭. `style="--dg-min: 728px"`처럼 viewBox 폭과 맞춥니다. 도식만 가로 스크롤됩니다 |

## 쓸 때 지킬 것

- 색은 4개 이하이고, 뜻은 점선/실선과 라벨, 상태 칩으로도 전합니다. SVG에 고정 색(`#...`)을 쓰지 않습니다.
- 노드는 7개 이하, 노드 라벨은 명사, 화살표 라벨은 "동사 + 조건"으로 12자 안팎. 글자는 12px 이상.
- 수치는 확인된 값만 씁니다.
