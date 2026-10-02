# UMA TRAINER GUIDE HANDOFF V7.71.1

작성일: 2026-10-02  
현재 앱 버전: **V7.71.1 WEB**

## 1. 현재 기준
- 저장소: `cbh8567-art/uma-trainer-guide`
- 브랜치: `main`
- 현재 저장소 HEAD 확인 시점: `164a320bcf2f...` (`V6.1: update automated validation reports`)
- V7.71.1 앱 커밋: `18accdaa6bbda60e160d5f2c6a87e1a42def6abf`
- V7.71.1 브라우저 smoke 검증 커밋: `d335128ad27273ea9419d9238e0fe8499484ed46`
- JP sync push-race 보강 커밋: `8448a027145650c6e564ae886de81c090381c2a2`

## 2. 이번 단계에서 완료한 작업

### JP 자동 동기화 복구
기존 JP sync 실패 원인은 검수 완료 수동 보강 데이터를 upstream 삭제로 오인한 것이었다.

보존 대상으로 명시한 레코드:
- supports: `30321`
- events:
  - `evt_30319_verified_final`
  - `evt_30320_verified_final`
  - `evt_30321_verified_final`

`data/jp/sync_policy.json`의 `preserveSnapshotRecords`와
`scripts/sync-jp-data.mjs`의 보존 병합 로직을 통해 처리한다.

중요: mass deletion guard 자체는 완화하거나 제거하지 않았다.

검증:
- JP validated data sync run `36973828807`: SUCCESS
- 이후 V7.71.0 앱 변경에 대한 JP validated data sync `36974094299`: SUCCESS

### 계승 고유기 적합도 V1
V7.71.0부터 기존 외부 추천 스냅샷만 보여주던 구조를 자체 엔진 + 외부 비교 구조로 변경했다.

추가된 핵심:
- `inheritanceEngineAssessment()`
- `inheritanceExternalKinds()`
- `inheritanceReviewEntry()`
- `inheritanceRowsForOwner()`
- 부모 선택 화면에 자체 엔진 점수 / 외부 등재 / 검수 상태 표시
- V7 가이드의 고유기 계승 추천에도 자체 엔진과 외부 추천을 분리 표시

원칙:
- 외부 공략 추천은 자체 엔진 점수에 직접 합산하지 않는다.
- 현재 V1은 구조화된 바장/거리/각질 태그를 우선 사용한다.
- 근거가 부족하면 낮은 신뢰도로 표시하고 억지로 강한 점수를 만들지 않는다.

검수 레지스트리:
- `data/jp/inheritance_review.json`
- 상태: `unreviewed`, `comparing`, `reviewed`
- 향후 사람이 검수한 score / adjustment / note를 저장하는 용도

### 계승 고유기 적합도 V1.1
V7.71.1에서 검증된 효과 메타데이터를 별도 레이어로 분리했다.

추가 파일:
- `data/jp/inheritance_effects.json`

지원 필드:
- `effectType`
- `phase`
- `trigger`
- `inheritedEffect`
- `courseNotes`
- `status`
- `source`

중요 원칙:
- 검증되지 않은 효과/발동 위치/계승 효과량은 entries에 넣지 않는다.
- 현재 파일은 스키마/레이어를 먼저 만든 상태이며, entries는 검증 후 채운다.
- 엔진은 effect metadata가 있을 때만 추가 근거로 사용한다.
- 외부 공략 추천은 계속 비교용으로만 사용한다.

추가 함수:
- `inheritanceEffectEntry()`
- `inheritanceReviewSummary()`

가이드 화면에:
- 전체 후보 수
- 검수 완료 수
- 비교 중 수
를 표시한다.

## 3. 자동화 안정화
동시에 여러 커밋이 들어올 때 JP sync가 생성한 리포트 커밋의 `git push`가 fetch-first로 실패하는 경쟁 상태를 발견했다.

`.github/workflows/sync-jp-data.yml`을 수정하여:
- push 실패 시 최신 main으로 rebase
- 최대 3회 재시도
하도록 보강했다.

검증:
- JP validated data sync run `36981994857`: SUCCESS
- 이후 자동 생성 리포트 커밋 `164a320bcf2f...` 반영

## 4. 브라우저 검증
V7.71.1 smoke run:
- run id: `36981927721`
- P0 startup/control smoke: SUCCESS
- Browser interaction smoke: SUCCESS
- 전체 job: SUCCESS

명시적으로 확인한 항목:
- inheritance V1 engine 로드
- 점수 1~5 범위
- review registry 로드
- V1.1 effect metadata registry 로드
- `engineVersion === inheritance-v1.1`
- 검수 요약 수치 합계 일치
- 친구/그룹 추천도 숨김 유지
- Digital self-select / training-complete reaction
- 같은 우마 서포트 편성 차단
- course payload normalization
- 라멘 / Legends / Masters 가이드
- 모바일 overflow 검사

참고:
- V7.71.1 앱 커밋 직후 첫 smoke run `36981907727`은 GitHub Pages가 새 빌드를 반영하기 전에 current-build 대기에서 timeout이 발생했다.
- 뒤이어 실행된 최신 workflow run `36981927721`은 P0와 interaction 모두 SUCCESS이므로 앱 런타임 실패로 보지 않는다.

## 5. 반드시 유지할 불변조건
향후 수정 전 최신 `main/index.html`을 다시 조회한다.

수정 후 확인:
- `<script>` 정확히 2개
- `STATE_KEY` 정확히 1개
- `serverProfiles.jp` 유지
- `serverProfiles.kr` 유지
- Tazuna support id `30305` 유지
- `friend_manual_` 유지
- `scenarioBase` 0
- cache key 유지:
  - `uma_trainer_v531_db_cache`
  - `uma_trainer_v530_db_cache`

기존 기능을 임의 삭제하지 않는다.

## 6. 다음 우선순위

### A. 계승 효과 데이터 검증/채우기
가장 먼저 할 일.
`inheritance_effects.json`에 검증된 계승 고유기 메타데이터를 단계적으로 추가한다.

우선순위:
1. 챔미/LOH에서 자주 쓰이는 핵심 가속 계승기
2. 중거리/장거리 범용 속도 계승기
3. 특정 코스 전용 계승기
4. 나머지 후보

각 항목은 반드시 출처와 검수 상태를 함께 기록한다.

### B. 엔진 V1.2
효과 데이터가 쌓인 뒤:
- 속도 / 가속 / 복합 / 회복 구분
- 발동 구간
- 현재 코스 종반 시작점과의 거리
- 발동 조건 안정성
- 계승 효과량
- 역할 중복
을 점수 요소로 추가한다.

### C. 외부 비교 검수
GameWith 등 외부 추천과 자체 엔진 결과 차이를 기록한다.
외부 평가는 정답값이 아니라 검증용 비교자료로 사용한다.

검수 상태가 충분히 쌓이고 자체 엔진 정확도가 확인되면:
- 외부 비교 UI는 숨기거나 제거 가능
- 내부 검증 데이터는 유지 권장

## 7. 현재 판단
프로젝트를 재작성할 필요는 없다.
V7.71.1 기준으로 코어 기능, 데이터 자동화, 계승 엔진의 확장 구조가 모두 유지되고 있다.

다음 작업은 새 기능을 넓게 추가하기보다 `inheritance_effects.json`의 검증 데이터 품질을 올리는 것이 가장 중요하다.
