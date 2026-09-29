# UMA Trainer Guide HANDOFF — V7.70.10

## 1. 기준 상태
- 저장소: `cbh8567-art/uma-trainer-guide`
- 앱 버전: **V7.70.10**
- 핵심 앱 커밋:
  - `8c20c9461d3173a33a70764731381a91b8b4a185` — Digital reactions + hard support conflict guards
  - `fc19e4997616e9196388c6ec6c9b79922c6a47ee` — deck suitability summary runtime fix
- CI 커밋:
  - `400b744fdc16a015757854b71cac568480f70950` — V7.70.10 reaction/conflict smoke coverage + optional Vercel target handling
- 기준 파일: `main/index.html`

## 2. V7.70.10 완료 항목

### 2.1 육성 우마와 동일 캐릭터 서포트 완전 차단
기존 V7.70.9의 추천/빈 슬롯/프리셋 차단을 확장했다.

추가 최종 방어:
- `placeAt()`
- `toggleDeckCard()`
- 슬롯 선택 모달
- 드래그/직접 배치 경로
- `confirmCurrentDeck()`

공통 함수:
- `supportUmaConflict()`
- `deckUmaConflicts()`
- `rejectSupportUmaConflict()`

동일 캐릭터 카드는 최종 덱 확정 전에 다시 검사하며, 충돌 슬롯은 디지탄 강조 효과로 안내한다.

### 2.2 친구/그룹 카드 덱 추천도 평균 제외 버그 수정
`renderDeckSetupSummary()`에서 `ratedCards` 미정의로 발생하던 런타임 오류를 수정했다.

현재 계산:
- 스피드 / 스태미나 / 파워 / 근성 / 지능만 평균에 포함
- 친구 / 그룹 제외
- 평가 대상이 없으면 별점 대신 안내 문구 표시

### 2.3 아그네스 디지털 본인 선택 반응
Tenor Post ID:
- `655646444737409102`

아그네스 디지털을 육성 우마무스메로 새로 선택하면 전용 반응 오버레이가 표시된다.

### 2.4 육성 완료 반응
Tenor Post ID:
- `3149270804973690231`

`confirmCompletedTrainingSession()`으로 육성 결과를 최종 저장한 뒤 디지탄 완료 반응을 표시한다.

평상시 좌측 하단 `assets/digital-mascot.gif` 안내 마스코트는 그대로 유지한다.

### 2.5 진행표 오래된 문구 정리
이미 구현된 단계에 남아 있던 `후속 패치` 문구를 현재 기능에 맞게 변경했다.
- ④ 시나리오 플랜 → 주요 선택
- ⑤ 육성 시작 → 준비 완료 후

## 3. 브라우저 자동 검증
최종 성공 run:
- Run ID: `36540980630`
- Head SHA: `400b744fdc16a015757854b71cac568480f70950`
- 결과: **SUCCESS**

확인 로그:
- `P0 V7.70.10 ... PASS`
- `DIGITAL SELF-SELECT / SUPPORT-CONFLICT PASS`
- `DIGITAL TRAINING-COMPLETE REACTION PASS`
- `DIGITAL STEP NAVIGATOR PASS`
- `ABORT UMA PICKER RECOVERY PASS`
- `RACETRACK INFO / TAB RECOVERY PASS`
- `RAMEN THREE-CHOICE PASS`
- `LEGENDS GUIDE PASS`
- `MASTERS GUIDE PASS`
- 모바일 390px: `rowOverflow: 0`
- `TARGET PASS: pages`
- `Deployed browser interaction smoke PASS`

## 4. 배포 상태
- GitHub Pages: V7.70.10 검증 통과
- JP validated data sync: SUCCESS
- Vercel b3st / main: 현재 V7.70.10 제목은 확인되지만 일부 상호작용 대기에서 Timeout이 발생할 수 있어 **optional warning**으로 처리
- Vercel timeout은 GitHub Pages 필수 검증 실패로 취급하지 않는다.

## 5. CI 수정
이전 workflow는 V7.70.8을 하드코딩해 V7.70.9 이후 항상 실패했다.
현재:
- `EXPECTED_BUILD = "V7.70.10"`
- P0 이름/검사 버전 갱신
- 선택 대상 Vercel 실패는 warning
- 필수 GitHub Pages는 실패 시 그대로 CI 실패
- V7.70.10 전용 디지탄 반응/동일 캐릭터 SSR 차단 smoke test 추가

## 6. 필수 불변조건
V7.70.10 작성 시 확인:
- `<script>`: 2개
- `STATE_KEY`: 1개
- `serverProfiles.jp`: 유지
- `serverProfiles.kr`: 유지
- 타즈나 `30305`: 유지
- `friend_manual_`: 유지
- `scenarioBase`: 0
- 기존 DB/cache 구조 유지

## 7. 다음 작업 주의
- 새 서포트 배치 경로를 추가할 경우 반드시 `rejectSupportUmaConflict()`를 거칠 것.
- 아그네스 디지털 반응 소스는 `DIGITAL_REACTIONS` 한 곳에서 관리.
- 새 반응을 무분별하게 추가하지 말 것. 현재 사용자가 확정한 것은 본인 선택 / 육성 완료 2종뿐.
- Tenor 반응은 iframe embed를 사용하므로 외부 서비스 장애 시 평상시 마스코트 기능 자체는 영향받지 않아야 한다.
- 브라우저 정상 여부는 GitHub Pages required target 기준으로 판단.
- 수정 전 항상 최신 `main/index.html` 재조회.

## 8. 다음 채팅 시작용
> 최신 `cbh8567-art/uma-trainer-guide/main/index.html`부터 재조회해 주세요. 현재 앱 기준은 V7.70.10입니다. 육성 우마와 동일 캐릭터 서포트는 placeAt/toggle/슬롯 선택/최종 덱 확정까지 완전 차단되며, 친구/그룹 카드는 덱 추천도 평균에서 제외됩니다. 아그네스 디지털 본인 선택 반응은 Tenor 655646444737409102, 육성 완료 반응은 3149270804973690231만 사용합니다. 최종 browser smoke run 36540980630은 SUCCESS이며 DIGITAL SELF-SELECT / SUPPORT-CONFLICT PASS, DIGITAL TRAINING-COMPLETE REACTION PASS, P0 PASS를 확인했습니다. 기존 기능은 삭제하지 말고 script 2개, STATE_KEY 1개, serverProfiles JP/KR, 30305, friend_manual_, scenarioBase 0을 계속 확인하세요.
