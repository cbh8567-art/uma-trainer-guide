# UMA TRAINER GUIDE HANDOFF V7.79.1

작성일: 2026-10-16
빌드: V7.79.1 WEB
이전: HANDOFF_V7.79.0.md

## 사용자 요청
덱 창 바로 아래에 **스킬 취득 정보 초기화** 버튼을 추가.

## 작업 내용
- `index.html`의 `#deck`과 `#typeSummary` 직후, `#deckSetupSummary` 앞에 `#deckSkillAcquisitionResetBtn` 추가.
- 버튼 문구: `스킬 취득 정보 초기화`.
- 덱 편성·보유 SSR 유지 안내 문구 표시.
- 기존 `clearAllDeckSkillAcquisition()`에 직접 연결. 새로운 삭제 로직을 만들지 않음.
- 해당 함수는 확인창 후 **현재 활성 서버**의 `acquired`, 덱 획득 관련 `eventDone` 및 `eventChoice`, `evolutionPlan`을 초기화하고 UI를 갱신.
- 시나리오 진행 상태용 `:progress:` 기록과 관련 선택 중 보존 대상으로 지정된 항목은 기존 로직대로 유지.
- `state.deck`, `state.owned`, JP/KR 타서버 프로필은 삭제하거나 변경하지 않음.
- 기존 스킬 카운트 초기화 두 버튼은 그대로 유지.

## 코드
- `index.html`: `14fce5aa61a9237ec5c6d6507c06656e76e6a671`
- `.github/workflows/browser-smoke.yml`: 버튼 위치, 확인 취소, 취득 체크 초기화, 덱/보유/JP 서버 데이터 유지 자동 검사
  - `2dab2cd4ee92ca8daa57fefd6d9d9930884bebdb`
  - 테스트 상태 복원 보강 `c1f752f1e6294d9b154f0ce0b2bf9a8e74e0e15b`

## 무결성 점검
- 최신 main/index.html 재조회: V7.79.1
- 두 개의 script 태그, 하나의 STATE_KEY
- serverProfiles.jp/kr 유지
- 30305 타즈나 및 friend_manual_ 유지
- 기존 v531/v530 캐시 키 유지
- scenarioBase 재등장 없음

## 자동 브라우저 검증
GitHub Actions https://github.com/cbh8567-art/uma-trainer-guide/actions/runs/38862221101

최종 성공 여부를 CI 종료 이후 확인해야 함. 사용자 결과에는 성공 검증 후에만 SUCCESS라고 명시.

## 다음 단계
기존 UI 기능은 그대로 보존하고 한국 무인도 공략 실사용 검수에 집중.
