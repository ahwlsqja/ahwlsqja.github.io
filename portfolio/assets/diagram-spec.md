# 다이어그램 작성 규격

포트폴리오 상세 페이지에 넣는 그림은 모두 이 규격을 따릅니다. 스타일은 `site.css`, 단계 재생은 `site.js`가 맡습니다. 작성자는 SVG와 단계 설명만 씁니다. 실제 견본은 `sample.html`의 그림 1입니다.

## 1. 바깥 구조

```html
<figure class="dg" id="dg-stream" data-step-ms="2800" data-steps='[
  {"t":"1단계에서 일어나는 일을 한 문장으로 씁니다."},
  {"t":"2단계 설명입니다.", "d": 4000}
]'>
  <figcaption><span class="n">그림 1</span>이벤트 1건이 저장까지 가는 경로</figcaption>
  <div class="dg__canvas">
    <svg viewBox="0 0 728 316" xmlns="http://www.w3.org/2000/svg"> … </svg>
  </div>
</figure>
```

| 속성, 요소 | 뜻 | 필수 |
|---|---|---|
| `class="dg"` | 다이어그램 figure | 예 |
| `data-steps` | 단계 배열(JSON). `t`는 단계 설명, `d`는 그 단계만의 표시 시간(ms) | 예 |
| `id` | 페이지 안에서 겹치지 않는 이름. SVG 안 id의 접두사로도 씁니다 | 예 |
| `data-step-ms` | 단계 기본 표시 시간. 없으면 2800 | 아니요 |
| `data-idle` | 아무 단계도 고르지 않았을 때 바에 보일 문장 | 아니요 |
| `<figcaption>` | `그림 N` + 제목. SVG의 접근성 이름으로도 쓰입니다 | 예 |
| `<ol class="dg__steps">` | 직접 쓰면 그 목록을 쓰고, 없으면 `data-steps`로 만듭니다 | 아니요 |

`site.js`가 그림 아래에 조작 바(이전, 재생/일시정지, 다음, `2 / 5`, 현재 단계 문장)와 단계 목록을 붙입니다. 직접 만들지 않습니다.

## 2. 단계 표시

- 강조할 요소에 `data-step="1,2"`처럼 단계 번호를 씁니다. `"2-4"`처럼 범위도 됩니다. 번호는 1부터 셉니다.
- 상자는 `<g data-step="…">` 하나로 묶습니다. 안에 `rect.box`, `text.t`, `text.s`를 둡니다. 그러면 상자와 글자가 함께 강조됩니다.
- 해당 단계가 되면 런타임이 그 요소에 `.on`을 붙입니다.
- 재생 중에는 `.on`이 아닌 요소만 흐려집니다. 일시정지했거나 처음 상태에서는 그림 전체와 라벨이 모두 선명하게 보입니다.
- `data-step`이 없는 요소(구역 테두리, 라벨)는 항상 그대로 보입니다.

## 3. 클래스

| 클래스 | 붙이는 곳 | 모양 |
|---|---|---|
| `box` | 노드 `rect` | 면 `--surface-2`, 선 `--line-2`. `.on`이면 강조색 |
| `t` | 노드 제목 `text` | 14px, 굵게 |
| `s` | 노드 보조 설명 `text` | 12px, `--text-2` |
| `m` | 화살표 라벨, 구역 이름 `text` | mono 11px, `--text-3` |
| `zone` | 구역 묶음 `rect` | 점선 테두리, 면 없음 |
| `zone-fill` | 구역 바탕 `rect`(선택) | 옅은 면 |
| `edge` | 움직이지 않는 연결선 `path` | 1.5px 선 |
| `flow` | 흐름을 보여 줄 연결선 `path` | 재생 중 `.on`이면 점선이 흐릅니다(`stroke-dashoffset` 키프레임) |
| `edge--dash` | 보조 경로(커밋, 폴백 같은 것) | 정지 상태에서도 점선 |
| `pkt` | 경로를 따라 움직이는 점 `circle` | 재생 중이고 `.on`일 때만 보입니다 |
| `ah` | 화살촉 marker 안의 `path` | `--text-3` 채움 |
| `ok`, `warn`, `bad` | 선에 의미색이 필요할 때 | 각각 `--ok`, `--warn`, `--bad` |
| `chip-r`, `chip-t` | 그림 안 작은 수치 칩의 `rect`, `text` | 강조색 옅은 바탕 |

## 4. 색

- 색은 CSS 변수로만 정합니다. `fill="#..."`, `stroke="#..."` 같은 고정 색을 쓰지 않습니다. 다크와 라이트 테마가 같은 SVG를 씁니다.
- 위 클래스로 대부분 해결됩니다. 꼭 필요하면 `style="stroke: var(--warn)"`처럼 변수만 씁니다.
- 쓸 수 있는 변수: `--text`, `--text-2`, `--text-3`, `--line`, `--line-2`, `--surface-2`, `--surface-3`, `--accent`, `--accent-ink`, `--accent-soft`, `--accent-line`, `--ok`, `--warn`, `--bad`.
- 강조색은 런타임이 단계 강조에 씁니다. 작성자가 특정 상자를 미리 강조색으로 칠하지 않습니다.

## 5. 크기와 여백

