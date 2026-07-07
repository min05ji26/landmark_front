# WanderSteps — 걸음으로 세계를 여행하는 앱

> 걷는 만큼 세계 랜드마크에 가까워진다

스마트폰 가속도 센서로 걸음 수를 측정하고,  
목표 걸음 수를 달성하면 세계 각지의 랜드마크를 하나씩 정복하는 **걷기 게임화 모바일 앱**입니다.  
친구와 함께 랭킹을 겨루고, 업적을 쌓아가세요.

---

## 서비스 개요

| 항목 | 내용 |
|------|------|
| 플랫폼 | React Native (Expo) — iOS / Android |
| 걸음 측정 | 가속도 센서 (expo-sensors Accelerometer) |
| 인증 | JWT (expo-secure-store) |
| 내비게이션 | React Navigation (Stack Navigator) |
| 백엔드 연동 | REST API (`http://localhost:8080`) |

---

## 주요 기능

### 걸음 수 측정 & 랜드마크 달성
- 앱 실행 중 가속도 센서로 걸음 수 자동 측정
- 10초마다 서버에 걸음 수 동기화
- 목표 걸음 수 달성 시 랜드마크 잠금 해제

### 랜드마크
현재 등록된 여행지: **부산 · 오사카 · 파리 · 미국 · 중국 · 인도 · 이집트 · 호주**

### 소셜 기능
- 친구 요청 / 수락 / 거절
- 주간 랭킹 (걸음 수 기준)
- 친구 프로필 열람

### 업적 시스템
- 누적 걸음 수 기반 업적 달성
- 업적 달성 시 알림 발송

### 알림
- 친구 요청·수락 알림
- 업적 달성 알림
- 우측 슬라이드 드로어로 확인 / 삭제

---

## 화면 구성

```
src/screens/
├── AuthScreen.js          # 로그인 / 회원가입 / 아이디 찾기 / 비밀번호 찾기
├── HomeScreen.js          # 오늘 걸음수, 목표까지 남은 걸음, 알림, 메인 메뉴
├── LandmarkScreen.js      # 랜드마크 목록 (검색, 잠금 여부 표시)
├── LandmarkDetailScreen.js# 랜드마크 상세 정보
├── RankingScreen.js       # 주간 걸음 수 랭킹
├── AchievementScreen.js   # 업적 목록 및 달성 현황
├── ProfileScreen.js       # 내 프로필 (프로필 이미지, 닉네임 등)
├── FriendListScreen.js    # 친구 목록 / 친구 검색
└── FriendProfileScreen.js # 친구 프로필 열람
```

---

## 아키텍처

```
[스마트폰 센서]
  Accelerometer (100ms 간격 감지)
  → magnitude > 1.2 && 350ms 쿨다운 → 걸음 카운트
  → 10초마다 서버 동기화 (POST /api/steps/sync)

[앱 구조]
  App.js
  ├── 로그인 상태 관리 (isLoggedIn)
  ├── 걸음 수 전역 관리 (todayStepCount)
  └── Stack Navigator
       ├── 비로그인: AuthScreen
       └── 로그인: Home → Landmark / Ranking / Achievement / Profile / FriendList

[인증]
  로그인 성공 → JWT 토큰 expo-secure-store 저장
  API 요청 시 Authorization: Bearer {token} 헤더 포함
  토큰 만료(401) → 자동 로그아웃
```

---

## 사용자 흐름

```
[앱 실행]
  ↓
[로그인 / 회원가입]
  아이디·비밀번호 찾기 지원 (이메일 인증)
  ↓
[홈 화면]
  오늘 날짜 / 닉네임 인사
  총 걸음 수 (서버 누적 + 오늘 측정값)
  목표 랜드마크까지 남은 걸음 수
  우측 상단 🔔 → 알림 드로어 (친구 요청, 업적 알림)
  ↓
  ┌─────────────────────────────────┐
  │  메뉴                           │
  │  🏯 랜드마크  현재 위치 표시     │
  │  🥈 랭킹      내 순위 표시       │
  │  🏆 업적      달성 현황          │
  └─────────────────────────────────┘
  ↓
[랜드마크]
  전체 목록 검색 / 페이지네이션
  잠금된 랜드마크 → 팝업으로 필요 걸음 수 안내
  달성된 랜드마크 → 상세 정보 열람

[랭킹]
  주간 걸음 수 기준 순위
  유저 클릭 → 프로필 미리보기

[업적]
  누적 걸음 수 기반 달성 조건 확인
  미달성 업적 진행률 표시

[내 프로필]
  프로필 이미지 변경
  닉네임 / 총 걸음 수 확인

[친구]
  닉네임으로 유저 검색 → 친구 요청
  친구 목록 확인 → 친구 프로필 열람
```

---

## 백엔드 연동 API

백엔드는 별도 레포에서 관리하며, 기본 주소는 `http://localhost:8080`입니다.  
(실기기에서는 Expo가 자동으로 개발 PC의 로컬 IP를 감지해 연결합니다.)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/steps/sync` | 걸음 수 서버 동기화 |
| GET | `/api/home` | 홈 데이터 (닉네임, 걸음수, 랭킹, 랜드마크 목표) |
| GET | `/api/user/info` | 내 정보 (프로필 이미지 포함) |
| GET | `/api/landmarks` | 랜드마크 목록 |
| GET | `/api/achievements/list` | 업적 목록 |
| GET | `/api/ranking` | 주간 랭킹 |
| GET | `/api/notifications` | 알림 목록 (페이지네이션) |
| GET | `/api/notifications/unread-count` | 읽지 않은 알림 수 |
| DELETE | `/api/notifications/:id` | 알림 삭제 |
| POST | `/api/notifications/:id/accept` | 친구 요청 수락 |
| POST | `/api/notifications/:id/reject` | 친구 요청 거절 |

---

## 시작하기

```bash
npm install
npx expo start
```

| 환경 | 실행 방법 |
|------|-----------|
| iOS 시뮬레이터 | `npx expo start --ios` |
| Android 에뮬레이터 | `npx expo start --android` |
| 실기기 (Expo Go) | QR 코드 스캔 |
| 웹 | `npx expo start --web` (센서 미지원) |

> 실기기 실행 시 백엔드 서버와 같은 와이파이에 연결되어야 합니다.  
> Expo가 자동으로 개발 PC의 IP를 감지하며, 감지 실패 시 `constants.js`에서 IP를 직접 수정하세요.

### 주요 의존성

```
expo ~54.0
expo-sensors ~15.0      # 가속도 센서
expo-secure-store ~15.0 # JWT 토큰 저장
expo-image-picker ~17.0 # 프로필 이미지
@react-navigation/native ^7.1
react-native 0.81.5
```
