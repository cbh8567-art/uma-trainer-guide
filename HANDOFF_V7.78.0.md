# UMA TRAINER GUIDE HANDOFF V7.78.0 — JP ISLAND FUNCTIONAL COMPLETION

작성일: 2026-10-16
현재 앱 버전: **V7.78.0 WEB**
이전 핸드오버: `HANDOFF_V7.77.0.md`
배포: https://uma-trainer-guide-b3st.vercel.app/
코드: https://github.com/cbh8567-art/uma-trainer-guide

## 1. 작업 범위

JP 무인도 시나리오를 트레이너 가이드의 **육성용 기능 완성판**으로 정리했습니다.

이전 완료 기능 유지:
- JP 하이랜더 111111 SSR/렌탈/덱 평가
- 터커 브라인 SSR 한계돌파별 건설 코스트
- 실제 인게임 이미지 5개 / 시설 레벨 / 본능전개·숙련기교 분기
- 건설 회차별 왼쪽 우선 배치 및 4~5회차 스탯 기반 동적 우선순위
- 건설/평가회 실제 시점 및 턴 체크 18~19개
- 평가회 50%/100% 발전 Pt 목표 입력·잔여값·증감·회차 이동
- 건설 회차별 섬트레권 50%/100% 수동 지급, 사용, 초과 실효, 취소, 다음 계획으로 이월
- 시니어 8월 후반 0/1장 이월 수동 선택 및 9월 전반 2장 지급 체크
- JP/KR 서버별 프로필 저장

## 2. V7.78.0 신규 완결 작업

### 하나로 보는 보유·사용 요약

`islandUnifiedTicketSummary()`:
- 건설 회차 원장 `islandTicketEvents`의 획득·사용·실효를 집계
- 시니어 8월 이월 `islandSeniorCarry` 및 후반 체크 `islandGuideDone`을 **파괴적 마이그레이션 없이 결합**
- 사용자 기록에 따라 누적 획득/사용/실효를 하나의 대시보드에 표시
- 시니어 9월 전반 2장 지급 체크를 완료하지 않았으면 '예정'으로만 표시
- 8월 이월권과 건설권 기록 불일치 경고
- 시니어 후반 사용 기록은 있지만 2장 지급 확인을 하지 않은 경우 경고
- 사용 기록이 가능한 수량을 초과하면 경고
- 시니어 12월 후반 종료 체크 후 남은 권이 있으면 실효 주의 경고

### 시니어 후반 순차 체크 검증

`toggleIslandGuideDone()`:
- 후반 섬트레권 1→2→3회 순서로 체크하도록 검증
- 앞선 사용 체크를 해제하면 이후 사용 체크도 함께 해제해 비연속 기록 방지
- 이월권 0/1장에 따른 사용 가능 개수 유지
- 기존 `islandGuideDone` 값을 보존하며 오래된 기록도 그대로 읽음

### 무인도 육성 대시보드

- 건설 5회차 진행, 전체 턴 체크 수, 현재 보유권, 획득/사용/실효, 후반 잔여권 표시
- 건설·Pt 및 턴 체크로 이동하는 바로가기
- 중요한 보유권·확인권 불일치를 별도 경고

### 무인도 진행 기록 전용 초기화

`resetIslandRunRecords()`:
- 2회 클릭 확인 장치
- 초기화 대상: `islandBuildStep`, `islandBuildDone`, `islandGuideDone`, `islandPtEntries`, `islandSeniorCarry`, `islandTicketEvents`
- 유지 대상: 현재 덱, 계승 우마, SSR 보유 정보, 시나리오 설정 및 JP/KR 다른 프로필
- 앱 전체 초기화가 아닌 무인도 진행 기록만 초기화

## 3. 이번 변경 파일과 커밋

- `index.html`: 메타 빌드 V7.78.0, UI/계산/경고/초기화/바로가기.
  - 커밋 `393eea9ad888b2632dece8778336ec6cd7b415f7`
