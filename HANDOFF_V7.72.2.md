# UMA TRAINER GUIDE HANDOFF V7.72.2

작성일: 2026-10-02
현재 앱 버전: **V7.72.2 WEB**

## 1. 이번 변경
JP 무인도 건설 가이드를 이미지 나열형에서 실제 진행 체크형으로 변경.

추가 상태:
- `islandBuildStep`: 현재 보고 있는 건설 회차 1~5
- `islandBuildDone`: 회차별 완료 체크

두 값 모두 서버별 profile에 저장되며 JP/KR 상태 분리를 유지.

## 2. UI 동작
JP + 무인도에서:
- 1~5회차 네비게이션 표시
- 현재 회차의 인게임 건설 이미지 1장만 크게 표시
- 시설 Lv / 분기 / 메모 표시
- `이 건설 완료 ✓` 버튼
- 완료 시 해당 회차 체크 및 다음 회차로 자동 이동
- 완료 취소 가능
- 이전 / 다음 버튼
- `진행 N / 5` 및 다음 건설 시점 표시

이미지는 기존과 동일하게 원본 비율 유지:
- width 100%
- height auto
- object-fit contain

## 3. 핵심 함수
- `setIslandBuildStep(step)`
- `toggleIslandBuildDone(id)`
- `islandBuildProgressSummary()`

## 4. 검증
앱 커밋:
- `7068123418534f952422123829ca91b9e8fd7d0b`

CI 보강:
- `ed0c8c02f80fa4d45e4939c1e17dc6da3e8d480a`

최신 browser smoke:
- run `36996860910`
- P0: SUCCESS
- Browser interaction: SUCCESS
- 전체: SUCCESS

자동 테스트 확인:
- 건설 단계 네비게이션 5개 이상
- 한 번에 focus 카드 1개
- 1회차 이미지 실제 로드
- 원본 비율 contain
- build1 완료 후 `islandBuildStep === 2`
- build1 완료 상태 저장
- 진행 문구 `진행 1 / 5`
- 5회차 직접 이동 및 이미지 로드

참고:
- 앱 커밋 직후 run `36996799399`은 이전 CI가 이미지 5개 동시 렌더를 기대해 실패.
- UI를 1장 focus 구조로 바꾼 것이 원인으로, 앱 런타임 오류가 아님.
- CI를 현재 UI 구조에 맞게 수정한 최신 run `36996860910`이 SUCCESS.

JP sync:
- run `36996799463`: SUCCESS

## 5. 최신 main 무결성
최신 main index SHA 확인 시점:
- `2ff9997200e7c26ce1f5b91b4575ca1510ea993b`

확인:
- V7.72.2 WEB
- script 2개
- STATE_KEY 1개
- serverProfiles.jp 유지
- serverProfiles.kr 유지
- support 30305 유지
- friend_manual_ 유지
- scenarioBase 0
- v531/v530 cache key 유지

## 6. 다음 우선순위
1. 타커 브라인 돌파별 건설 코스트/칸 수 표시
2. 각 건설 회차에서 실제 배치 순서를 더 직관적으로 표시
3. 시설 6종 Lv별 효과
4. 본능전개 / 숙련기교 분기 설명 강화
5. 현재 스탯 기반 4~5회차 우선순위 보조
6. 섬트레권 지급/소멸 타이밍 체크

중요 원칙:
- 건설 이미지는 인게임과 동일한 시각 기준을 유지.
- 확정되지 않은 수치/루트는 자동 추천에 넣지 않음.