- `viewBox` 폭은 640~728로 잡습니다. 상세 본문 폭이 약 730px이라 데스크톱에서는 1단위가 거의 1px입니다.
- 바깥 여백: 가장 바깥 요소와 viewBox 경계 사이를 24 이상 둡니다. 구역 라벨이나 커밋선처럼 바깥으로 도는 선도 경계에서 12 이상 띄웁니다.
- `width`, `height` 속성은 쓰지 않습니다. CSS가 폭 100%로 맞춥니다.
- 화면이 좁으면 SVG가 최소 520px을 유지하고 그림 칸 안에서만 가로로 스크롤됩니다. 페이지 전체는 가로로 움직이지 않습니다. 더 좁게 써야 하는 그림은 figure에 `style="--dg-min: 440px"`처럼 줄입니다. 이때 글자가 너무 작아지지 않게 viewBox 폭도 같이 줄입니다.
- 글자 크기: 제목 14, 보조 12, 라벨 11. 이보다 작게 쓰지 않습니다.
- 노드 상자: 높이 60, 모서리 `rx="8"`. 제목 기준선은 상자 위에서 26, 보조는 46. 왼쪽 안쪽 여백 14.
- 상자 사이 가로 간격은 34 이상, 세로 간격은 90 이상. 화살표 라벨이 들어갈 자리를 남깁니다.
- 라벨은 선 위에 겹치지 않게 둡니다. 오른쪽 끝 라벨은 `text-anchor="end"`로 viewBox 밖으로 나가지 않게 합니다.

## 6. 화살촉과 id

- marker id는 figure id를 접두사로 붙입니다(`dg-stream-ah`). 한 페이지에 그림이 여러 개여도 겹치지 않습니다.
- 화살촉은 `markerUnits="userSpaceOnUse"`, 크기 8로 고정합니다. 선 굵기가 바뀌어도 화살촉 크기는 그대로입니다.
- 선 끝은 상자 경계에서 6 정도 앞에서 멈춥니다. 화살촉이 상자를 덮지 않습니다.

## 7. 움직이는 점

- `circle.pkt`에 SMIL `animateMotion`을 직접 넣습니다. 경로는 `mpath`로 `flow` 경로의 id를 가리킵니다.
- 점에도 `data-step`을 써서 그 단계에서만 보이게 합니다.
- `dur`는 1.2~2.4초. 긴 경로일수록 길게 줍니다. `repeatCount="indefinite"`.
- 런타임은 그림이 처음 뜰 때와 일시정지할 때 `pauseAnimations()`를 부릅니다. 작성자가 따로 멈출 필요는 없습니다.
- 동작 줄이기 설정(`prefers-reduced-motion`)이면 점은 숨겨지고 흐름 점선도 멈춥니다. 자동 재생도 하지 않습니다. 정적 그림과 단계 목록으로 읽힙니다.

## 8. 단계 문장

- 한 단계에 한 가지만 씁니다. 1~2문장, "~합니다/~입니다".
- 그림에 보이는 이름을 그대로 씁니다. 그림에 없는 부품 이름을 문장에 새로 꺼내지 않습니다.
- 단계는 3~7개로 둡니다.
- 수치를 쓰면 조건도 같이 씁니다. 예: "약 1분 (staging 합성 이벤트)".

## 9. 예시 조각

```html
<figure class="dg" id="dg-ex" data-steps='[
  {"t":"수신 서버가 (고객사, 세션)을 키로 Kafka에 씁니다."},
  {"t":"Flink가 세션 상태에서 중복을 지우고 결과 토픽에 씁니다."}
]'>
  <figcaption><span class="n">그림 2</span>수신에서 세션 집계까지</figcaption>
  <div class="dg__canvas">
    <svg viewBox="0 0 640 142" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="dg-ex-ah" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8"
                markerUnits="userSpaceOnUse" orient="auto-start-reverse">
          <path class="ah" d="M0 0L8 4L0 8z"/>
        </marker>
      </defs>

      <g data-step="1">
        <rect class="box" x="24" y="36" width="160" height="60" rx="8"/>
        <text class="t" x="38" y="62">Go 수신 서버</text>
        <text class="s" x="38" y="82">acks=all 뒤 200</text>
      </g>
      <g data-step="1,2">
        <rect class="box" x="240" y="36" width="160" height="60" rx="8"/>
        <text class="t" x="254" y="62">Kafka 원본 토픽</text>
        <text class="s" x="254" y="82">12 파티션</text>
      </g>
      <g data-step="2">
        <rect class="box" x="456" y="36" width="160" height="60" rx="8"/>
        <text class="t" x="470" y="62">Flink 세션 잡</text>
        <text class="s" x="470" y="82">중복 제거</text>
      </g>

      <path id="dg-ex-e1" class="flow" data-step="1" d="M184 66H234" marker-end="url(#dg-ex-ah)"/>
      <path id="dg-ex-e2" class="flow" data-step="2" d="M400 66H450" marker-end="url(#dg-ex-ah)"/>
      <text class="m" x="212" y="118" text-anchor="middle">key = (고객사, 세션)</text>

      <circle class="pkt" r="4" data-step="1">
        <animateMotion dur="1.2s" repeatCount="indefinite"><mpath href="#dg-ex-e1"/></animateMotion>
      </circle>
      <circle class="pkt" r="4" data-step="2">
        <animateMotion dur="1.2s" repeatCount="indefinite"><mpath href="#dg-ex-e2"/></animateMotion>
      </circle>
    </svg>
  </div>
</figure>
```

## 10. 넣기 전 확인

- [ ] figure `id`와 SVG 안 id 접두사가 같은가
- [ ] 고정 색(`#...`, `rgb(...)`)이 SVG에 남아 있지 않은가
- [ ] `data-steps`의 단계 수와 `data-step`에 쓴 가장 큰 번호가 맞는가
- [ ] 라벨이 viewBox 밖으로 나가거나 선과 겹치지 않는가
- [ ] 일시정지 상태에서 모든 상자와 라벨이 읽히는가
- [ ] 그림에 쓴 이름과 수치가 본문, 팩트시트와 같은가
