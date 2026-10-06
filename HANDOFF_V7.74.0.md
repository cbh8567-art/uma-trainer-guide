# UMA TRAINER GUIDE HANDOFF V7.74.0

작성일: 2026-10-06
현재 앱 버전: **V7.74.0 WEB**

## 1. 이번 변경
JP 무인도 공략을 단순 건설 회차 표시에서 실제 육성 진행용 체크 구조로 확장.

핵심:
- V7.73.0의 `effectiveStatCaps is not defined` 오류 수정
- `v7ResolvedStatCaps('island')`로 무인도 상한 계산 연결
- 건설 1~5회차의 왼쪽 배치 순서 표시
- 4~5회차는 현재 스탯과 상한 차이 기반으로 동적 우선순위 계산
- 무인도 턴 체크 9단계 추가
- 섬트레권 최신 규칙으로 수정
- 턴 체크 상태를 JP/KR 서버별 profile에 저장

## 2. 건설 배치 순서
Game8 현행 하이랜더 기준.

1회차:
- 스피드 → 스태미나 → 근성 → 파워

2회차:
- 해변의 집 → 스피드 → 스태미나 → 지능

3회차:
- 스피드 → 근성 → 스태미나 → 파워
- 스피드/스태미나는 본능전개

4~5회차:
- 스피드/스태미나/파워/근성 중심
- `trainingStatCheck.stats`가 입력되어 있으면 무인도 스탯 상한에서 가장 먼 스탯부터 왼쪽으로 자동 정렬
- 자동 건설을 수행하지 않고 추천 순서만 표시

## 3. 섬트레권 규칙 수정
기존 문구의 오류 수정.

현재 Game8 기준:
- 기본 보유 상한은 1장
- 두 번째 권 획득 전 기존 권 사용 권장
- 클래식급 여름합숙 진입 시 남은 섬트레권 소멸
- 시니어급 여름합숙 진입 시에는 소멸하지 않음
- 시니어급에서는 최대 3장까지 모아 연속 사용 가능
- 4~5인 훈련은 스킬Pt가 넘칠 수 있어 일반 훈련이 더 나을 수 있음

## 4. 무인도 턴 체크
`data/common/scenarios.json > scenarios.island.operationTimeline`

총 9단계:
1. 육성 시작 3턴째 · 1회차 건설
2. 메이크 데뷔 직후 · 2회차 건설
3. 주니어급 12월 · 3회차 건설
4. 클래식급 여름합숙 전 · 섬트레권 소멸 주의
5. 클래식급 6월 · 4회차 건설
6. 클래식급 12월 · 5회차 건설
7. 시니어급 여름합숙 · 섬트레권 저장 가능
8. 시니어급 9월 전반 · 트레센섬의 권유
9. 육성 종료 전 · 발전 Pt 끝까지 확보

건설 체크 항목은 기존 `islandBuildDone`과 연동.
나머지 체크는 신규 `islandGuideDone` 상태에 저장.

## 5. 상태/함수
신규 profile field:
- `islandGuideDone`

신규/보강 함수:
- `islandBuildPlacementOrder(plan)`
- `islandTimelineFallback()`
- `islandTimelineItems()`
- `islandTimelineDone(item)`
- `toggleIslandGuideDone(id)`
- `islandStatPriority()` → `v7ResolvedStatCaps('island')` 사용

## 6. 데이터
수정:
- `data/common/scenarios.json`
  - 각 건설 plan에 `placementOrder`
  - build4/build5에 `dynamicOrder: true`
  - `operationTimeline` 추가

데이터 커밋:
- `ad4ad3f5ae6ad8c6dabbccf909982e5abea5d5d9`

앱 커밋:
- `42493ddf94af1881662513f91e5909c07b393100`

테스트 보강:
- `5826a9feec28f1336c64b448035e78f6aba50ab5`
- `94a14d1ad7f16a2b8e042670c7ae1272d80be9f2`

## 7. 검증
최신 browser smoke:
- run `37448640424`
- P0: SUCCESS
- Browser interaction: SUCCESS
- 전체: SUCCESS

자동 검사:
- V7.73.0의 undefined helper 오류 재발 방지
- 1회차 배치 순서:
  - speed → stamina → guts → power
- 4회차 테스트 스탯 기준 동적 순서:
  - stamina → power → guts → speed
- 턴 체크 9개 렌더
- 비건설 체크 상태 저장
- 건설 체크 시 `islandBuildDone` 연동 및 다음 회차 자동 이동
- 최신 시니어 합숙 섬트레권 규칙 문구 확인

JP validated data sync:
- V7.74.0 앱 커밋 기준 SUCCESS

## 8. 최신 main 무결성
- V7.74.0 WEB
- `<script>` 2개
- STATE_KEY 1개
- serverProfiles.jp 유지
- serverProfiles.kr 유지
- support 30305 유지
- friend_manual_ 유지
- scenarioBase 0
- cache key 유지:
  - `uma_trainer_v531_db_cache`
  - `uma_trainer_v530_db_cache`
- 이전 잘못된 `effectiveStatCaps` 호출 없음

## 9. 다음 우선순위
1. 발전 Pt 목표/평가회 기준 수치 검증 후 턴 체크에 목표값 추가
2. 섬트레권 획득 임계 Pt가 검증 가능하면 현재 Pt 입력 기반 경고 추가
3. 시니어 여름 이후 1~3장 연속 섬트레 사용 구간을 실제 체크형으로 확장
4. 건설 4~5회차 동적 순서를 인게임 이미지 옆에 더 시각적으로 강조
5. 무인도 가이드 실사용 후 111111 외 변형 덱 대응

중요:
- 검증되지 않은 발전 Pt 수치는 자동 추천에 넣지 않는다.
- 건설 이미지는 기존 인게임 이미지와 원본 비율을 유지한다.
- 기존 기능을 임의 삭제하지 않는다.
