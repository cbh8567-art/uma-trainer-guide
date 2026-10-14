# UMA TRAINER GUIDE HANDOFF V7.77.0

작성일: 2026-10-15
현재 앱 버전: **V7.77.0 WEB**
이전: `HANDOFF_V7.76.0.md`
리포지토리: https://github.com/cbh8567-art/uma-trainer-guide
사이트: https://uma-trainer-guide-b3st.vercel.app/

## 1. 이번 기능: 무인도 섬트레권 지급/사용 원장

실제 일본 게임 자료/공식 FAQ 검증:
- 각 건설 계획(1~5회차)의 발전 게이지 **50% 및 100% 지점**에서 각각 섬트레권 1장 지급
- 시니어 8월 후반까지 1장 보유 상한
- 상한 초과 신규 지급권은 실효
- 보유권은 다음 평가회/건설 계획으로 이월 가능
- 시니어 9월 전반에 조건 없이 2장 지급, 그때부터 상한 3장, 이후 추가 지급 없음
- 시니어 12월 후반 이후 보유권 모두 실효
- 시니어/클래식 7~8월 섬 합숙 중, URA 섬 합숙 중에는 권을 사용하는 섬트레가 불가능
- 클래식 섬 합숙 중 발생한 건설/권 보상은 합숙 종료 후 수령

확인 출처:
- https://umamusume.jp/contents/game/scenario/designyourisland/
- https://support.umamusume.jp/faq/
- https://gamewith.jp/uma-musume/article/show/499493
- https://wikiwiki.jp/vip_umamusu/無人島へようこそ -DESIGN YOUR ISLAND-
- https://www.4gamer.net/games/414/G041434/20250610058/

## 2. 설계 핵심

이 가이드는 게임 자동조작이 아니고 수동 기록 도우미입니다.
- 게이지가 50%/100%에 도달해도 획득 확인 기록을 **자동으로 추가하지 않음**.
- 실제 게임에서 받았을 때 '획득 확인 50%' 또는 '획득 확인 100%' 버튼을 수동 클릭.
- 지급 확인 버튼은 저장된 Pt/current/target 기준 해당 게이지 도달 시 활성화.
- 100% 지급을 기록하기 전에 해당 회차 50% 지급을 먼저 기록해야 함.
- 사용 버튼을 누르면 보유 1장 소비로 원장에 기록.
- 이미 1장 보유 중 신규 획득을 기록하면 초과분 실효 1장으로 기록.
- 사용한 권과 초과 실효된 권은 누적 분리 집계.
- 신규 회차에서도 이전 회차 보유권을 그대로 유지.
- 마지막 기록 취소 버튼으로 정정 가능. 이전 회차로 역순 입력 시 안전하게 차단.
- 건설 회차 원장은 시니어 8월 보유 0/1장 선택과 **별도로 보존**하며 불일치 시 경고.
- 9월 이후 예상 잔여 2~3장은 기존 시니어 후반 사용 체크 상태에서 계산.
- 기존 건설 계획 이미지, 동적 배치, 타즈나 및 서버 분리 구조 모두 유지.

## 3. 새 상태

`SERVER_PROFILE_FIELDS`에 `islandTicketEvents` 추가.
초깃값: `[]`.
이벤트: `{kind:'earn',planId:'build1'~'build5',stage:'half'|'full'}`, 또는 `{kind:'use',planId:'build1'~'build5'}`.
서버 프로필 정규화로 80개 상한 및 허용 필드 검증.

함수:
- `islandTicketLedgerSummary()`
- `recordIslandTicketEarn(buildId, stage)`
- `recordIslandTicketUse(buildId)`
- `undoIslandTicketEvent()`
- `islandSeniorTicketSummary()`

## 4. 변경 파일 및 커밋

- `data/common/scenarios.json`: source links / ticketLedgerGuide / 지급 마일스톤 및 상한/합숙 규칙
  - `3c671d73d81d0899adbff0da171c2be3330ebc8f`
- `index.html`: V7.77.0 본문, 서버별 원장 상태, 건설카드 버튼, 합계 및 8월 이월 대조
  - `e3b0ad78d88215ab3439c21f9e0a56d5ae5e2f95`
- `.github/workflows/browser-smoke.yml`: half/full 기록, 상한 실효, 취소, 소비, 다음 회차 이월, 시니어 8월 불일치 경고 검증 추가
  - `dce06b8c3732e7f768d69f35f8fd940fb647f936`

## 5. 검증

- JP validated data sync (앱 커밋 기준): SUCCESS
- 현재 브라우저 smoke run: `38593356138`
- 결과는 CI 종료 후 재조회·확정 필요. **이 문서 최초 작성 시점에는 완료 전**.
- static 검사: app V7.77.0, script 2개, STATE_KEY 1개, serverProfiles JP/KR, 30305, friend_manual_, 캐시 키 v531/v530 유지, scenarioBase 0.
- 건설 이미지 원본 다섯 개 URL 유지.

## 6. 다음 작업

1. 육성 실전 사용에서 건설 Pt 입력→권 지급 기록→사용 기록 순서가 자연스러운지 점검.
2. 50%/100% 마일스톤 확인 없이도 게임 상태에 따라 사용 여부를 다시 맞추는 수동 정정 UX 검토.
3. 후반 시니어 이월권 선택과 초기 원장을 추후 단일 기록 모델로 통합할지 평가. 현재는 보존/대조 우선.
4. 새로운 시나리오에서 서버별 저장 데이터가 섞이지 않도록 회귀 검증.
5. 검증되지 않은 각 건설 회차 절대 Pt를 하드코딩하지 않기.

작업 전 최신 main/index.html 조회, 기존 기능 삭제 금지. 작업 후 main 재조회/두 script/단일 STATE_KEY/JP·KR 분리 검증.
