# 🕹️ Souless - 2D Roguelike Action Game

<div align="center">

**하나의 영혼, 일곱 개의 육체**  
Phaser3 기반의 멀티 캐릭터 로그라이크 액션 게임

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Phaser3](https://img.shields.io/badge/Phaser-3.80-blue)](https://phaser.io/)
[![Electron](https://img.shields.io/badge/Electron-Latest-47848F)](https://www.electronjs.org/)

[🎮 플레이하기](#-실행-방법) · [📖 문서](#-게임-시스템) · [🛠️ 기술 스택](#️-기술-스택)

</div>

---

## 📖 프로젝트 소개

**Souless**는 하나의 영혼이 여러 육체를 넘나들며 성장하는 2D 로그라이크 액션 게임입니다.  
플레이어는 기본 캐릭터 'Soul'을 포함한 **7명의 캐릭터**를 해금하고, 각 캐릭터마다 고유한 **4개의 스킬**을 획득하며, **13개의 맵**을 탐험하고 **보스**를 처치해 최종 보스에 도전합니다.

## 💭 왜 이 프로젝트를 시작했나

### 개인적 동기

이 프로젝트는 단순한 과제가 아닌, **몇 달 전부터 준비해온 개인적 도전**이었습니다.

- **모션그래픽 디자이너 → 개발자**: 시각적 결과물이 인터랙티브하게 반응하는 것에 대한 오랜 관심
- **이전 경험의 연장**: 유니티 기반 FPS 게임 '빤스런' 제작 경험을 웹 게임으로 확장
- **JavaScript로 게임 만들기**: 내가 가장 자신있는 언어로 완전히 새로운 영역에 도전

### 기술적 도전

- Phaser3, Tiled, 애니메이션 시스템 등 **모든 기술 스택이 처음**
- 복잡한 상태 관리와 물리 엔진 선택의 어려움
- 1인 개발에서의 에셋 제작 파이프라인 구축

### 증명 가능한 도전

이 프로젝트가 진짜 도전이었다는 것은:

1. **몇 달 전 기획 문서**: 준비 과정의 흔적
2. **상세한 커밋 로그**: 100+ 커밋으로 기록된 시행착오
3. **완성된 시스템**: 7개 캐릭터 x 4개 스킬 x 13개 맵의 복합 시스템 구현

### 🎯 핵심 특징

- **멀티 캐릭터 시스템**: 7명의 캐릭터, 각각 고유한 플레이 스타일과 스킬
- **듀얼 레벨링**: 전체 레벨과 캐릭터별 레벨이 동시에 성장
- **조건부 캐릭터 해금**: 특정 플레이 스타일을 달성해야 캐릭터 보스 출현
- **단계별 보스 전투**: 페이즈 시스템을 갖춘 복잡한 보스 AI
- **히트 스톱 시스템**: 타격감을 극대화하는 정교한 피드백 메커니즘
- **포털 기반 진행**: 조건을 만족해야 다음 맵으로 이동 가능

---

## 📸 게임 화면

<div align="center">

### 메인 메뉴

<img src="docs/images/main_menu.png" width="600"/>

### 게임플레이

<img src="docs/images/gameplay.png" width="600"/>

### 보스 전투

<img src="docs/images/boss_fight.png" width="600"/>

### 캐릭터 선택

<img src="docs/images/character_select.png" width="600"/>

</div>

---

## 🎮 게임 시스템

### 플레이 루프

```
몬스터 처치 → 경험치 획득 → 레벨업 → 스킬 해금
              ↓
      포털 조건 달성 → 다음 맵 이동
              ↓
      캐릭터 해금 조건 달성 → 캐릭터 보스 출현 → 캐릭터 획득
              ↓
      6개 보스 처치 → 중간 보스 → 최종 보스
```

### 캐릭터 시스템

#### 플레이어블 캐릭터 (7명)

| 캐릭터          | 해금 조건                   | 플레이 스타일 |
| --------------- | --------------------------- | ------------- |
| **Soul**        | 기본 캐릭터                 | 기본형        |
| **Assassin**    | 15초간 피격 없이 생존       | 고속 기동형   |
| **Monk**        | 10초간 공격 없이 생존       | 방어/회복형   |
| **Bladekeeper** | 2초 내 5회 연속 타격        | 콤보 특화형   |
| **Fire Knight** | 10초간 지속 전투            | 화력 특화형   |
| **Mauler**      | 체력 30% 이하에서 15초 생존 | 버서커형      |
| **Princess**    | 20초간 무피해 생존          | 근거리 마법형 |

#### 스킬 해금 구조

- **레벨 10**: Q 스킬 해금
- **레벨 20**: W 스킬 해금
- **레벨 30**: E 스킬 해금 (채널링 스킬)
- **레벨 40**: R 스킬 해금 (궁극기)

### 레벨링 시스템

#### 듀얼 레벨 구조

게임은 두 가지 독립적이면서도 연관된 레벨 시스템을 운영합니다:

**1. 전체 레벨 (Total Level)**

- 모든 캐릭터가 공유하는 계정 레벨
- 포털 해금 조건으로 사용
- 레벨업 시 현재 플레이 중인 캐릭터의 스탯 영구 증가

**2. 캐릭터 레벨 (Character Level)**

- 각 캐릭터마다 독립적인 레벨
- 해당 캐릭터의 스킬 해금에 사용
- 캐릭터별 성장 추적

#### 경험치 곡선

```javascript
// 기본 요구 경험치: 100
// 일반 레벨: 이전 레벨 × 1.1 (10% 증가)
// 10레벨 단위: 이전 레벨 × 1.5 (50% 추가 증가)

레벨 1→2: 100 경험치
레벨 2→3: 110 경험치
레벨 9→10: 195 경험치
레벨 10→11: 293 경험치 (50% 추가)
```

#### 스탯 성장

전체 레벨 상승 시 현재 캐릭터가 받는 보너스:

| 스탯      | 일반 레벨당 | 10레벨 단위 |
| --------- | ----------- | ----------- |
| 최대 체력 | +5%         | +10%        |
| 최대 마나 | +3%         | +10%        |
| 공격력    | +0.1        | +0.5        |
| 방어력    | +0.1        | +0.5        |

### AI 시스템

#### 일반 몹 AI (EnemyController)

- **패트롤 모드**: 지정된 범위 내 무작위 이동
- **감지 범위** (detectRange): 플레이어 인식
- **추격 모드**: 플레이어를 향해 이동
- **공격 범위** (attackRange): 범위 내 진입 시 공격

#### 보스 AI (BossController)

보스는 훨씬 더 정교한 행동 패턴을 가집니다:

**거리 기반 행동**

- **detectRange**: 보스가 플레이어를 인식하는 최대 거리
- **runRange**: 이 거리 내에서는 달려옴
- **walkRange**: 이 거리 내에서는 걸어옴
- **attackRange**: 각 공격/스킬마다 개별 설정

**스킬 우선순위 시스템**

```javascript
// 보스는 현재 거리에서 사용 가능한 스킬 중
// 가장 높은 우선순위(priority)의 스킬을 선택
// 쿨타임과 범위를 모두 고려

예: 원거리에서는 투사체 공격
    근거리에서는 근접 공격
```

**페이즈 시스템**

- 보스 체력이 특정 임계값 이하로 떨어지면 페이즈 전환
- 페이즈 전환 시 무적 상태 + 배경 효과
- 페이즈마다 속도, 스킬 쿨타임, 공격 패턴 변경

### 히트박스 시스템

모든 공격과 스킬은 데이터 기반 히트박스로 구현됩니다:

```javascript
{
  damage: 10,              // 피해량
  width: 100,              // 너비
  height: 80,              // 높이
  offsetX: 50,             // X 오프셋
  offsetY: 0,              // Y 오프셋
  duration: 200,           // 지속 시간 (ms)
  movement: {              // 투사체용
    speed: 300,
    direction: 'forward'
  },
  knockback: 150,          // 넉백 거리
  hitstop: 'HEAVY'         // 히트스톱 프리셋
}
```

**히트박스 시퀀스** (hitboxSequence)

- 하나의 스킬에 시간차를 둔 여러 히트박스 배치 가능
- 복잡한 콤보 공격 구현 (예: 돌진 → 폭발)

### 히트 스톱 시스템

타격감을 극대화하기 위한 정교한 피드백 시스템:

#### 효과 종류

- **시간 지연** (Time Dilation): 게임 속도를 느리게 또는 정지
- **카메라 흔들림**: 타격 강도에 따른 화면 진동
- **줌 펄스**: 일시적인 확대/축소
- **화면 플래시**: 순간적인 색상 효과
- **방향성 쉐이크**: 공격 방향으로 화면 밀림

#### 프리셋 예시

| 프리셋              | 지속시간 | 강도     | 용도      |
| ------------------- | -------- | -------- | --------- |
| LIGHT               | 50ms     | 0.4      | 기본 공격 |
| HEAVY               | 150ms    | 0 (정지) | 강공격    |
| CRITICAL            | 200ms    | 0        | 치명타    |
| FIREKNIGHT_ULTIMATE | 300ms    | 0        | 궁극기    |
| BOSS_HEAVY          | 200ms    | 0        | 보스 공격 |

### 맵 및 포털 시스템

#### 맵 진행 순서

```
other_cave → scary_cave → cave → dark_cave → forest → oakwood →

temple_way → temple_1 → temple_2 → temple_3 → temple_4 →

dark (중간 보스) → final_map (최종 보스)
```

#### 포털 해금 조건

| 조건 타입            | 설명                                | 예시                          |
| -------------------- | ----------------------------------- | ----------------------------- |
| **kill_count**       | 해당 맵의 각 몹 유형을 일정 수 처치 | other_cave의 모든 몹 10마리씩 |
| **boss_count**       | 특정 수의 보스 처치                 | 2마리 이상의 보스 처치        |
| **total_level**      | 전체 레벨 도달                      | 레벨 60 달성                  |
| **character_levels** | 모든 캐릭터 레벨 도달               | 모든 캐릭터 레벨 50           |
| **level_and_boss**   | 복합 조건                           | 캐릭터 레벨 40 + 준보스 처치  |

### 전투 시스템

#### 스킬 타입

- **Melee**: 근접 공격
- **Instant**: 즉발 효과
- **Movement**: 이동 기술 (대시 등)
- **AOE**: 범위 공격
- **Channeling**: 지속 시전 (E 스킬)

#### 채널링 스킬

모든 캐릭터의 E 스킬은 채널링 방식:

- 최대 시전 시간 설정 가능
- 시전 중 버프 적용 (현재: 체력/마나 회복)
- 애니메이션과 동기화
- 중단 가능

#### 쿨타임 시스템

- 스킬 사용 **완료 시점**부터 쿨타임 시작
- 캐릭터 전환 시 쿨타임 데이터 저장/복원
- UI에 실시간 쿨타임 표시

---

## 🎨 기술적 특징

### 아키텍처

```
┌─────────────────┐
│   Game Scene    │  ← 게임 진행 총괄
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────────┐
    │         │          │              │
┌───▼───┐ ┌──▼──┐  ┌────▼─────┐  ┌────▼─────┐
│Player │ │Enemy│  │Portal    │  │Hitstop   │
│System │ │ AI  │  │Condition │  │Manager   │
└───┬───┘ └──┬──┘  └────┬─────┘  └────┬─────┘
    │        │          │              │
┌───▼────────▼──────────▼──────────────▼───┐
│         Data Layer (JSON Config)         │
│  characterData │ enemiesData │ mapData   │
└──────────────────────────────────────────┘
```

### 데이터 중심 설계

게임 요소는 JSON 설정 파일로 관리:

```javascript
// src/config/characterData.js
export const characterData = {
  soul: {
    sprite: { width: 64, height: 64, scale: 1.5 },
    stats: { maxHP: 100, speed: 150, strength: 10 },
    skills: {
      attack: { damage: 15, cooldown: 500, hitstop: 'LIGHT' },
      q: {
        /* Q 스킬 데이터 */
      },
      // ...
    },
  },
};

// src/config/enemiesData.js
export const enemiesData = {
  assassin_boss: {
    type: 'boss',
    stats: { maxHP: 1000, speed: 120 },
    ai: {
      type: 'boss',
      detectRange: 400,
      runRange: 350,
      walkRange: 200,
      maxPhase: 3,
      phaseThresholds: [0.66, 0.33],
      skills: [
        /* 스킬 목록 */
      ],
    },
  },
};
```

### 상태 관리 시스템

**StateMachine 기반 캐릭터 상태**

```javascript
states: {
  idle: { animation: 'idle', canTransition: ['run', 'attack', 'jump'] },
  run: { animation: 'run', canTransition: ['idle', 'attack', 'jump'] },
  attack: { animation: 'attack', canTransition: ['idle'], locked: true },
  hit: { animation: 'hit', canTransition: ['idle'], locked: true }
}
```

### 애니메이션 동기화

**프레임 기반 정확한 타이밍**

```javascript
// frameRate로 duration 자동 계산
animation: {
  frameRate: 10,
  frames: 8
  // → duration = 800ms (자동 계산)
}

// 히트박스 타이밍도 프레임 단위로 정확하게 설정
hitboxSequence: [
  { frame: 3, /* 3번째 프레임에 히트박스 */ },
  { frame: 6, /* 6번째 프레임에 히트박스 */ }
]
```

### 캐릭터 전환 시스템

- 실시간 캐릭터 전환 (` 키)
- 전환 시 모든 상태 저장 (HP, MP, 쿨타임, 버프 등)
- 각 캐릭터의 독립적인 레벨 및 경험치
- SelectOverlay UI로 직관적인 선택

---

## 🛠️ 기술 스택

| 분류            | 기술                    |
| --------------- | ----------------------- |
| **게임 엔진**   | Phaser 3.80.1           |
| **프레임워크**  | Electron                |
| **빌드 도구**   | Vite 5.x                |
| **언어**        | JavaScript (ES6+)       |
| **아키텍처**    | Entity-Component System |
| **상태 관리**   | State Machine Pattern   |
| **데이터 관리** | JSON Configuration      |

### 주요 라이브러리

```json
{
  "phaser": "^3.80.1",
  "electron": "^latest",
  "vite": "^5.0.0"
}
```

---

## 📂 프로젝트 구조

```
souless/
├── src/
│   ├── config/              # 게임 데이터 설정
│   │   ├── characterData.js      # 캐릭터 스탯/스킬
│   │   ├── enemiesData.js        # 적 AI/스탯
│   │   ├── mapData.js            # 맵 구조
│   │   ├── portalData.js         # 포털 연결
│   │   └── hitStopPresets.js     # 히트스톱 설정
│   │
│   ├── controllers/         # 게임 매니저
│   │   ├── CameraManager.js      # 카메라 제어
│   │   ├── CollisionManager.js   # 충돌 처리
│   │   ├── EnemyManager.js       # 적 스폰/관리
│   │   └── PortalManager.js      # 포털 시스템
│   │
│   ├── entities/            # 게임 엔티티
│   │   ├── characters/
│   │   │   ├── Player.js             # 플레이어 베이스
│   │   │   ├── systems/
│   │   │   │   ├── LevelSystem.js        # 레벨링
│   │   │   │   ├── CharacterSkillSystem.js  # 스킬 관리
│   │   │   │   └── StateMachine.js       # 상태 관리
│   │   │   └── jobs/
│   │   │       ├── Soul.js
│   │   │       ├── Assassin.js
│   │   │       └── ...
│   │   │
│   │   └── enemies/
│   │       ├── base/
│   │       │   └── EnemyBase.js      # 적 베이스 클래스
│   │       ├── systems/
│   │       │   ├── EnemyController.js    # 일반 적 AI
│   │       │   ├── BossController.js     # 보스 AI
│   │       │   ├── EnemyAttackSystem.js  # 공격 시스템
│   │       │   └── EnemySkillSystem.js   # 스킬 시스템
│   │       └── types/
│   │           ├── Slime.js
│   │           ├── Bat.js
│   │           └── ...
│   │
│   ├── models/              # 데이터 모델
│   │   ├── MapModel.js           # 맵 렌더링
│   │   ├── Portal.js             # 포털 객체
│   │   └── Skill.js              # 스킬 모델
│   │
│   ├── scenes/              # Phaser 씬
│   │   ├── MainMenuScene.js      # 메인 메뉴
│   │   ├── IntroScene.js         # 인트로
│   │   ├── GameScene.js          # 게임 플레이
│   │   ├── EndingScene.js        # 엔딩
│   │   └── TutorialScene.js      # 튜토리얼
│   │
│   ├── systems/             # 전역 시스템
│   │   ├── HitstopManager.js             # 히트스톱
│   │   ├── PortalConditionManager.js    # 포털 조건
│   │   ├── JobConditionTracker.js       # 캐릭터 해금 조건
│   │   └── InputManager.js              # 입력 관리
│   │
│   ├── ui/                  # UI 컴포넌트
│   │   ├── SkillBar.js           # 스킬 UI
│   │   ├── SelectOverlay.js      # 캐릭터 선택
│   │   └── HPBar.js              # 체력 바
│   │
│   ├── views/               # 뷰 레이어
│   │   ├── PlayerView.js         # 플레이어 렌더링
│   │   ├── EnemyView.js          # 적 렌더링
│   │   └── FXManager.js          # 이펙트 관리
│   │
│   ├── utils/               # 유틸리티
│   │   ├── AssetLoader.js        # 에셋 로딩
│   │   ├── SaveManager.js        # 세이브 관리
│   │   └── PortalHelper.js       # 포털 헬퍼
│   │
│   ├── renderer/            # 렌더링 진입점
│   │   ├── index.js
│   │   └── index.html
│   │
│   └── assets/              # 게임 에셋
│       ├── images/
│       ├── sounds/
│       └── fonts/
│
├── main.js                  # Electron 메인 프로세스
├── preload.js               # Electron 프리로드
├── package.json
├── vite.config.js
└── README.md
```

---

## 🚀 실행 방법

### 사전 요구사항

- Node.js 16.x 이상
- npm 또는 yarn

### 설치

```bash
# 저장소 클론
git clone https://github.com/yourusername/souless.git
cd souless

# 의존성 설치
yarn install
# 또는
npm install
```

### 개발 모드 실행

```bash
# 브라우저 + Electron 동시 실행
yarn dev

# 브라우저만 실행
yarn dev:web
```

브라우저에서 `http://localhost:5173` 접속

### 빌드 및 패키징

```bash
# Vite 빌드
yarn build

# Electron 앱 패키징
yarn dist
```

패키징된 실행 파일은 `dist/` 폴더에 생성됩니다.

---

## 🎮 조작 방법

| 키        | 동작                           |
| --------- | ------------------------------ |
| **← / →** | 좌우 이동                      |
| **Space** | 점프                           |
| **A**     | 기본 공격                      |
| **Q**     | Q 스킬 (레벨 10 해금)          |
| **W**     | W 스킬 (레벨 20 해금)          |
| **E**     | E 스킬 - 채널링 (레벨 30 해금) |
| **R**     | R 스킬 - 궁극기 (레벨 40 해금) |
| **`**     | 캐릭터 선택 (Hold)             |
| **ESC**   | 일시정지 / 메뉴                |

---

## 🎯 게임 팁

1. **다양한 캐릭터의 성장**: 각 캐릭터마다의 스킬은 레벨업이 되어야 해금됩니다
2. **캐릭터 해금 조건을 의식하며 플레이**: 특정 플레이 스타일로 조건을 달성하세요
3. **E 스킬로 회복**: 전투 중 안전한 타이밍에 채널링으로 체력/마나 회복
4. **보스 페이즈 파악**: 보스 체력 구간에 따라 패턴이 바뀝니다
5. **히트박스 타이밍 익히기**: 각 스킬의 히트박스 발동 시점을 익히면 콤보가 가능합니다

---

## 📊 개발 통계

- **총 개발 기간**: 25.11.04 ~ 25.11.24
- **캐릭터 수**: 7개 (각 4개 스킬)
- **적 타입**: 4+ 종류
- **보스**: 8개 (페이즈 시스템 포함)
- **맵**: 13개
- **이펙트 프리셋**: 20+

---

## 🔧 개발 과정에서의 도전과 해결

### 1. 애니메이션 동기화 문제

**문제**: duration과 frameRate를 함께 사용하니 로직이 꼬임

**해결**: frameRate로 duration을 자동 계산하는 방식으로 변경

```javascript
// Before: duration과 frameRate 충돌
duration: 800,
frameRate: 10

// After: frameRate만 사용, duration 자동 계산
frameRate: 10,
frames: 8
// duration = frames / frameRate * 1000 = 800ms
```

### 2. 캐릭터 전환 입력 불안정

**문제**: ` 키 hold 방식에서 키보드 입력 인식 오류로 SelectOverlay가 의도치 않게 닫힘

**해결**: keyboard down/up 이벤트 기반으로 변경하여 안정성 확보

### 3. 히트박스 타이밍 정확도

**문제**: 애니메이션과 히트박스 발동 시점 불일치

**해결**: hitboxSequence에 duration을 추가해 프레임 단위로 정확한 타이밍 제어

### 4. 보스 AI 복잡도

**문제**: 거리별 행동, 스킬 우선순위, 페이즈 전환을 모두 관리해야 함

**해결**: BossController를 EnemyController에서 확장하고, 데이터 기반으로 모든 로직을 설정 가능하게 구현

### 5. Arcade Physics ↔ Matter.js 엔진 전환 실패와 회귀

**문제**:

- 초기에 더 정교한 충돌 판정을 위해 Matter.js로 전환 시도
- 하지만 Matter.js는 학습 곡선이 가파르고 설정이 복잡했음
- 바디 생성, 복합 바디, 충돌 필터 등 개념이 Arcade와 완전히 달라 마이그레이션 비용이 예상보다 컸음

**시행착오**:

```javascript
// Matter로 전환 시도했을 때의 복잡도
// 단순 충돌 체크도 여러 설정이 필요
const body = this.matter.add.sprite(x, y, 'player');
body.setBody({
  type: 'rectangle',
  width: 32,
  height: 48,
});
body.setCollisionCategory(playerCategory);
body.setCollidesWith([enemyCategory, wallCategory]);
// ... 더 많은 설정들
```

**해결**:

- 게임의 실제 요구사항 재분석: 복잡한 물리 시뮬레이션보다는 빠른 반응과 많은 객체 처리가 중요
- Arcade Physics로 회귀하되, 충돌 로직을 더 정교하게 개선
- "과한 솔루션보다 적절한 솔루션" 선택의 중요성 학습

### 6. 에셋 파이프라인 구축 (itch.io + AI + Pixellab)

**문제**:

- 1인 개발에서 일관성 있는 게임 아트 제작이 가장 큰 병목
- itch.io 무료 에셋만으로는 컨셉에 맞는 통일된 스타일 확보 어려움

**해결**:

1. **AI 이미지 생성 활용**

   - Claude, ChatGPT, Gemini를 활용한 컨셉 아트 생성
   - 반복적 프롬프트 개선으로 원하는 스타일 도출
   - 예: "pixel art style, dark fantasy, character sprite" 등

2. **Pixellab을 통한 픽셀화**

   - AI 생성 이미지를 게임에 맞는 픽셀 아트로 변환
   - 디테일 조정 및 게임 도트 스타일 통일

3. **하이브리드 워크플로우 확립**

```
   itch.io 에셋 (베이스)
     → AI 생성 (부족한 부분)
     → Pixellab (픽셀화)
     → 게임 통합
```

**결과**:

- 에셋 제작 시간 70% 단축
- 스타일 통일성 확보
- AI를 협업 도구로 활용하는 경험 획득

### 7. 개발 동기 유지와 몰입 경험

**문제**:

- 긴 개발 기간 동안 동기 유지가 어려울 수 있음
- 혼자서 모든 것을 결정하고 구현하는 부담

**나만의 해결책**:

- **가시적 결과물**: 스킬 하나를 완성할 때마다 실제로 플레이하며 즐거움 확인
- **몰입**: 시간 개념이 사라지는 코딩 경험을 여러 번 체험
- **실패를 퍼즐로**: 버그를 문제가 아닌 "풀어야 할 재미있는 퍼즐"로 인식

**인사이트**:

> "개발 과정 자체를 즐기는 것이 지속 가능한 동력이었다.

---

## 🚧 향후 개선 사항

### 밸런싱

- [ ] 캐릭터별 기본 스탯 차별화
- [ ] 스킬별 데미지/마나 소모량 조정
- [ ] 보스 난이도 곡선 조정

### 콘텐츠

- [ ] 추가 맵 및 바이옴
- [ ] 더 많은 보스 패턴
- [ ] 히든 캐릭터 시스템

### 시스템

- [ ] 장비/아이템 시스템
- [ ] 랭킹 시스템
- [ ] 업적 시스템
- [ ] 사운드 믹싱 개선

### 구조 개선 (단기)

- [ ] 폴더 구조 재정리: 역할 기반 디렉토리 체계 구축
  - Skill/, Effect/, Manager/ 등으로 명확한 분리
  - 공통 유틸 함수 utils/ 하위에 통합
- [ ] Scene 간 리소스 공유 최적화
  - 전역 상태 의존성 최소화
  - 이벤트 기반 통신으로 전환 검토
- [ ] 코드 중복 제거
  - 애니메이션 처리 로직 통합
  - 충돌 계산 보조 함수 공통화

### 아키텍처 개선 (중기)

- [ ] 클래스 설계 재검토
  - Manager 책임 분리 및 단일 책임 원칙 적용
  - 의존성 주입 패턴 도입
- [ ] 핵심 시스템 모듈화
  - 스킬 시스템의 독립적 모듈화
  - 충돌 처리 시스템 추상화
- [ ] 이벤트 기반 아키텍처 도입
  - Scene 간 강결합 해소
  - 확장 가능한 이벤트 시스템 구축

### 테스트 및 품질 (장기)

- [ ] 테스트 프레임워크 구축
  - 경계 케이스 테스트 (입력 밀림, 다중 입력)
  - 상태 전환 시나리오 테스트
  - 동시 충돌 상황 테스트
- [ ] 성능 프로파일링 및 최적화
  - 다수 적/이펙트 출현 시 프레임 드랍 해결
  - 메모리 누수 체크 및 최적화
- [ ] 에러 핸들링 강화
  - 예외 상황에 대한 안전장치 추가

---

## 🤝 기여

이 프로젝트는 학습 목적으로 제작되었습니다.  
버그 리포트나 제안은 이슈로 등록해주세요!

---

## 📄 라이선스

MIT License - 자유롭게 사용하세요!

---

## 👤 제작자

**[Jayden]**

- GitHub: [@dudejrtjdrp](https://github.com/dudejrtjdrp)
- Email: dudejrtjdrp@naver.com

---

## 🙏 감사의 말

- Electron 문서
- 게임 에셋 제공자들

---

<div align="center">

**⭐ 이 프로젝트가 도움이 되었다면 Star를 눌러주세요! ⭐**

Made with ❤️ and ☕

</div>
