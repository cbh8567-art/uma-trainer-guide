# UMA TRAINER GUIDE HANDOFF V7.76.0

작성일: 2026-10-14
현재 앱 버전: **V7.76.0 WEB**
이전: `HANDOFF_V7.75.0.md`
GitHub: https://github.com/cbh8567-art/uma-trainer-guide
Web: https://uma-trainer-guide-b3st.vercel.app/

## 1. 이번 패치: 무인도 건설·평가회 시점 정정

기존 V7.75.0는 3~5회차의 **건설 계획** 날짜를 그 직전 **평가회** 날짜처럼 표기하고 있었음. 일본 시나리오 흐름에 맞게 구분.

| 항목 | 발생 시기 |
|---|---|
| 1회차 건설 | 육성 시작 3턴째 |
| 1회차 평가회 | 주니어급 메이크 데뷔 직후 |
| 2회차 건설 | 메이크 데뷔 직후, 평가회 이후 |
| 2회차 평가회 | 주니어급 12월 후반 종료 |
| 3회차 건설 | 클래식급 1월 전반 |
| 3회차 평가회 | 클래식급 6월 후반 종료 |
| 합숙 전 섬트레권 확인 | 클래식급 6월 후반~7월 합숙 전 |
| 4회차 건설 | 클래식급 7월 전반 |
| 4회차 평가회 | 클래식급 12월 후반 종료 |
| 5회차 건설 | 시니어급 1월 전반 |
| 5회차/최종 평가회 | 시니어급 6월 후반 종료 |

시니어 6월 최종 평가회 이후에는 신규 건설 계획 없음. 턴 체크와 데이터의 발생 순서를 보정.
'클래식 합숙 진입 시 무조건 티켓 소멸'처럼 근거가 불충분한 단정은 하지 않고 '합숙 전 남은 권 점검/사용 권장' 안내로 제한.

참조:
- https://umamusume.jp/contents/game/scenario/designyourisland/
- https://www.famitsu.com/article/202506/44881
- https://www.4gamer.net/games/414/G041434/20250610058/
- https://wikiwiki.jp/vip_umamusu/無人島へようこそ -DESIGN YOUR ISLAND-
- https://gamewith.jp/uma-musume/article/show/499493

## 2. Pt 입력 UX

기존 `islandPtEntries` 저장, Pt 게이지 50%/100% 및 평가회 체크를 유지하면서 추가:
- 현재 건설 회차의 `-50`, `+50`, `+100` 수동 증감 버튼
- `adjustIslandPt(buildId,delta)`가 기존 `setIslandPtField`를 사용하므로 같은 입력 유효성 검사와 상태 저장 경유
- 증감 버튼은 게임에서 실제로 획득한 Pt를 자동 계산하지 않는 단순 수동 편의 버튼
- 평가회 턴 체크 행마다 `islandPtSnapshot(buildId)` 상태값을 표시
  - 미입력: 현재/목표 Pt 미입력
  - 계산 가능: 현재 진행률 / 남은 Pt
  - 100%: '게이지 100% 달성 ✓'
- `data-island-jump-build` 클릭 시 해당 회차를 열고 Pt 입력 박스로 스크롤 이동
- 기존 이미지/레벨/건설 좌우 순서·터커 LB 효과·체크 상태 로직 그대로 유지

## 3. 변경 파일/커밋
- `data/common/scenarios.json`: **388481088e4bcc22b537f10427c98e4298bad3d5**
  - 다섯 건설 계획의 발생 날짜 및 평가회 전후 순서 수정
  - `operationTimeline.version=jp-island-turn-check-v3`
  - 시니어 종료 항목 문구 정정
- `index.html`: **67c51d3ac1733a9e272e3076f48bb7d493393de5**
  - V7.76.0, 내장 폴백 건설 날짜, 빠른 Pt 조작, 평가회 진행도 및 점프 버튼
- `.github/workflows/browser-smoke.yml`: **9216a30e576cdc26e95b2ea9b9991e6ca6381113**
  - 시점/순서, Pt 증감, 평가회 진척 뱃지/바로가기 회귀 검증

## 4. 실제 브라우저 회귀시험
GitHub Actions: https://github.com/cbh8567-art/uma-trainer-guide/actions/runs/38576546569

최종 결론: **SUCCESS**
- P0 current-build startup and controls smoke: SUCCESS
- Browser interaction smoke: SUCCESS (GitHub Pages 및 Vercel)
- 실제 무인도 추가 테스트 출력:
  - build3: 클래식급 1월 전반
  - build4: 클래식급 7월 전반
  - build5: 시니어급 1월 전반
  - 회차/평가회 순서 검사: true
  - Pt 버튼: 400→450→550→500
  - 평가회 남은 Pt/55% 표기: true
  - 회차 Pt 바로가기: true
  - 터커 SSR, 덱 피커, JP/KR, 디지탄 동작 등 기존 회귀 테스트 통과
- JP validated data sync: SUCCESS (앱 커밋 기준)
- Deploy GitHub Pages mirror: SUCCESS (앱 커밋 기준)

주의: 코드 커밋 직후의 첫 smoke `38576338654`는 GitHub Pages가 새 버전을 아직 반영하기 전 P0 title 대기 타임아웃으로 실패. 직후 갱신한 테스트 워크플로 `38576546569`에서는 P0 포함 전체 성공.

## 5. 마지막 main/index.html 무결성 확인
- 실제 main index blob: `d6c378930c5a48de1ff8f50e76c13029918761e5`
- V7.76.0 WEB
- `<script>` 2개
- `STATE_KEY` 1개
- `serverProfiles.jp` 및 `serverProfiles.kr` 유지
- ID 30305 타즈나 유지
- `friend_manual_` 유지
- `scenarioBase` 0
- `uma_trainer_v531_db_cache` / `uma_trainer_v530_db_cache` 유지
- `SCENARIOS.island.constructionGuide.plans` 5개 이미지 URL 유지

## 6. 다음 우선순위
1. 실게임에서 Pt 직접 입력 중 곧바로 +50 누르는 포인터/입력 포커스 UX 테스트 (현재 회귀시험은 버튼 클릭·증감 동작 검증).
2. 무인도 평가회 50%/100% 도달 시 지급하는 섬트레권을 턴별 보유/사용 기록과 연동하는 설계. 자동 게임 조작 없음.
3. 한국 서버 무인도 구현 시 JP/KR 출시 시점 확인 후 `serverProfiles` 별 시나리오 사용 가능 여부 유지.
4. 대규모 변경 전 main/index.html 최신본 재조회. 기존 기능 삭제 금지.

## 7. 검증 범위
- GitHub Pages·Vercel 자동화 브라우저 smoke 성공을 근거로 보고한다.
- 게임 인앱을 직접 조작한 검수는 하지 않았다. 실제 게임 화면의 Pt 숫자 입력/편의성을 사용자 플레이에서 한 번 추가 확인 권장.
