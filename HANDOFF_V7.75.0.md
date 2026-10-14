# UMA TRAINER GUIDE HANDOFF V7.75.0

작성일: 2026-10-14
현재 앱 버전: **V7.75.0 WEB**
이전 기준: HANDOFF_V7.74.0.md

## 1. 이번 변경 목표
- 무인도 건설 1~5회차 반기 평가회 목표를 데이터 출처 기준으로 정교화
- 발전 Pt의 게임 내 실제 목표/현재 값을 입력받아 평가회 게이지 상태 계산
- 시니어 9월 전반 이후 2~3장의 섬트레권 사용 체크 구현
- 공식 FAQ와 불일치했던 시니어 합숙/권 소멸 문구 정정

## 2. 중요한 확인 사실
Cygames 공식 FAQ: https://support.umamusume.jp/faq/
Cygames 공식 시나리오: https://umamusume.jp/contents/game/scenario/designyourisland/
GameWith: https://gamewith.jp/uma-musume/article/show/499493
Game8: https://game8.jp/umamusume/700415

- 시니어 8월 후반까지 섬트레권 보유 상한 1장
- 시니어 9월 전반부터 보유 상한 3장
- 시니어 9월 전반에 섬트레권 2장 자동 지급; 이후 추가 획득 없음
- 시니어 여름합숙 진입에 기존 1장이 소멸하지 않음
- 시니어 12월 후반을 넘기면 보유권 전부 실효
- 시니어 8월 후반에 1장을 보유해 이월했으면 9월 이후 총 3장, 없으면 총 2장
- 건설 계획은 반기별이며 1~5회 평가회 건설 게이지를 100%까지 채워 대호평 목표
- 각 계획 Pt는 다음 계획으로 이월되지 않음
- 게이지 중간(50%)과 완성 시점 섬트레권 지급. 따라서 각 건설 계획에서는 2회 발급이 존재.
- 신뢰 가능한 최신 출처에서 '건설 1~5회차 절대 발전 Pt 고정값'을 검증할 수 없어 숫자를 임의 생성하지 않음.
- 시니어 9월 전반 링크 이벤트 시점은 Game8 기준. GameWith 일부 페이지의 9월 후반 표기와 혼재하므로 향후 교차 확인 필요.

## 3. 신규 UI 및 상태
기존 무인도 건설 이미지/터커 LB 비용/동적 순서 유지.

각 건설 회차에 발전 Pt 박스:
- `현재 발전 Pt`, `게이지 목표 발전 Pt` 직접 입력
- 50% 도달 판정 및 100% 대호평 목표 판정
- 남은 Pt, % 표시
- 게임 화면 수치를 기준으로 하며, 고정 목표값을 자동 생성하지 않음

시니어 8월 후반 이월권 선택:
- 아직 미확인 / 0장 / 1장
- 0장: 시니어 후반 사용 체크 2개 (총 턴 체크 18개)
- 1장: 시니어 후반 사용 체크 3개 (총 턴 체크 19개)
- 1→0 변경 시 세 번째 완료 체크 자동 해제

새 server profile 필드:
- `islandPtEntries` (build1~build5 별 current/target)
- `islandSeniorCarry` (null/0/1)
기존 `islandGuideDone`, `islandBuildDone`과 호환하며 서버별로 별도 저장.

새 함수:
- `islandPtSnapshot(buildId)`
- `setIslandPtField(buildId,field,value)`
- `setIslandSeniorCarry(raw)`

타임라인:
- 5회 평가회 체크 추가
- 시니어 9월 전반 섬트레권 2장 지급 체크
- 시니어 후반 2~3회 사용 체크
- 시니어 12월 후반 실효 예방 체크
- 기존 건설·클래식 합숙·링크 이벤트·종료 체크 보존

## 4. 변경된 파일 및 커밋
- `data/common/scenarios.json`
  - 기본 타임라인 및 공식 규칙
  - 커밋 `d0dbae86b97f0348eaf22a7d14e47b7b7ce2f2df`
  - 코어 공략 문구 정정 `31752d5bb1508ed2b9b466cf87d6ccbc927285e9`
- `index.html`
  - V7.75.0 UI, 상태 저장과 입력 계산
  - 커밋 `7227e36f13e4d928158b7bccce116774032cf8f4`
  - 내장 코어 가이드 시점 정정 `61079dbc72cb4a2de40fe9e01ae6245620ea0042`
- `.github/workflows/browser-smoke.yml`
  - 이전 V7.74.0 9개 체크 기대값 → 18개로 수정
  - Pt 449/450/900, 8월 이월 0/1과 2/3회 체크 저장까지 자동 검사
  - 커밋 `1b389f89ab4ca7ec23a88774453267bf51b58e24`

## 5. 검증 결과
- browser smoke run `38541678374` SUCCESS: P0 + browser interaction, GitHub Pages + Vercel
- 테스트 출력: 900Pt 목표, 현재 449→50% 미달, 450→50% 도달, 900→100% 도달
- 이월 0장: 18 체크, 3번째 사용 숨김
- 이월 1장: 19 체크, 3번째 사용 표시
- 3번째 사용 후 이월값 0장으로 변경 시 상태 해제
- 최신 코어 가이드 문구 수정본 smoke run `38542132480`: **SUCCESS**, P0 + browser interaction 전체 통과.
- JP validated data sync `38542132365`: SUCCESS
- GitHub Pages mirror `38542132372`: SUCCESS

## 6. latest main 무결성
- `<script>` 정확히 2개
- `STATE_KEY` 정확히 1개
- `serverProfiles.jp` / `serverProfiles.kr` 유지
- 카드 30305, `friend_manual_` 유지
- `scenarioBase` 0개
- `uma_trainer_v531_db_cache`, `uma_trainer_v530_db_cache` 유지
- 무인도 건설 계획 원본 이미지 다섯 개 유지

## 7. 다음 작업 제안
1. 발전 Pt 입력 UX 검수: 게임 화면의 게이지 '현재 / 목표'가 유저가 쉽게 확인할 수 있는지 실사용 후 판단
2. 시니어 9월 이벤트의 정확한 전반/후반 시점(공략 사이트 간 충돌) 인게임 또는 Cygames 공식 공지로 교차 검증
3. 1~5회 건설 시점과 평가회 순서가 실제 시나리오에서 기대대로 뜨는지 확인
4. 고정 평가회 Pt 숫자를 무검증한 채 하드코딩하지 않기
5. 기존 건설 이미지/일본·한국 서버 분리/기존 코드 보존

수정 전 항상 최신 `main/index.html` 재조회, 수정 후 본문 HTML 두 개 script / STATE_KEY / serverProfiles / 캐시 불변 조건 확인.
