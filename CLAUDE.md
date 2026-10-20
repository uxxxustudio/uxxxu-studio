# 디자인 규칙 (현재 코드 기준)

이 문서는 `css/style.css`(메인 사이트)와 `case/css/style.css`(케이스 스터디 서브페이지)에
**실제로 쓰이고 있는** 값만 그대로 정리한 것입니다. 새로운 값을 만들지 않았습니다.

> 주의: 메인 페이지(`index.html`, `components/*.html`)는 `css/style.css`를,
> 케이스 스터디 페이지(`case/*.html`)는 `case/css/style.css`를 사용합니다. 두 파일은
> 같은 팔레트/폰트를 공유하지만 값이 100% 동일하지는 않으니 수정 시 대상 파일을 확인할 것.

## 1. 타이포 (폰트 · 크기 규칙)

- 기본 폰트: `"Pretendard", -apple-system, BlinkMacSystemFont, sans-serif` (body 전체)
- 강조용 세리프: `Georgia, "Times New Roman", serif` + `font-style: italic` — About 섹션 제목의
  `<span>` 강조 단어에만 한정적으로 사용 (`#about .about-copy h2 span` 등)
- letter-spacing은 전부 음수(타이트). 글자가 클수록 더 타이트:
  - 대형 헤딩: `-.045em ~ -.055em`
  - 본문: `-.02em ~ -.03em`
  - 라벨/카테고리: 양수 `.02em ~ .18em` (uppercase 라벨만 예외적으로 벌림)
- 실제 크기 스케일 (desktop 기준):
  | 용도 | font-size | weight | line-height |
  |---|---|---|---|
  | Hero h1 (`.hero h1`) | `clamp(72px, 7vw, 118px)` | 900 | .90 |
  | 섹션 대제목 (`.experience-heading h2`, `#portfolio .portfolio-heading h2`) | `64px` | 800 | 1 |
  | About h2 (`#about .about-copy h2`) | `clamp(46px, 4.6vw, 72px)` | 650 | .98 |
  | About h3 (`#about .about-copy h3`) | `clamp(42px, 4vw, 62px)` | 650 | 1 |
  | Project 리스트 타이틀 (`.project h2`) | `48px` | 800 | 1 |
  | Archive(More) 타이틀 (`.archive-content h3`) | `32px` | 700 | 1 |
  | Case 페이지 hero h1 (`case/css .hero h1`) | `clamp(74px, 8vw, 118px)` | 900 | .9 |
  | Case 페이지 overview h2 | `clamp(42px, 5vw, 64px)` | 800 | 1.2 |
  | 본문 설명 p (대부분) | `15px~18px` | 400 | 1.6~1.9 |
  | 라벨/이욱브라우/카테고리 (uppercase) | `11px~13px` | 500~700, letter-spacing `.14em~.18em` |
  | nav 링크 | `15px` | 500 |
  | 버튼 텍스트 (`.hero-btn`) | `13px` | 500 |
- 색은 구조상 역할별로 고정: 제목은 `#111`, 본문은 톤다운 그레이(아래 컬러 섹션 참고)

## 2. 컬러

실측 사용 빈도 상위 값 (`#` 값 기준):

| 값 | 용도 |
|---|---|
| `#111` | 기본 텍스트/헤딩, 버튼 primary 배경, 포인트 보더 |
| `#fff` | 배경(기본), 다크 배경 위 텍스트, 버튼 primary 텍스트 |
| `#888`, `#999` | 라벨/캡션/카테고리, 가장 약한 보조 텍스트 |
| `#777` | 본문 설명(p), 중간 보조 텍스트 |
| `#666` | 본문 설명(case 페이지), 링크 비활성 |
| `#555` | hover 시 본문 텍스트(진하게), 서브타이틀 |
| `#ececec`, `#e5e5e5`, `#eeeeee` | 구분선(border-top/bottom), 카드 보더 |
| `#d8d8d8`, `#dcdcdc` | 얇은 구분선(타임라인, 아이템 간 보더) |
| `#f7f7f7`, `#fafafa` | 카드/모바일 포트폴리오 아이템 배경 |

- 다크 섹션은 케이스 스터디 footer(`case/css`)뿐: `background:#111; color:#fff;`
- 텍스트 그레이 단계는 숫자가 클수록(`#999`→`#555`) 더 진하고, hover 시 한 단계 진해지는 패턴이 일관적으로 쓰임
  (예: `.project p` 기본 `#777` → hover `#444`)
- `::selection { background:#111; color:#fff; }`

## 3. 간격 (Spacing)

- `.container` / `#portfolio .container`: `max-width: 1280px; margin: auto;`
- 섹션 기본 패딩: `section { padding: 100px 64px; }`
- 섹션별 override (desktop):
  - `#experience`: `300px 64px 120px` (3D 오브젝트 공간 확보용 top 여유)
  - `#portfolio`, `#about`: `120px 64px`
  - `footer`: `40px 64px`
