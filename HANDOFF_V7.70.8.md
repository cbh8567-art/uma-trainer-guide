# UMA Trainer Guide HANDOFF — V7.70.8

## 1. 기준 상태
- 저장소: `cbh8567-art/uma-trainer-guide`
- 앱 기준 버전: **V7.70.8**
- 앱 구현 커밋: `e6f70cddf19e86e8869b726ff26e34fd0869b1c0`
- 최종 브라우저 검증 워크플로 커밋: `45f49bad532e9334af834854c8578e4432a6f294`
- 기준 파일: `main/index.html`
- 기존 기능 삭제 금지. 수정 전 항상 최신 `main/index.html` 재조회.

## 2. 이번 작업 목적
1. 육성 포기 후 육성 우마무스메 선택창이 다시 열리지 않는 문제 수정.
2. 움직이는 치비 아그네스 디지털을 단순 장식에서 **다음 행동 안내 내비게이터**로 확장.
3. 사용자가 미완료 단계/선택지를 놓쳤을 때 말풍선 안내.
4. 디지탄 클릭 시 해당 선택창 또는 단계로 바로 이동.
5. 기존 드래그 이동 기능과 클릭 내비게이션이 충돌하지 않도록 분리.

## 3. 완료된 구현

### 3.1 육성 포기 복구
`abortTrainingSession()`에서 `resetActiveTrainingSession()` 후 다음 렌더 프레임에 `openUmaPicker('current')`를 호출한다.

결과:
- 육성 포기 확인
- 현재 육성 우마/진행 상태 초기화
- 덱 페이지 복귀
- **육성 우마무스메 선택 모달 자동 재오픈**

완료 확정(`confirmCompletedTrainingSession`)은 기존 동작을 유지하며 자동 선택창을 띄우지 않는다.

### 3.2 디지탄 말풍선
고정 GIF 마스코트 안에 `#digitalMascotBubble`을 추가했다.

현재 안내 우선순위:
1. 육성 우마 미선택 → 육성 우마 선택창
2. 육성 우마 미확정 → ① 육성 우마 확정 영역
3. 계승 부모 미선택 → 빠진 부모의 선택창
4. 계승 미확정 → ② 계승 확정 영역
5. 서포트 6칸 미완성 → 첫 빈 슬롯 선택
6. 덱 미확정 → ③ 덱 확정 버튼
7. 시나리오 주요 선택 미선택 → ④ 시나리오 플랜
8. 트레센켄 목표 궁극 라멘 미선택 → ④ 시나리오 플랜
9. 시나리오 플랜 미확정 → 플랜 확정 버튼
10. ①~④ 완료 → 육성 시작 버튼
11. 육성 중 SSR/시나리오/궁극 라멘 실제 선택 미확정 → 첫 미확정 선택
12. 육성 중 주요 선택 완료 → 육성 완료 버튼

말풍선은 마스코트가 화면 오른쪽에 있을 경우 자동으로 왼쪽 방향으로 뒤집힌다.

### 3.3 디지탄 클릭 내비게이션
- 마스코트 클릭: 현재 가장 먼저 해결해야 할 단계로 이동.
- Enter/Space 키도 동일 동작.
- 이동한 목표에는 `.digitalGuideTarget` 핑크 펄스 강조 표시.
- 필요한 경우 덱 탭을 자동으로 연 뒤 이동.

### 3.4 드래그와 클릭 분리
기존 V7.70.7의 드래그 기능 유지.
- 약 6px 이상 움직였으면 드래그로 판정.
- 드래그 직후 발생하는 click은 잠시 억제해 내비게이션 오작동 방지.
- 마스코트 위치는 `uma_trainer_digital_mascot_pos_v1`에 저장.
- 새로고침/창 크기 변경 후 화면 안으로 보정.

## 4. 실제 브라우저 검증 결과

최종 GitHub Actions run:
- Run ID: `36534901232`
- Job ID: `109296597632`
- 결과: **SUCCESS**

확인된 로그:
- `P0 V7.70.8 BROWSER PASS`
- `DIGITAL MASCOT DRAG PASS`
- `DIGITAL STEP NAVIGATOR PASS`
- `ABORT UMA PICKER RECOVERY PASS`
- `RACETRACK INFO / TAB RECOVERY PASS: 13`
- 모바일: viewport 390px / documentWidth 375px / rowOverflow 0
- `TARGET PASS: pages`
- `TARGET PASS: vercel-b3st`
- `Deployed browser interaction smoke PASS`

배포 참고:
- GitHub Pages: V7.70.8 검증 통과
- `uma-trainer-guide-b3st.vercel.app`: V7.70.8 검증 통과
- `uma-trainer-guide.vercel.app`: 검증 시점 V7.70.5로 stale 경고

## 5. 필수 불변조건 재검사
- `<script>`: 2개
- JS #1 문법: PASS
- JS #2 문법: PASS
- `STATE_KEY`: 1개
- `serverProfiles.jp`: 유지
- `serverProfiles.kr`: 유지
- 타즈나 `30305`: 유지
- `friend_manual_`: 유지
- `scenarioBase`: 0
- `CACHE_KEY='uma_trainer_v531_db_cache'`: 유지
- `LEGACY_CACHE_KEY='uma_trainer_v530_db_cache'`: 유지

## 6. 관련 자산
- `assets/digital-mascot.gif`
- 업로드한 치비 아그네스 디지털 GIF 원본 사용.
- 파비콘과 화면 마스코트가 동일 자산을 참조.

## 7. 다음 작업 시 주의
- 디지탄 말풍선 로직은 `currentDigitalMascotGuidance()`에서 중앙 관리한다.
- 새 준비 단계나 필수 조건을 추가할 경우 이 함수에도 우선순위를 추가해야 한다.
- `pendingChoiceItems()`가 육성 중 실제 미확정 선택의 공통 소스다. 별도 중복 판정 로직을 만들지 않는 것이 좋다.
- `abortTrainingSession()`과 완료 확정은 동작이 다르다. 완료 확정까지 자동 우마 선택 모달을 열지 말 것.
- 드래그 기능 변경 시 클릭 내비게이션 억제 로직(`suppressGuideClick`)을 보존할 것.
- 브라우저 테스트 전 정상 작동을 단정하지 말 것.

## 8. 다음 채팅 시작용 지시문

> `cbh8567-art/uma-trainer-guide`의 최신 `main/index.html`부터 실제로 다시 조회해 주세요. 현재 앱 기준은 V7.70.8이며 핵심 앱 구현 커밋은 `e6f70cddf19e86e8869b726ff26e34fd0869b1c0`, 최종 브라우저 검증 워크플로 커밋은 `45f49bad532e9334af834854c8578e4432a6f294`입니다. V7.70.8에서 육성 포기 후 육성 우마 선택 모달 자동 복구, 치비 디지털 말풍선 안내, 미완료 단계 자동 판정, 디지탄 클릭 시 해당 단계 이동을 구현했습니다. 기존 V7.70.7 드래그 및 위치 저장은 유지됩니다. 최종 browser smoke run 36534901232는 SUCCESS이며 DIGITAL STEP NAVIGATOR PASS / ABORT UMA PICKER RECOVERY PASS / P0 PASS를 확인했습니다. 기존 기능은 삭제하지 말고 script 2개, 두 JS 문법, STATE_KEY 1개, serverProfiles JP/KR, 30305 타즈나, friend_manual_, scenarioBase 0, 캐시 키를 계속 확인하세요.
