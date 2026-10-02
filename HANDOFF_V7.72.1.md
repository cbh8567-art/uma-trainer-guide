# UMA TRAINER GUIDE HANDOFF V7.72.1

작성일: 2026-10-02  
현재 앱 버전: **V7.72.1 WEB**

## 1. 기준 상태
- 저장소: `cbh8567-art/uma-trainer-guide`
- 브랜치: `main`
- V7.72.1 앱 커밋: `6003320fac63052373a07b6e424bb95c7a8dcd3e`
- 이미지 smoke 보강 커밋: `ac9ad7bec1002d9d91927cc2cebcc85b8f1efcd9`
- 이미지 기반 건설 데이터 커밋: `b02bff57a7508f3da66edd6fba8418326712b76c`

## 2. 구현 목적
JP 무인도 하이랜더 111111 가이드에 실제 인게임 건설 계획 이미지를 붙여, 게임 화면과 같은 시각 기준으로 1~5회차 건설을 따라갈 수 있게 한다.

핵심 원칙:
- 임의 제작 아이콘 대신 공략 페이지에 게재된 인게임 건설 계획 캡처 사용
- 이미지 원본 비율 유지
- 이미지 아래에 시설 레벨과 분기 텍스트를 보조 표시
- 이미지 로드 실패 시 텍스트 레벨표로 fallback

## 3. 데이터
`data/common/scenarios.json`의 `scenarios.island.constructionGuide` 추가.

### source
- Game8
- https://game8.jp/umamusume/701156

### 건설 1~5회차
1. 육성 시작 3턴째
   - Speed Lv1 / Stamina Lv1 / Power Lv1 / Guts Lv1 / Wit - / Beach -
2. 메이크 데뷔 후
   - Speed Lv2 / Stamina Lv2 / Power Lv1 / Guts Lv1 / Wit Lv1 / Beach Lv1
3. 주니어 12월
   - Speed Lv3 본능전개 / Stamina Lv3 본능전개 / Power Lv2 / Guts Lv2 / Wit Lv1 / Beach Lv1
4. 클래식 6월
   - Speed Lv4 본능전개 / Stamina Lv4 본능전개 / Power Lv3 숙련기교 / Guts Lv3 숙련기교 / Wit Lv1 / Beach Lv1
5. 클래식 12월
   - Speed Lv5 본능전개 / Stamina Lv5 본능전개 / Power Lv4 숙련기교 / Guts Lv4 숙련기교 / Wit Lv1 / Beach Lv1

### 이미지
Game8가 게재한 인게임 캡처 URL을 그대로 사용.
- build1: `https://img.game8.jp/11514309/0cbb1dffeea274aedefb8e64e1eb20b2.jpeg/original`
- build2: `https://img.game8.jp/11514415/364a31ac2fc6628a87bc52740ca51925.jpeg/original`
- build3/build4: `https://img.game8.jp/11506266/adf3437e1abd08dd67bb783090c1235c.jpeg/original`
- build5: `https://img.game8.jp/11506306/f0ddf0e7d4c903d65c46cd41e35ff4b2.jpeg/original`

## 4. UI
JP + 무인도 시나리오 플랜에서:
- `건설 계획 · 인게임 이미지 기준`
- 1~5회차 카드
- 실제 캡처 이미지
- 시설별 Lv
- 본능전개 / 숙련기교 분기
- 단계별 짧은 운용 메모
를 표시.

CSS:
- `.islandBuildSection`
- `.islandBuildList`
- `.islandBuildCard`
- `.islandBuildImageWrap`
- `.islandBuildImage`
- `.islandBuildLevels`

이미지는 `width:100%`, `height:auto`, `object-fit:contain`으로 원본 비율 유지.

## 5. 브라우저 검증
최신 smoke:
- run id: `36988190678`
- result: **SUCCESS**

추가 검증:
- 건설 카드 5개 렌더
- 건설 섹션 텍스트 존재
- 이미지 5개 DOM 존재
- 각 이미지 `naturalWidth > 0`, `naturalHeight > 0`
- `object-fit: contain`
- 외부 인게임 캡처 실제 로드 성공

기존 전체 smoke도 동시에 SUCCESS.

## 6. 무결성
최신 main:
- title: V7.72.1 WEB
- `<script>`: 2
- `STATE_KEY`: 1
- `serverProfiles.jp`: 유지
- `serverProfiles.kr`: 유지
- support ID `30305`: 유지
- `friend_manual_`: 유지
- `scenarioBase`: 0
- cache keys 유지:
  - `uma_trainer_v531_db_cache`
  - `uma_trainer_v530_db_cache`

JP sync:
- run `36988118352`: SUCCESS

## 7. 다음 우선순위
1. 건설 계획을 단순 표시에서 실제 진행 체크형으로 승격
2. 현재 단계(1~5회차) 선택/자동 이동
3. 현재 스탯을 입력하면 4~5회차에서 파워/근성 등 상한에서 더 먼 스탯을 왼쪽 우선으로 안내
4. 타커 브라인 돌파별 건설 코스트와 칸 수 표시
5. 시설 6종의 Lv별 효과 이미지/설명 추가
6. 본능전개/숙련기교 선택 분기 UI
7. 섬트레권 지급/소멸 타이밍 체크

중요:
- 건설 이미지와 시설 배치는 인게임과 같은 시각 기준을 유지한다.
- 새로 그린 대체 이미지를 기본으로 쓰지 않는다.
- 수치/분기는 공략 자료와 게임 데이터 검증 후 반영한다.