- 헤딩 블록 내부 margin 패턴:
  - 대제목 → 본문: `margin: 0 0 36px` (heading) / `margin: 0` (p)
  - 헤더 블록 → 그리드: `margin-bottom: 110px` / `margin-top: 110px`
  - 소제목 → 본문: `margin: 16px 0 0` (예: `.project p`, `.archive-content p`)
- 아이템 간 gap:
  - `.experience-keywords`: `gap: 8px`
  - `.project + .project`: `margin-top: 18px`
  - `#about .about-wrap`: `gap: 80px`
  - `.insight-grid`, `case .overview-grid`: `gap: 16px~28px`
- border-radius:
  - `999px` — pill 버튼 (`.hero-btn`, `.experience-mobile-career a`)
  - `18px~28px` — 카드/이미지 (`#portfolio .project`(mobile), `.hero-image`, `.overview-card`)
  - `50%` — 도트/원형 (`.about-timeline-point`)
- 공용 transition 곡선: `cubic-bezier(.2,.7,.2,1)` — 거의 모든 hover 이동/크기 애니메이션에
  반복 사용되는 표준 easing (duration은 보통 `.35s~.5s`). 보조 easing은 `ease` (`.2s~.35s`, 주로
  color/opacity 전환).

## 4. 공통 컴포넌트

- **Header** (`header`): `position: fixed`, `padding: 34px 64px`, 스크롤 시 `.active` 클래스로
  `backdrop-filter: blur(20px) saturate(180%)` + 반투명 흰 배경 적용. `.logo`는 `30px / 900`.
- **Nav**: `gap: 44px`, 링크 `15px/500`, hover 시 `opacity: .45`로만 반응 (색 변경 없음).
- **Pill 버튼** (`.hero-action .hero-btn`): `height: 46px`, `border-radius: 999px`,
  `border: 1px solid #111`, `font-size: 13px/500`.
  - Primary: 배경 `#111` / 텍스트 `#fff`, hover 배경 `#333`
  - Secondary: 배경 `#fff` / 텍스트 `#111`, hover 배경 `#111` / 텍스트 `#fff`
  - 공통 hover: `transform: translateY(-2px)`
- **Project 리스트 아이템** (`.project`): grid 레이아웃, hover 시
  `padding-left/right` 확장 + 텍스트 `translateX(10px)` 이동, 리스트 내 비hover 항목은
  `opacity: .38`로 흐려짐(포커스 효과).
- **Archive("더보기") 링크** (`.project-archive` / `.archive-arrow`): 화살표는
  `position: absolute`로 두고 hover 시 `transform`으로만 이동(색/크기 불변), 전체 블록은
  `translateY(-4px)`로 살짝 떠오름.
- **Timeline dot** (`.about-timeline-point`): `10px`, `border-radius:50%`, hover 시
  `scale(1.45)`.
- **Overview card** (case 페이지, `.overview-card`): `padding: 30px 36px`,
  `border: 1px solid #ececec`, `border-radius: 20px`, `background: #fafafa`.
- **Footer**: 메인은 `border-top: 1px solid #ececec` + 좌우 flex, 케이스 페이지는
  `background:#111; color:#fff;` 센터 정렬.

## 5. 반응형 기준

- **Desktop**: 기본값 (980px 초과)
- **Tablet** — `@media (max-width: 980px)`: 헤더 `padding: 26px`로 축소, nav가 토글 드롭다운으로
  전환(`.menu-toggle` 노출), 섹션 패딩 `120px 26px`
- **Mobile** — `@media (max-width: 767px)`: 구조 자체가 달라지는 지점.
  - Experience는 `.experience-desktop` → `.experience-mobile`로 완전히 다른 레이아웃 전환
  - Portfolio는 `.project`가 카드형(`background:#f7f7f7; border-radius:18px;`)으로 변경
  - About은 `grid-template-columns`가 1열로 축소
- **Reduced motion** — `@media (prefers-reduced-motion: reduce)`: `.hero-light`, `.hero-3d`
  애니메이션 전부 제거 (`animation: none`)
- 케이스 스터디 페이지(`case/css/style.css`)는 980px 기준 단일 브레이크포인트만 사용(767px 전용
  규칙 없음) — 메인 사이트보다 단순한 반응형 구조.

## 6. 작업 원칙

**이후 모든 수정은 이 규칙을 따를 것.**

- 새 색상·폰트 크기·간격 값을 임의로 추가하지 말고, 위에 정리된 기존 팔레트/스케일/컴포넌트
  패턴을 그대로 재사용한다.
- 꼭 새로운 값이 필요하면, 가장 가까운 기존 값을 쓰거나 기존 패턴의 비율을 따른다
  (예: 헤딩은 음수 letter-spacing이 글자 크기에 비례해 커짐, hover 이동은
  `cubic-bezier(.2,.7,.2,1)` easing 사용).
- 메인 사이트(`css/style.css`)와 케이스 스터디(`case/css/style.css`)는 서로 다른 파일이므로,
  수정 대상 페이지가 어느 쪽 CSS를 쓰는지 먼저 확인하고 해당 파일만 수정한다.
- 특정 요소만 고쳐달라는 요청에는 그 요소의 선택자만 수정하고, 같은 파일의 다른 규칙은
  건드리지 않는다.