- `.github/workflows/browser-smoke.yml`: V7.77 기존 경고 문구 수정, V7.78 신규 대시보드 및 시니어 체크·초기화 회귀시험.
  - 커밋 `d0afcb1f06232b2d92271bcecba7f4a89db3e332`
- `data/common/scenarios.json`: 이전 V7.77 데이터 및 공식 규칙 유지, 구조 변경 불필요.

## 4. 검증

현재 최종 V7.78.0 browser smoke:
https://github.com/cbh8567-art/uma-trainer-guide/actions/runs/38856195763

**최종 결과: SUCCESS — GitHub Actions run 38856195763**
- P0 current-build startup and controls smoke: SUCCESS
- Browser interaction smoke test: SUCCESS (GitHub Pages/Vercel)
- 신규 V7.78 검증: 대시보드, 시니어 1→2→3회 순차 체크, 건너뛰기 차단, 보너스 지급 확인 누락 경고, 3장 사용 시 잔여 0장, 중간 해제 시 이후 체크 일괄 해제, 12월 잔여 실효 경고, 건설권과 8월 이월권 불일치 경고, 2단계 초기화 확인 모두 PASS
- 초기화 후 건설·Pt·턴 체크·이월권·권 지급 원장은 모두 비어 있고 **원래 덱 및 덱 확정 상태는 유지**됨을 자동 검증
- 이전 V7.77 half/full, 초과 실효, 기록 취소, 다음 회차 이월 회귀시험도 SUCCESS
- GitHub Pages mirror: SUCCESS
- JP validated data sync: SUCCESS

정적 무결성:
- `index.html` main SHA `66592c59eac53d6d86a413c57e2d9d1b37ab3d04`
- `<script>` 2개
- `STATE_KEY` 1개
- `serverProfiles.jp` / `.kr` 유지
- `30305` 타즈나, `friend_manual_` 유지
- `scenarioBase` 0
- `uma_trainer_v531_db_cache` / `uma_trainer_v530_db_cache` 유지
- 무인도 건설 5회차 원본 이미지 및 포커스 UI 유지

## 5. 자료 출처

- 우마무스메 공식 FAQ: https://support.umamusume.jp/faq/
- 공식 무인도 시나리오: https://umamusume.jp/contents/game/scenario/designyourisland/
- GameWith 현행 공략: https://gamewith.jp/uma-musume/article/show/499493
- VIP Wiki 섬트레권 규칙: https://wikiwiki.jp/vip_umamusu/無人島へようこそ -DESIGN YOUR ISLAND-
- Game8 현행 무인도 공략: https://game8.jp/umamusume/700415
- 4Gamer 사전 플레이/규칙: https://www.4gamer.net/games/414/G041434/20250610058/

## 6. 완성 범위와 한계

- **웹앱에서 사용하는 JP 무인도 공략·진행 체크 기능은 구현 완료**.
- 실제 우마무스메 게임을 대신 조작하지 않으며 스탯/Pt/권 지급은 직접 확인 후 입력.
- 절대 건설 발전 Pt 임계값은 현행 확정 자료 없이 하드코딩하지 않음.
- 서버에 자동으로 육성 플레이 기록을 수집하지 않음.
- 인게임 전체 시나리오 육성을 실제로 플레이한 수동 QA는 미실시. 브라우저 UI/논리 검증과는 별도.

## 7. 추후 유지보수

시나리오 신규 밸런스 조정·KR 출시 때에만:
1. 공식/일본 현행 자료 재확인
2. 한국 서버 도입 여부에 따라 KR 시나리오 접근 허용
3. 기존 코드 임의 삭제 금지
4. 수정 전 latest main 재조회, 수정 후 2 scripts / 1 STATE_KEY / serverProfiles / cache / 30305 / friend_manual_ / 이미지 보존 검사
5. 최신 browser smoke 재실행 및 성공 확인
