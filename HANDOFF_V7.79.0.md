# UMA TRAINER GUIDE HANDOFF V7.79.0 — KR ISLAND RELEASE

작성일: **2026-10-16**
빌드: **V7.79.0 WEB**
이전: `HANDOFF_V7.78.0.md`
사이트: https://uma-trainer-guide-b3st.vercel.app/
저장소: https://github.com/cbh8567-art/uma-trainer-guide

## 1. 한국 서버 출시 확인

한국 공식 카카오톡 채널(https://pf.kakao.com/_DzxjIb/posts)에 따르면
- 육성 시나리오 **「무인도에 어서 오세요 -DESIGN YOUR ISLAND-」**: 2026-10-16(금) 점검 완료 후 공개
- 무인도 공개 기념 캠페인: 2026-10-16 점검 완료 후 시작
- 지정 시나리오 '무인도' 트레이너 기능 시험: 2026-10-16 점검 후 ~ 10-26 11:59

최신 한국 공개 시점을 기준으로 기존 KR 진입 제한을 해제.

## 2. 한국 서버 기능

- `KOREA_SCENARIO_IDS`에 `island` 추가
- KR에서 시나리오 `island` 선택/확정/육성 계획/건설/턴 체크/평가회 발전 Pt/섬트레권 원장 및 시니어 후반 관리 이용 가능
- `renderScenarioPlan()`의 JP 전용 조건 제거: 현재 활성 서버가 KR 또는 JP인 경우 무인도 상세 UI 표시
- SSR 터커 브라인 ID `30257`을 캐릭터명 KO/JP 별칭 포함해 정확히 인식
- 기존 KR SSR 공개 범위 `KOREA_SERVER_DATA.supportMaxId` 안에 터커 SSR이 있으므로 카드 전체 카탈로그의 필터를 불필요하게 확장하지 않음
- 시나리오 관련 통계/건설 이미지/터커 코스트/진화 스킬/훈련 시점/마일스톤 수치 자체는 V7.78.0 검수 자료 유지

## 3. 한국어 우선 UI

- 시나리오 목록 최상단: `무인도에 어서 오세요 -DESIGN YOUR ISLAND-`
- 한국 서버 모드 상단에 도입 안내와 `한국 무인도 육성 공략 열기 →` 바로가기
- 시나리오 공략 제목 `한국 서버 · 무인도에 어서 오세요`; 2026-10-16 한국 도입 표시
- 한국 공식 카카오톡 채널 공지 링크
- 일본 자료 기반 건설 배치/추천은 '한국 서버의 실제 게임 화면과 대조할 참고값'이라고 명시
- 한국 서버 이벤트 선택지의 스킬명은 기존 `koSkill()`로 찾은 한국어 표기 우선; 번역 미등록이면 일본어 원문 유지
- 시나리오 목록의 기존 주요 항목도 한국어명을 일본어보다 앞에 표시
- `islandStatPriority()`는 무인도 이외 시나리오에서 입력된 이전 스탯을 무인도 건설 우선순위에 잘못 사용하지 않음

## 4. 기본 서버와 기존 데이터 호환

- **저장값 없는 첫 방문:** 한국 서버 KR가 초기 선택되고 기본 시나리오는 무인도
- 신규 JP 프로필 기본 시나리오는 기존 `tresenken`, KR와 별도로 초기화
- **기존 `serverProfiles`가 저장된 이용자:** 기존 `activeServer`·시나리오·덱·Pt/턴 체크 값을 유지함
- V5.13 이하 저장 데이터 이관 경로: 기존 legacy 복제 동작 유지
- 이미 KR에서 다른 시나리오 육성 중 바로가기를 클릭할 경우 확인을 먼저 받으며, JP 모드에서 바로가기를 눌러도 저장된 KR 쪽 진행 중 육성이 있다면 확인 없이 전환/초기화하지 않음
- 일본 서버 전환 시 이전 JP 무인도 기능과 데이터 그대로 유지
- 일본/KR 서포트 SSR 리스트 및 육성 우마 구현 제한/별도 서버별 저장 유지

## 5. 주요 변경 커밋

- `data/common/scenarios.json`:  `85e324df07880d0f41e55ce65dff54876979ed08`
- `index.html` KR 모드/가이드/UI: `1441c553fde326d1f257e18254de6d72304f601b`
- `index.html` 이벤트 스킬명 한국어 우선: `21ef8801a9efd4383d3bbed2fe3f82d47791fbc7`
- `index.html` 신규 JP/KR 독립 기본 프로필: `7333570fc25398e6cf7222711142344b59ed5d39`
- `index.html` 타서버 진행 중 육성 바로가기 보호: `93d2047020abdaffb1e23b75ba56cc9e8a9683e2`
- `.github/workflows/browser-smoke.yml` 한국 기본값·KR UI·터커·JP 분리 회귀 검사: `1af5078224b7b6ce4082f63d26fcd6fe953cb40d`
- 테스트 글로벌 수정: `8e75cbaa968f3d03f0f70ed8e6bcc401b8fd3931`
- 신규 JP 초기값 검사: `6d33dd3db8868e4615624fc6c8d9d1452ffed0bf`
- 진행 중 KR 육성 보호 검사: `738e6946761782f112491b7fa95efe5d8c5515f1`

## 6. 검증

- GitHub Pages 배포: **SUCCESS** (핵심 코드 커밋)
- JP validated data sync: **SUCCESS**
- 기본 KR 시나리오·KR 무인도 안내·Tucker SSR·JP 모드 분리 브라우저 run 38860720028: **SUCCESS**
- 최종 브라우저 smoke는 진행 중이므로 CI 종료 후 결과를 확인해 이 항목에 덧붙일 것:
  https://github.com/cbh8567-art/uma-trainer-guide/actions/runs/38861264633
- 최신 main 정적 재조회: build V7.79.0, script 2, STATE_KEY 1, serverProfiles jp/kr 유지, `30305` 및 `friend_manual_` 유지, `scenarioBase` 0, DB 캐시 키 2개 유지, 기존 건설 이미지 5개 유지

## 7. 정확성/보존 범위

- 공식적으로 KR 시나리오 출시 확인.
- 건설 추천·일부 스킬 선택 정보는 일본 Game8 / GameWith 원본 공략 기반으로서 **한국 게임 내 검수와 별개의 참고 자료**라는 것을 UI에서 표시.
- **실제 한국 게임 안에서 모든 턴을 직접 육성·플레이한 검증은 시행하지 않음**.
- 신규 한국 육성 우마/SSR의 실시간 DB 확장은 별도 데이터 확인 후 수행 (출시 시나리오 반영을 이유로 KR 카드 경계를 일괄 해제하지 않음).
- 앱 전체 기능 및 과거 서버별 육성/덱 프로필 삭제 금지.

## 8. 차후 관리

새로운 한국 버전 스킬명 및 실제 UI 수치/이벤트 시점을 받은 경우, 원본 출처 확인 후 점진적 정정.
작업 전에 최신 main/index.html 재조회, 작업 후 script 2개/STATE_KEY 1개/JP·KR 프로필/30305/friend_manual_/cache keys 및 브라우저 smoke 검증.
